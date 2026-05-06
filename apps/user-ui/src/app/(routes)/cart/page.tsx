"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import useUser from "../../../hooks/useUser";
import useLocationTracking from "../../../hooks/useLocationTracking";
import useDeviceTracking from "../../../hooks/useDeviceTracking";
import Link from "next/link";
import { useStore } from "../../../store";
import { useState } from "react";
import { toast } from "react-hot-toast";
import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import axiosOrder from "@/utils/axiosOrder";


const CartPage = () => {

  const router = useRouter();
  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const cart = useStore((state: any) => state.cart);
  const [discountProductId, setDiscountProductId] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [storedCouponCode, setStoreCouponCode] = useState("")
  const removeFromCart = useStore((state: any) => state.removeFromCart);



  const couponcodeApplyHandler = async () => {
    setError("");
    if (!couponCode.trim()) {
      setError("Coupon code is required!");
      return;
    }
    try {
      const res = await axiosOrder.put("/verify-coupon", {
        couponCode: couponCode.trim(),
        cart
      });

      if (res.data.valid) {
        setStoreCouponCode(couponCode.trim());
        toast.success("Coupon applied successfully");
        setDiscountAmount(parseFloat(res.data.discountAmount));
        setDiscountPercent(res.data.discountPercent);
        setDiscountProductId(res.data.discountedProductId);
        setCouponCode("");
      }
      else {
        setDiscountAmount(0);
        setDiscountPercent(0);
        setDiscountProductId("");
        setStoreCouponCode("");
        setError(res.data.message || "Coupon not valid for any items in cart.");
        toast.error("Invalid coupon code");
      }

    } catch (error: any) {
      setDiscountAmount(0);
      setDiscountPercent(0);
      setDiscountProductId("");
      setStoreCouponCode("");
      setError(error?.response?.data?.message || "Coupon not valid for any items in cart.");
      toast.error(error?.response?.data?.message || "Coupon not valid for any items in cart.");
    }
  };



  const createPaymentSession = async () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (!selectedAddressId) {
      toast.error("Please select a shipping address");
      return;
    }

    setLoading(true);

    try {
      // STEP 1 → create redis checkout session
      const res = await axiosOrder.post("/create-payment-session", {
        cart,
        selectedAddressId,
        coupon: {
          couponCode: storedCouponCode,
          discountAmount: discountAmount,
          discountPercent: discountPercent,
          discountProductId: discountProductId,
        },
      });

      const sessionId = res.data.sessionId;



      if (paymentMethod === "COD") {
        const codRes = await axiosOrder.post("/create-order-cod", {
          sessionId,
        });

        toast.success("Order placed successfully (Cash on Delivery)", {
          duration: 2500,
          position: "top-center",
          style: {
            fontSize: "20px",
            padding: "16px 24px",
            textAlign: "center",
            background: "#0f172a",
            color: "white",
            borderRadius: "12px",
            boxShadow: "0 0 15px rgba(56, 189, 248, 0.7)",
            border: "1px solid rgba(56, 189, 248, 1)",
          },
        });

        // delay redirect 2.5 seconds so user can see toast
        setTimeout(() => {
          router.push("/");
        }, 2500);

        return;
      }


      // STEP 3 → Online payment → redirect to checkout
      if (paymentMethod === "ONLINE") {
        router.push(`/checkout?sessionId=${sessionId}`);
        return;
      }
    } catch (e) {
      toast.error("Checkout failed");
    } finally {
      setLoading(false);
    }
  };




  const decreaseQuantity = (id: string) => {
    useStore.setState((state: any) => ({
      cart: state.cart.map((item: any) =>
        item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item),
    }));
  };

  const increaseQuantity = (id: string) => {
    useStore.setState((state: any) => ({
      cart: state.cart.map((item: any) =>
        item.id === id && item.quantity < item.stock ? { ...item, quantity: item.quantity + 1 } : item),
    }));
  }

  const removeCartItem = (id: string) => {
    removeFromCart(id, user, location, deviceInfo);
  }

  const subtotal = cart.reduce((total: number, item: any) => total + item.sale_price * item.quantity, 0);

  // Get addresses
  const { data: addresses = [] } = useQuery<any[], Error>({
    queryKey: ["shipping-addresses"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/user-addresses");
      return res.data.addresses;
    }
  });

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((addr) => addr.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      }
    }
  }, [addresses, selectedAddressId]);


  return (
    <div className="w-full bg-white">
      <div className="md:w-[80%] w-[95%] mx-auto min-h-screen">
        <div className="pb-[50px]">
          <h1 className="md:pt-[50px] font-medium text-[44px] leading-[1] mb-[16px] font-jost">
            Shopping Cart
          </h1>
          <Link href="/" className='text-[#55585b] hover:underline'>Home</Link>
          <span className="inline-block p-[1.5px] mx-1 bg-[#a8acb0] rounded-full"></span>
          <span className="text-[#55585b]">Cart</span>
        </div>

        {/* if Cart is empty show message */}
        {cart.length === 0 ? (
          <div className='text-center text-gray-600 text-lg'>
            <p className='text-[#55585b]'>Your Cart is empty!Start adding items to it now.  </p>
          </div>
        ) : (
          <div className="lg:flex items:start gap-10">
            <table className="w-full lg:w-[70%] border-collapse">
              <thead className="bg-[#f1f3f4] rounded">
                <tr>
                  <th className='py-3 text-left pl-4'>Product</th>
                  <th className='py-3 text-left'>Price</th>
                  <th className='py-3 text-left'>Qunatity</th>
                  <th className='py-3 text-left'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item: any) => (
                  <tr key={item.id} className="border-b border-[#e5e7eb]">
                    <td className='flex items-center gap-4 p-4'>
                      <img src={item.images?.[0]?.url} alt={item.title} height={80} width={80} className='rounded' />
                      <div className="flex flex-col">
                        <span className="font-medium">{item.title}</span>
                        {item?.selectedOptions &&
                          <div className="text-sm text-gray-500">
                            {item?.selectedOptions?.color && (<span>Color:{ }
                              <span style={{
                                backgroundColor: item?.selectedOptions?.color,
                                width: "12px", height: "12px", display: 'inline-block', borderRadius: "100%"
                              }}></span>
                            </span>
                            )}
                            {item?.selectedOptions?.size && (<span className="ml-2">Size:{item?.selectedOptions?.size}</span>)}
                          </div>
                        }
                      </div>
                    </td>

                    <td className="px-6 text-lg text-center">
                      {item?.id === discountProductId ? (
                        <div className="flex flex-col items-center">
                          <span className="line-through text-gray-500 text-sm">${item.sale_price.toFixed(2)}</span>{" "}

                          <span className="text-green-600 font-semibold">
                            ${(
                              (item.sale_price * (100 - discountPercent)) / 100).toFixed(2)}
                          </span>
                          <span className="text-xs text-green-600 bg-white">Discount Applied</span>
                        </div>
                      ) : (
                        <span>${item.sale_price.toFixed(2)}</span>
                      )}
                    </td>

                    <td>
                      <div className='flex justify-center items-center border border-gray-200 rounded-[20px] w-[90px] p-[2px]'>
                        <button className='text-black cursor-pointer text-xl'
                          onClick={() => decreaseQuantity(item.id)}
                        >
                          -
                        </button>
                        <span className='px-4'>{item?.quantity}</span>
                        <button className='text-black cursor-pointer text-xl' onClick={() => increaseQuantity(item.id)}>+</button>
                      </div>
                    </td>

                    <td className="text-center">
                      <button className="text-[#818487] cursor-pointer hover:text-[#fff1826] transition duration-200"
                        onClick={() => removeCartItem(item.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-6 shadow-md w-full lg:w-[30%] bg-[#f9f9f9] rounded-lg">
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-[#010f1c] text-base font-medium pb-1">
                  <span className="font-jost">
                    Discount({discountPercent}%)
                  </span>
                  <span className="font-jost">
                    ${discountAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-[#010f1c] text-[20px] font-[550] pb-3">
                <span className="font-jost">
                  Subtotal
                </span>
                <span className="font-jost">
                  ${(subtotal - discountAmount).toFixed(2)}
                </span>
              </div>
              <hr className="my-4 text-slate-300" />
              <div className="mb-4">
                <h4 className="mb-[7px] font-[500px] text-[15px]">Have a Coupon</h4>
                <div className="flex">
                  <input type="text" className="w-full p-2 border-gray-200 rounded-l-md focus:outline-none focus:border-blue-500"
                    value={couponCode} onChange={(e: any) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                  />
                  <button className="bg-blue-500 cursor-pointer text-white px-4 rounded-r-md hover:bg-blue-600 transition-all"
                    onClick={couponcodeApplyHandler}
                  >
                    Apply
                  </button>
                  {error && (<p className=" text-sm pt-2 text-red-500">
                    {error}
                  </p>)}
                </div>
                <hr className="my-4 text-slate-200" />

                <div className="mb-4">
                  <h4 className="mb-[7px] font-medium text-[15px]">
                    Select Shipping Address
                  </h4>
                  {addresses.length > 0 ? (
                    <select className="w-full p-2 border-gray-200 rounded-md focus:outline-none focus:border-blue-500"
                      value={selectedAddressId}
                      onChange={(e: any) => setSelectedAddressId(e.target.value)}>
                      {addresses.map((addr: any) => (
                        <option key={addr?.id} value={addr?.id}>
                          {addr?.label}-{addr?.city},{addr?.state},{addr?.country},{addr?.zipCode}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-red-500">No addresses found</p>
                  )}
                </div>
                <hr className="my-4 text-slate-200" />
                <div className="mb-4">
                  <h4 className="mb-[7px] font-medium text-[15px]">
                    Select Payment Method
                  </h4>
                  <select className="w-full p-2 border-gray-200 rounded-md focus:outline-none focus:border-blue-500"
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}>
                    <option value="">Select Payment Method</option>
                    <option value="COD">Cash On Delivery</option>
                    <option value="ONLINE">Online Payment</option>

                  </select>
                </div>

                <hr className="my-4 text-slate-300" />
                <div className="flex justify-between items-center text-[#101f1c] text-[20px] font-[550] pb-3">
                  <span>Total</span>
                  <span>${(subtotal - discountAmount).toFixed(2)}</span>
                </div>
                <button
                  onClick={createPaymentSession}
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 cursor-pointer mt-4 py-3 bg-[#101f1c] text-white hover:bg-[#0989FF] transition-all rounded-lg">
                  {loading && <Loader2 className="animate-spin w-5 h-5" />}
                  {loading ? "Redirecting..." : "Proceed to  Checkout"}
                </button>
              </div>
            </div>
          </div>
        )};
      </div>
    </div>
  );
};


export default CartPage;
