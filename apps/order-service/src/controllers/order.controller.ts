import { NotFoundError, ValidationError } from "@packages/error-handler";
import { NextFunction, Response } from "express";
import Stripe from "stripe";
import prisma from "@packages/libs/prisma";
import redisClient from "@packages/libs/reddis";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

interface OrderItemSnapshot {
  productId: string;
  shopId: string;
  sellerId: string;
  title: string;
  primaryImage: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  selectedOptions: any;
}

// TTL for checkout session in seconds (30 minutes)
const REDIS_SESSION_TTL = 1800;

// Use apiVersion: null to avoid TypeScript literal mismatch with installed stripe types
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

export const createPaymentIntent = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { amount, sellerStripeAccountId, sessionId } = req.body;

    if (!amount || !sessionId || !sellerStripeAccountId) {
      return next(new ValidationError("Missing required payment fields"));
    }

    const userId = req.user?.id;
    if (!userId) {
      return next(new ValidationError("User not authenticated"));
    }

    // Stripe requires exact integer amount in cents
    const customerAmount = Math.round(amount * 100);

    // Platform fee (optional)
    const platformFee = Math.floor(customerAmount * 0.1);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: customerAmount,
      currency: "usd",
      payment_method_types: ["card"],

      // Required for Stripe Connect (marketplace payouts)
      application_fee_amount: platformFee,
      transfer_data: {
        destination: sellerStripeAccountId,
      },

      // Metadata keys MUST match webhook
      metadata: {
        sessionId,
        userId,
      },
    });

    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Stripe error:", error);
    return next(error);
  }
};

// Payment session
export const createPaymentSession = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { cart, selectedAddressId, coupon } = req.body;
    const userId = req.user?.id;

    // Basic validation
    if (!userId) return next(new ValidationError("Authentication required"));
    if (!Array.isArray(cart) || cart.length === 0) {
      return next(new ValidationError("Cart is empty or invalid"));
    }

    // Normalize cart items: ensure we use productId consistently (frontend uses item.id)
    const normalizedItems = cart.map((item: any) => ({
      productId: String(item.id), // normalize to string
      quantity: Number(item.quantity || 1),
      sale_price: Number(item.sale_price || 0),
      shopId: String(item.shopId),
      selectedOptions: item.selectedOptions || {},
    }));

    // Build a canonical JSON string for comparison (sort by productId)
    const canonicalCart = JSON.stringify(
      normalizedItems
        .map((it: any) => ({
          productId: it.productId,
          quantity: it.quantity,
          sale_price: it.sale_price,
          shopId: it.shopId,
          selectedOptions: it.selectedOptions || {},
        }))
        .sort((a: any, b: any) => a.productId.localeCompare(b.productId))
    );

    // Detect existing sessions for the same user with identical cart
    const keys = await redisClient.keys("payment-session:*");
    for (const key of keys) {
      const data = await redisClient.get(key);
      if (!data) continue;
      try {
        const session = JSON.parse(data);
        if (session.userId !== userId) continue;

        const existingCanonical = JSON.stringify(
          (session.cart || [])
            .map((it: any) => ({
              productId: String(it.productId || it.id || it.id),
              quantity: Number(it.quantity || 1),
              sale_price: Number(it.sale_price || 0),
              shopId: String(it.shopId),
              selectedOptions: it.selectedOptions || {},
            }))
            .sort((a: any, b: any) => a.productId.localeCompare(b.productId))
        );

        if (existingCanonical === canonicalCart) {
          // Found identical session for this user; return it
          const existingSessionId = key.split(":")[1];
          return res.status(200).json({ sessionId: existingSessionId });
        }
      } catch (err) {
        // ignore malformed session JSON
        continue;
      }
    }

    // Validate products in DB (existence, correct price, stock)
    const uniqueProductIds = Array.from(new Set(normalizedItems.map((it: any) => it.productId)));
    const products = await prisma.products.findMany({
      where: { id: { in: uniqueProductIds } },
      select: {
        id: true,
        sale_price: true,
        stock: true,
        title: true,
        images: true,
        shopId: true,
      },
    });

    const productMap = new Map(products.map((p: any) => [p.id, p]));

    // Validate each cart item: product exists, price matches (or use DB price), and stock available
    for (const it of normalizedItems) {
      const prod = productMap.get(it.productId);
      if (!prod) {
        return next(new ValidationError(`Product not found: ${it.productId}`));
      }

      // Price validation: prefer DB price (trust DB). If frontend price differs, we'll store clientPrice separately in session
      if (Number(prod.sale_price) !== Number(it.sale_price)) {
        // Reject if prices differ — force fresh client recalculation
        return next(new ValidationError(`Price mismatch for product ${it.productId}. Please refresh your cart.`));
      }

      if (prod.stock < it.quantity) {
        return next(new ValidationError(`Insufficient stock for product ${it.productId}`));
      }
    }

    // Build seller/shop mapping (unique shopIds)
    const uniqueShopIds = Array.from(new Set(normalizedItems.map((it: any) => it.shopId)));

    // Fetch shops to map seller stripe accounts
    const shops = await prisma.shops.findMany({
      where: { id: { in: uniqueShopIds } },
      select: {
        id: true,
        sellerId: true,
        name: true,
        sellers: { select: { stripeId: true } },
      },
    });

    // sellerData: [{ shopId, sellerId, stripeAccountId }]
    const sellerData = shops.map((shop: any) => ({
      shopId: shop.id,
      sellerId: shop.sellerId,
      stripeAccountId: shop.sellers?.stripeId || null,
      shopName: shop.name,
    }));

    // Compute totalAmount (sum of sale_price * quantity)
    const totalAmount = normalizedItems.reduce((sum: number, it: any) => {
      return sum + Number(it.sale_price) * Number(it.quantity);
    }, 0);

    // Create session payload
    const sessionId = uuidv4();
    const sessionData = {
      userId,
      cart: normalizedItems,
      sellers: sellerData,
      totalAmount,
      shippingAddressId: selectedAddressId || null,
      coupon: coupon || null,
      createdAt: new Date().toISOString(),
    };

    // Store in redis with TTL 30 minutes
    await redisClient.setex(`payment-session:${sessionId}`, REDIS_SESSION_TTL, JSON.stringify(sessionData));

    return res.status(201).json({ sessionId });
  } catch (error) {
    console.error("createPaymentSession error:", error);
    return next(error);
  }
};

// verify payment session
export const verifyingPaymentSession = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      return next(new ValidationError("Session ID is required"));
    }

    const sessionKey = `payment-session:${sessionId}`;

    const sessionData = await redisClient.get(sessionKey);

    if (!sessionData) {
      // Session expired or doesn't exist
      return next(new NotFoundError("Payment session expired or not found"));
    }

    let session;
    try {
      session = JSON.parse(sessionData);
    } catch (err) {
      return next(new ValidationError("Corrupted session data"));
    }

    // Security check: Only the owner of the session can access it
    if (session.userId !== req.user?.id) {
      return next(new ValidationError("Unauthorized access to this session"));
    }

    return res.status(200).json({
      success: true,
      session: {
        sessionId,
        cart: session.cart,
        totalAmount: session.totalAmount,
        shippingAddressId: session.shippingAddressId,
        coupon: session.coupon || null,
        sellers: session.sellers,
        createdAt: session.createdAt,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------
// PRODUCTION-SAFE, IDEMPOTENT, CORRECT ORDER CREATOR
// ---------------------------------------------------
export const createOrderFromStripeWebhook = async (req: any, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      return res.status(400).send("Missing Stripe signature");
    }

    const rawBody = req.rawBody; // MUST exist because of express.raw() middleware
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error("Invalid Stripe signature:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // ONLY HANDLE SUCCESSFUL PAYMENT
    if (event.type !== "payment_intent.succeeded") {
      return res.status(200).send("Unhandled event");
    }

    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    // Metadata must match exactly your createPaymentIntent:
    const sessionId = paymentIntent.metadata.sessionId;
    const userId = paymentIntent.metadata.userId;

    if (!sessionId || !userId) {
      return res.status(400).send("Missing metadata in paymentIntent");
    }

    // IDEMPOTENCY — CHECK IF ORDER ALREADY CREATED
    const existingOrder = await prisma.orders.findFirst({
      where: { paymentIntentId: paymentIntent.id },
    });

    if (existingOrder) {
      // Stripe retries webhooks — DO NOT create a second order
      return res.status(200).send("Order already created");
    }

    // LOAD SESSION FROM REDIS
    const sessionKey = `payment-session:${sessionId}`;
    const sessionData = await redisClient.get(sessionKey);

    if (!sessionData) {
      return res.status(404).send("Checkout session expired or not found");
    }

    const {
      cart,
      sellers,
      totalAmount,
      shippingAddressId,
      coupon,
    } = JSON.parse(sessionData);

    // LOAD USER
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).send("User not found");

    // VALIDATE & SNAPSHOT PRODUCTS
    const productIds = cart.map((it: any) => it.productId);
    const productDocs = await prisma.products.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        title: true,
        images: true,
        sale_price: true,
        stock: true,
        shopId: true,
      },
    });

    const productMap = new Map(productDocs.map((p) => [p.id, p]));

    const orderItems: any[] = [];

    let subTotal = 0;

    for (const item of cart) {
      const prod = productMap.get(item.productId);
      if (!prod) throw new Error("Product not found: " + item.productId);

      if (prod.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${prod.title}`);
      }

      const lineTotal = prod.sale_price * item.quantity;
      subTotal += lineTotal;

      orderItems.push({
        productId: prod.id,
        shopId: prod.shopId,
        sellerId: sellers.find((s: any) => s.shopId === prod.shopId)?.sellerId,
        title: prod.title,
        primaryImage: prod.images?.[0]?.url || "",
        unitPrice: prod.sale_price,
        quantity: item.quantity,
        lineTotal,
        selectedOptions: item.selectedOptions || {},
      });
    }

    // APPLY COUPON (ONLY product-based as you said)
    let discountAmount = 0;

    if (coupon && coupon.discountedProductId) {
      const target = orderItems.find((i) => i.productId === coupon.discountedProductId);
      if (target) {
        if (coupon.discountPercent > 0) {
          discountAmount = (target.unitPrice * target.quantity * coupon.discountPercent) / 100;
        } else if (coupon.discountAmount > 0) {
          discountAmount = coupon.discountAmount;
        }
      }
    }

    const finalTotal = subTotal - discountAmount;

    // CREATE ORDER + ORDER ITEMS
    const order = await prisma.orders.create({
      data: {
        userId,
        subTotal,
        discountAmount,
        shippingAmount: 0,
        taxAmount: 0,
        totalAmount: finalTotal,
        paymentMethod: "STRIPE",
        paymentStatus: "PAID",
        paymentIntentId: paymentIntent.id,
        couponId: coupon?.id || null,
        couponCode: coupon?.discountCode || null,
        couponType: coupon?.type || null,
        shippingAddressId: shippingAddressId || null,
        sessionId,
        items: {
          create: orderItems.map((i) => ({
            productId: i.productId,
            shopId: i.shopId,
            sellerId: i.sellerId,
            title: i.title,
            primaryImage: i.primaryImage,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
            lineTotal: i.lineTotal,
            selectedOptions: i.selectedOptions,
          })),
        },
      },
    });

    // UPDATE PRODUCTS (stock)
    for (const it of orderItems) {
      await prisma.products.update({
        where: { id: it.productId },
        data: {
          stock: { decrement: it.quantity },
          // removed totalSales increment because field absent in schema
        },
      });
    }

    // UPDATE ANALYTICS
    const newActions = orderItems.map((it) => ({
      productId: it.productId,
      shopId: it.shopId,
      action: "purchase",
      timestamp: Date.now(),
    }));

    // Keep analytics simple: upsert actions array (implementation detail left minimal)
    const existingAnalytics = await prisma.userAnalytics.findUnique({
      where: { userId },
    });

    if (existingAnalytics) {
      const currentActions = Array.isArray(existingAnalytics.actions) ? (existingAnalytics.actions as any[]) : [];
      const combined = [...currentActions, ...newActions].slice(-50); // keep last 50
      await prisma.userAnalytics.update({
        where: { userId },
        data: {
          lastVisitTime: new Date(),
          actions: combined,
        },
      });
    } else {
      await prisma.userAnalytics.create({
        data: {
          userId,
          lastVisitTime: new Date(),
          actions: newActions,
        },
      });
    }

    // NOTIFICATIONS (SELLER + ADMIN)
    const shopIds = [...new Set(orderItems.map((i) => i.shopId))];

    const shops = await prisma.shops.findMany({
      where: { id: { in: shopIds } },
      select: { id: true, sellerId: true, name: true },
    });

    for (const shop of shops) {
      const firstItem = orderItems.find((it) => it.shopId === shop.id);

      await prisma.notifications.create({
        data: {
          title: "New Order Received",
          message: `A customer purchased ${firstItem?.title} from your shop.`,
          creatorId: userId,
          receiverId: shop.sellerId,
          redirect_link: `/seller/orders/${order.id}`,
        },
      });
    }

    // Admin notification
    await prisma.notifications.create({
      data: {
        title: "Order Placed",
        message: `${user.name} placed a new order.`,
        creatorId: userId,
        receiverId: "admin",
        redirect_link: `/admin/orders/${order.id}`,
      },
    });

    // DELETE SESSION (VERY IMPORTANT)
    await redisClient.del(sessionKey);

    return res.status(200).send("Order created");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Webhook error");
  }
};

// get sellers Orders
export const getSellerOrders = async (req: any, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.seller?.id;
    if (!sellerId) {
      return res.status(401).json({ message: "Unauthorized seller" });
    }

    // Find the seller's shop
    const shop = await prisma.shops.findUnique({
      where: { sellerId },
      select: { id: true }
    });

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    // Fetch ONLY items belonging to this seller’s shop
    const items = await prisma.orderItem.findMany({
      where: { shopId: shop.id },
      include: {
        order: {
          select: {
            id: true,
            userId: true,
            totalAmount: true,
            paymentStatus: true,
            deliveryStatus: true,
            placedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (items.length === 0) {
      return res.status(200).json({ success: true, orders: [] });
    }

    // Fetch user info
    const userIds = [...new Set(items.map((it) => it.order.userId))];

    const users = await prisma.users.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    // Group items by order
    const groupedOrders: Record<string, any> = {};

    for (const item of items) {
      const orderId = item.order.id;

      if (!groupedOrders[orderId]) {
        groupedOrders[orderId] = {
          orderId,
          placedAt: item.order.placedAt,
          paymentStatus: item.order.paymentStatus,
          deliveryStatus: item.order.deliveryStatus,
          totalAmount: item.order.totalAmount,
          user: userMap.get(item.order.userId) || null,
          items: [],
        };
      }

      groupedOrders[orderId].items.push({
        id: item.id,
        productId: item.productId,
        title: item.title,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        primaryImage: item.primaryImage,
        selectedOptions: item.selectedOptions,
      });
    }

    return res.status(200).json({
      success: true,
      orders: Object.values(groupedOrders),
    });
  } catch (error) {
    console.log("getSellerOrders error:", error);
    return next(error);
  }
};

// get order details
export const getOrderDetails = async (req: any, res: Response, next: NextFunction) => {
  try {
    const orderId = req.params.orderId || req.params.id; // support both styles

    if (!orderId) {
      return next(new ValidationError("Order ID is required"));
    }

    // Fetch order + items + shipping address
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        items: true, // OrderItem snapshot
        shippingAddress: true,
      },
    });

    if (!order) {
      return next(new NotFoundError("Order not found"));
    }

    // Coupon info if applied
    let couponDetails = null;

    if (order.couponCode) {
      couponDetails = await prisma.discount_codes.findUnique({
        where: { discountCode: order.couponCode },
        select: {
          id: true,
          public_name: true,
          discountType: true,
          discountValue: true,
          discountCode: true,
        },
      });
    }

    // Response formatting
    const formattedItems = order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      title: item.title,
      primaryImage: item.primaryImage,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
      selectedOptions: item.selectedOptions,
      shopId: item.shopId,
      sellerId: item.sellerId,
    }));

    return res.status(200).json({
      success: true,
      order: {
        id: order.id,
        userId: order.userId,
        subTotal: order.subTotal,
        totalAmount: order.totalAmount,
        discountAmount: order.discountAmount,
        shippingAmount: order.shippingAmount,
        taxAmount: order.taxAmount,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        deliveryStatus: order.deliveryStatus,
        placedAt: order.placedAt,
        updatedAt: order.updatedAt,

        shippingAddress: order.shippingAddress || null,
        coupon: couponDetails,

        items: formattedItems,
      },
    });

  } catch (error) {
    console.log("getOrderDetails error:", error);
    return next(error);
  }
};

// update Delivery Status
export const updateDeliveryStatus = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const sellerId = req.seller?.id;
    if (!sellerId) {
      return res.status(401).json({ error: "Unauthorized seller" });
    }

    const { orderId } = req.params;
    const { deliveryStatus } = req.body;

    if (!orderId || !deliveryStatus) {
      return res.status(400).json({
        error: "Missing order ID or delivery status.",
      });
    }

    // Validate enum value
    const allowedStatuses = [
      "ORDERED",
      "PACKED",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELED",
    ];

    if (!allowedStatuses.includes(deliveryStatus)) {
      return next(new ValidationError("Invalid delivery status."));
    }

    // Get order items belonging to THIS seller
    const items = await prisma.orderItem.findMany({
      where: {
        orderId,
        sellerId, // seller validation
      },
    });

    if (items.length === 0) {
      return next(new NotFoundError("Order or items not found for this seller."));
    }

    // Update fulfillment status of seller's items only
    await prisma.orderItem.updateMany({
      where: {
        orderId,
        sellerId,
      },
      data: {
        fulfillmentStatus: deliveryStatus,
      },
    });

    // OPTIONAL: If ALL items in order are delivered → update main order status
    const allItems = await prisma.orderItem.findMany({
      where: { orderId },
    });

    const allDelivered = allItems.every(
      (it) => it.fulfillmentStatus === "DELIVERED"
    );

    if (allDelivered) {
      await prisma.orders.update({
        where: { id: orderId },
        data: {
          deliveryStatus: "DELIVERED",
        },
      });
    }

    // Notification to customer
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (order) {
      await prisma.notifications.create({
        data: {
          title: "Delivery update",
          message: `Your order is now marked as ${deliveryStatus}.`,
          creatorId: sellerId,
          receiverId: order.userId,
          redirect_link: `/order/${orderId}`,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Delivery status updated successfully.",
    });
  } catch (error) {
    return next(error);
  }
};

// verify coupon code
export const verifyCouponCode = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { couponCode, cart } = req.body;
    if (!couponCode || !cart || cart.length === 0) {
      return next(new ValidationError("Coupon code and cart are required!"));
    }

    //fetch the discount

    const discount = await prisma.discount_codes.findUnique({
      where: {
        discountCode: couponCode
      }
    })

    if (!discount) {
      return next(new ValidationError("Invalid coupon code!"));
    }

    //Find matching product that includes this discount code
    const matchingProduct = cart.find((item: any) => item.discount_codes?.some((code: string) => code === discount.id))

    if (!matchingProduct) {
      return res.status(200).json({
        success: true,
        valid: false,
        discount: 0,
        discountAmount: 0,
        message: "Coupon code is not applicable for this product!",
      });
    }

    let discountAmount = 0;
    const price = matchingProduct.sale_price * matchingProduct.quantity;

    if (discount.discountType === 'flat') {
      discountAmount = discount.discountValue;
    } else if (discount.discountType === 'percentage') {
      discountAmount = (price * discount.discountValue) / 100;
    }

    //prevent discount amount from being greater then the total price
    discountAmount = Math.min(discountAmount, price);

    return res.status(200).json({
      success: true,
      valid: true,
      discount: discount.discountValue,
      discountAmount: discountAmount.toFixed(2),
      discountProductId: matchingProduct.id,
      discountType: discount.discountType,
      message: "Coupon code is applicable for this product!",
    });

  } catch (error) {
    return next(error);
  }
}

// ---------------------------------------------
// CREATE ORDER - CASH ON DELIVERY (COD)
// ---------------------------------------------
// CREATE ORDER - CASH ON DELIVERY (COD)
// ---------------------------------------------
export const createOrderCOD = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user?.id;

    if (!sessionId) {
      return next(new ValidationError("Session ID is required"));
    }
    if (!userId) {
      return next(new ValidationError("User not authenticated"));
    }

    const sessionKey = `payment-session:${sessionId}`;
    const sessionDataRaw = await redisClient.get(sessionKey);

    if (!sessionDataRaw) {
      return next(new ValidationError("Checkout session expired"));
    }

    let sessionData: any;
    try {
      sessionData = JSON.parse(sessionDataRaw);
    } catch (err) {
      return next(new ValidationError("Corrupted session data"));
    }

    // Security: ensure session owner
    if (sessionData.userId !== userId) {
      return next(new ValidationError("Unauthorized access to this session"));
    }

    const { cart, shippingAddressId, coupon, sellers: sessionSellers, totalAmount } = sessionData;

    if (!Array.isArray(cart) || cart.length === 0) {
      return next(new ValidationError("Cart is empty"));
    }

    // Build a sellers map: shopId -> sellerId
    const sellersMap: Record<string, string | null> = {};
    if (Array.isArray(sessionSellers)) {
      for (const s of sessionSellers) {
        if (s?.shopId) sellersMap[s.shopId] = s.sellerId || null;
      }
    }

    // Normalize cart (if needed) — expect session.cart already normalized but be defensive
    const normalizedCart = cart.map((it: any) => ({
      productId: String(it.productId || it.id),
      quantity: Number(it.quantity || 1),
      sale_price: Number(it.sale_price || it.unitPrice || 0),
      shopId: String(it.shopId),
      selectedOptions: it.selectedOptions || {},
    }));

    // Validate products in DB in bulk
    const productIds = Array.from(new Set(normalizedCart.map((i) => i.productId)));
    const products = await prisma.products.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        title: true,
        images: true,
        sale_price: true,
        stock: true,
        shopId: true,
      },
    });

    const productMap = new Map(products.map((p: any) => [p.id, p]));

    // Ensure all products exist and have enough stock and price matches
    for (const it of normalizedCart) {
      const p = productMap.get(it.productId);
      if (!p) return next(new ValidationError(`Product not found: ${it.productId}`));
      if (p.stock < it.quantity) return next(new ValidationError(`Insufficient stock for product ${p.id}`));
      // Price check optional; we accept DB price and snapshot it
      // If you want to enforce price equality, uncomment below:
      // if (Number(p.sale_price) !== Number(it.sale_price)) return next(new ValidationError(`Price mismatch for product ${p.id}`));
    }

    // Group cart by shopId
    const shopGrouped: Record<string, any[]> = {};
    for (const it of normalizedCart) {
      if (!shopGrouped[it.shopId]) shopGrouped[it.shopId] = [];
      shopGrouped[it.shopId].push(it);
    }

    const createdOrders: any[] = [];

    // For each shop, create an order containing only its items
    for (const shopId of Object.keys(shopGrouped)) {
      const itemsForShop = shopGrouped[shopId];

      // Build order items with snapshot data
      const orderItemsSnapshot: OrderItemSnapshot[] = itemsForShop.map(
        (it): OrderItemSnapshot => {
          const prod = productMap.get(it.productId)!;

          const sellerId = sellersMap[shopId];
          if (!sellerId) {
            throw new Error(`Seller not found for shop ${shopId}`);
          }

          return {
            productId: prod.id,
            shopId: prod.shopId || shopId,
            sellerId,
            title: prod.title,
            primaryImage: prod.images?.[0]?.url || "",
            unitPrice: prod.sale_price,
            quantity: it.quantity,
            lineTotal: Number(prod.sale_price) * Number(it.quantity),
            selectedOptions: it.selectedOptions || {},
          };
        }
      );


      const subTotal = orderItemsSnapshot.reduce((s, o) => s + o.lineTotal, 0);

      // Apply coupon if it targets a product inside this shop
      let discountAmount = 0;
      if (coupon && coupon.discountedProductId) {
        const target = orderItemsSnapshot.find((oi) => oi.productId === coupon.discountedProductId);
        if (target) {
          if (coupon.discountPercent && coupon.discountPercent > 0) {
            discountAmount = (target.unitPrice * target.quantity * coupon.discountPercent) / 100;
          } else if (coupon.discountAmount && coupon.discountAmount > 0) {
            discountAmount = coupon.discountAmount;
          }
        }
      }

      const finalTotal = subTotal - (discountAmount || 0);

      // Create order (order-level does not contain shopId)
      const order = await prisma.orders.create({
        data: {
          userId,
          subTotal,
          discountAmount: discountAmount || 0,
          shippingAmount: 0,
          taxAmount: 0,
          totalAmount: finalTotal,
          paymentMethod: "COD",
          paymentStatus: "PENDING",
          sessionId,
          shippingAddressId: shippingAddressId || null,
          items: {
            create: orderItemsSnapshot.map((oi) => ({
              productId: oi.productId,
              shopId: oi.shopId,
              sellerId: oi.sellerId,
              title: oi.title,
              primaryImage: oi.primaryImage,
              unitPrice: oi.unitPrice,
              quantity: oi.quantity,
              lineTotal: oi.lineTotal,
              selectedOptions: oi.selectedOptions,
            })),
          },
        },
      });

      createdOrders.push(order);

      // Update product stock and productAnalytics
      for (const oi of orderItemsSnapshot) {
        await prisma.products.update({
          where: { id: oi.productId },
          data: {
            stock: { decrement: oi.quantity },
          },
        });

        await prisma.productAnalytics.upsert({
          where: { productId: oi.productId },
          create: {
            productId: oi.productId,
            shopId: oi.shopId,
            purchases: oi.quantity,
            lastViewedAt: new Date(),
          },
          update: {
            purchases: { increment: oi.quantity },
          },
        });
      }

      // Update userAnalytics (append actions, keep last 50)
      const newActions = orderItemsSnapshot.map((oi) => ({
        productId: oi.productId,
        shopId: oi.shopId,
        action: "purchase",
        timestamp: Date.now(),
      }));

      const existingAnalytics = await prisma.userAnalytics.findUnique({ where: { userId } });
      if (existingAnalytics) {
        const currentActions = Array.isArray(existingAnalytics.actions) ? (existingAnalytics.actions as any[]) : [];
        const combined = [...currentActions, ...newActions].slice(-50);
        await prisma.userAnalytics.update({
          where: { userId },
          data: { lastVisitTime: new Date(), actions: combined },
        });
      } else {
        await prisma.userAnalytics.create({
          data: { userId, lastVisitTime: new Date(), actions: newActions },
        });
      }

      // Create notifications for seller
      if (orderItemsSnapshot.length > 0) {
        const sellerId = orderItemsSnapshot[0].sellerId;
        if (sellerId) {
          await prisma.notifications.create({
            data: {
              title: "New COD Order Received",
              message: `A customer placed an order for ${orderItemsSnapshot[0].title}`,
              creatorId: userId,
              receiverId: sellerId,
              redirect_link: `/seller/orders/${order.id}`,
            },
          });
        }
      }
    }

    // Admin notification (single one for entire checkout)
    await prisma.notifications.create({
      data: {
        title: "Order Placed (COD)",
        message: `User placed ${createdOrders.length} order(s) via COD.`,
        creatorId: userId,
        receiverId: "admin",
        redirect_link: `/admin/orders`,
      },
    });

    // Delete checkout session from Redis
    await redisClient.del(sessionKey);

    return res.status(201).json({
      success: true,
      orders: createdOrders,
      message: "COD order(s) created successfully",
    });
  } catch (error) {
    console.error("createOrderCOD error:", error);
    return next(error);
  }
};


//get users orders
export const getUserOrders = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const orders = await prisma.orders.findMany({
      where:
      {
        userId: req.user.id,
      },
      include: {
        items: true,
      },
      orderBy: {
        placedAt: "desc",
      },
    });
    // console.log("orders", orders);
    return res.status(200).json({
      success: true,
      orders,
      message: "Orders fetched successfully",
    })
  } catch (error) {
    console.error("getUserOrders error:", error)
    return next(error)
  }
}


//get admin orders
export const getAdminOrders = async (req: any, res: Response, next: NextFunction) => {
  try {
    const orders = await prisma.orders.findMany({
      include: {
        user: true,
      },
      orderBy: {
        placedAt: "desc",
      },
    });
    return res.status(200).json({
      success: true,
      orders,
      message: "Orders fetched successfully",
    })
  } catch (error) {
    console.error("getAdminOrders error:", error)
    return next(error)
  }
};