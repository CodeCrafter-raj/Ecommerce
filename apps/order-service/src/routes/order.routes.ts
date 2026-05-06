import isAuthenticated from "@packages/middleware/isAuthenticated";
import express, { Router } from "express";
import { getOrderDetails } from "../controllers/order.controller";
import { verifyingPaymentSession } from "../controllers/order.controller";
import { createPaymentIntent } from "../controllers/order.controller";
import { createPaymentSession } from "../controllers/order.controller";
import { getSellerOrders } from "../controllers/order.controller";
import { isSeller } from "@packages/middleware/authorizeRoles";
import { updateDeliveryStatus } from "../controllers/order.controller";
import { createOrderCOD } from "../controllers/order.controller";
import { verifyCouponCode } from "../controllers/order.controller";
import { getUserOrders } from "../controllers/order.controller";
import { getAdminOrders } from "../controllers/order.controller";
import { isAdmin } from "@packages/middleware/authorizeRoles";

const router: Router = express.Router();

// router.post("/create-order", isAuthenticated, createOrder);
router.get("/verifying-payment-session", isAuthenticated, verifyingPaymentSession);
router.post("/create-payment-intent", isAuthenticated, createPaymentIntent);
router.post("/create-payment-session", isAuthenticated, createPaymentSession);
router.get("/get-seller-orders", isAuthenticated, isSeller, getSellerOrders);
router.get("/get-order-details/:id", isAuthenticated, getOrderDetails);
router.put("/update-status/:orderId", isAuthenticated, isSeller, updateDeliveryStatus);
router.post("/create-order-cod", isAuthenticated, createOrderCOD);
router.put("/verify-coupon", isAuthenticated, verifyCouponCode);
router.get("/get-user-orders", isAuthenticated, getUserOrders);
router.get("/get-admin-orders", isAuthenticated, isAdmin, getAdminOrders);

export default router;