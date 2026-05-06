"use client";

import React, { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";

export interface CheckoutFormProps {
  clientSecret: string;
  cartItems: any[];
  coupon: any;
  sessionId: string; // ALWAYS string now
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  clientSecret,
  cartItems,
  coupon,
  sessionId,
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"success" | "failed" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ---------------------------
  // Total Calculation
  // ---------------------------
  const subtotal = cartItems.reduce(
    (sum: number, item: any) => sum + item.sale_price * item.quantity,
    0
  );

  const finalAmount = coupon?.discountAmount
    ? subtotal - coupon.discountAmount
    : subtotal;

  // ---------------------------
  // Handle Payment Submission
  // ---------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setErrorMsg(null);

    if (!stripe || !elements) {
      setErrorMsg("Stripe is not ready. Please try again.");
      setLoading(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success?sessionId=${sessionId}`,
      },
    });

    if (error) {
      setStatus("failed");
      setErrorMsg(error.message ?? "Payment failed. Please try again.");
    } else {
      setStatus("success");
    }

    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] px-4 my-10">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-lg p-8 rounded-xl shadow-md space-y-6 border border-gray-200"
      >
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Secure Payment Checkout
        </h2>

        {/* ------------------------- */}
        {/* ORDER SUMMARY */}
        {/* ------------------------- */}
        <div className="bg-gray-50 p-4 rounded-lg border space-y-2 text-sm text-gray-700">
          {cartItems.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between">
              <span>
                {item.quantity} × {item.title}
              </span>
              <span>${(item.quantity * item.sale_price).toFixed(2)}</span>
            </div>
          ))}

          {coupon?.discountAmount > 0 && (
            <div className="flex justify-between font-medium text-green-600 border-t pt-2">
              <span>Discount</span>
              <span>- ${coupon.discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between font-semibold text-gray-900 border-t pt-2">
            <span>Total</span>
            <span>${finalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* ------------------------- */}
        {/* STRIPE PAYMENT ELEMENT */}
        {/* ------------------------- */}
        <div className="bg-white p-4 border rounded-lg">
          <PaymentElement />
        </div>

        {/* ------------------------- */}
        {/* SUBMIT BUTTON */}
        {/* ------------------------- */}
        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg flex justify-center items-center gap-2 hover:bg-blue-700 transition"
        >
          {loading && <Loader2 className="animate-spin w-5 h-5" />}
          {loading ? "Processing..." : "Pay Now"}
        </button>

        {/* ------------------------- */}
        {/* STATUS + ERRORS */}
        {/* ------------------------- */}
        {status === "success" && (
          <p className="text-center text-green-600 font-medium">
            Payment successful!
          </p>
        )}

        {status === "failed" && (
          <p className="text-center text-red-600 font-medium">
            Payment failed.
          </p>
        )}

        {errorMsg && (
          <p className="text-center text-red-500 text-sm pt-2">{errorMsg}</p>
        )}
      </form>
    </div>
  );
};

export default CheckoutForm;
