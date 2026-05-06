"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { XCircle, Loader2 } from "lucide-react";

export default function PaymentFailedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [loading, setLoading] = useState(false);

  const retryPayment = () => {
    if (!sessionId) {
      router.push("/cart"); // fallback
      return;
    }
    router.push(`/checkout?sessionId=${sessionId}`);
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-[80vh] px-6">
      <XCircle className="text-red-500 w-16 h-16 mb-4" />

      <h2 className="text-3xl font-bold text-red-600 mb-2">Payment Failed</h2>

      <p className="text-gray-700 text-center max-w-md mb-6">
        Unfortunately, we could not process your payment.
        Please check your card information or try another payment method.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Retry Payment */}
        <button
          onClick={retryPayment}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2"
        >
          {loading && <Loader2 className="animate-spin w-5 h-5" />}
          Retry Payment
        </button>

        {/* Back to Cart */}
        <button
          onClick={() => router.push("/cart")}
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
        >
          Back to Cart
        </button>
      </div>
    </div>
  );
}
