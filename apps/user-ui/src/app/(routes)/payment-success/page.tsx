"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosInstance";
import { Loader2, CheckCircle } from "lucide-react";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"success" | "failed" | null>(null);

  useEffect(() => {
    const verifyOrder = async () => {
      if (!sessionId) {
        setStatus("failed");
        setLoading(false);
        return;
      }

      try {
        // ⚠️ This hits your verifying-payment-session to ensure order is valid
        await axiosInstance.get(
          `/order/api/verifying-payment-session?sessionId=${sessionId}`
        );

        // If session exists → order will be created by Stripe webhook automatically
        setStatus("success");

        // Optional auto-redirect after 3 seconds
        setTimeout(() => {
          router.push("/account/orders");
        }, 3000);
      } catch (error) {
        console.error(error);
        setStatus("failed");
      } finally {
        setLoading(false);
      }
    };

    verifyOrder();
  }, [sessionId, router]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[70vh]">
        <Loader2 className="animate-spin w-10 h-10 text-gray-600" />
        <p className="mt-4 text-gray-600">Finalizing your order...</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex flex-col justify-center items-center min-h-[70vh] px-6">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">
          Payment Failed
        </h2>
        <p className="text-gray-600 text-center mb-6">
          Something went wrong with your payment.
          Please try again.
        </p>
        <button
          onClick={() => router.push("/cart")}
          className="bg-blue-500 text-white px-5 py-2 rounded-md hover:bg-blue-600"
        >
          Back to Cart
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-[70vh] px-6">
      <CheckCircle className="text-green-600 w-14 h-14 mb-4" />
      <h2 className="text-3xl font-bold text-green-600 mb-2">
        Payment Successful!
      </h2>

      <p className="text-gray-700 text-center mb-4">
        Thank you for your purchase 🎉
        Your order is being confirmed.
      </p>

      <p className="text-sm text-gray-500 mb-6">
        Redirecting you to your orders...
      </p>

      <button
        onClick={() => router.push("/account/orders")}
        className="bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700"
      >
        Go to My Orders
      </button>
    </div>
  );
}
