'use client';

import { loadStripe, Appearance } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "@/utils/axiosInstance";
import { XCircle, Loader2 } from "lucide-react";
import CheckoutForm from "@/shared/components/checkoutForm/checkoutform";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState("");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [coupon, setCoupon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = useSearchParams();
  const router = useRouter();

  const sessionId = params.get("sessionId");

  useEffect(() => {
    const preparePayment = async () => {
      if (!sessionId) {
        setError("Invalid checkout session.");
        setLoading(false);
        return;
      }

      try {
        // 🟢 Fetch checkout-session data
        const verifyRes = await axiosInstance.get(
          `/order/api/verifying-payment-session?sessionId=${sessionId}`
        );

        const session = verifyRes.data.session;
        const { totalAmount, sellers, cart, coupon } = session;

        if (!sellers || sellers.length === 0) {
          throw new Error("Seller Stripe account missing.");
        }

        const sellerStripeAccountId = sellers[0].stripeAccountId;

        if (!sellerStripeAccountId) {
          throw new Error("Seller has not connected Stripe.");
        }

        setCartItems(cart);
        setCoupon(coupon);

        // 🟢 Create PaymentIntent
        const intentRes = await axiosInstance.post(
          "/order/api/create-payment-intent",
          {
            amount: coupon?.discountAmount
              ? totalAmount - coupon.discountAmount
              : totalAmount,
            sellerStripeAccountId,
            sessionId,
          }
        );

        setClientSecret(intentRes.data.clientSecret);
      } catch (err: any) {
        console.error(err);
        setError("Could not prepare payment. Try again.");
      } finally {
        setLoading(false);
      }
    };

    preparePayment();
  }, [sessionId]);

  const appearance: Appearance = { theme: "stripe" };

  // ⏳ Loader
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }

  // ❌ Error screen
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] px-4">
        <div className="w-full text-center">
          <XCircle className="text-red-500 w-10 h-10 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Payment Failed
          </h2>
          <p className="text-sm text-gray-600 mb-6">{error}</p>

          <button
            onClick={() => router.push("/cart")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // 🟢 Stripe Elements Wrapper
  return (
    clientSecret && (
      <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
        <CheckoutForm
          clientSecret={clientSecret}
          cartItems={cartItems}
          coupon={coupon}
          sessionId={sessionId ?? ""} // now allowed (string | null)
        />
      </Elements>
    )
  );
}



// const Page = () => {
//   const [clientSecret, setClientSecret] = useState('');
//   const [cartItems, setcartitems] = useState<any[]>([]);
//   const [coupon, setCoupon] = useState();
//   const [Loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const searchparams = useSearchParams();
//   const router = useRouter();
//   const sessionId = searchparams.get('sessionId');

//   useEffect(() => {
//     const fetchSessionAndClientSecret = async () => {
//       if (!sessionId) {
//         setError("Invalid session. Please try again.");
//         setLoading(false);
//         return;
//       }
//       try {
//         const verifyRes = await axiosInstance.get(
//           `/order/api/verifying-payment-session?sessionId = ${sessionId}`
//         );
//         const { totalAmount, sellers, cart, coupon } = verifyRes.data.session;

//         if (!sellers || sellers.length === 0 || totalAmount === undefined || totalAmount === null) {
//           throw new Error("Invalid payment session data.");
//         }

//         setcartitems(cart);
//         setCoupon(coupon);
//         const sellersStripeAccountId = sellers[0].stripe.AccountId;

//         const intentRes = await axiosInstance.post(
//           "/order/api/create-payment-intent",
//           {
//             amount: coupon?.discountAmount ? totalAmount - coupon?.discountAmount : totalAmount, sellersStripeAccountId,
//             sessionId,
//           }
//         );

//         setClientSecret(intentRes.data.clientSecret);
//       } catch (err: any) {
//         console.error(err);
//         setError("Something went wrong while preparing your payment");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchSessionAndClientSecret();
//   }, [sessionId]);

//   const appearance: Appearance = {
//     theme: "stripe",
//   };

//   if (Loading) {
//     return (
//       <div className="flex justify-center items-center min-h-[70vh]">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900">
//           <Loader2 />
//         </div>
//       </div>
//     )
//   }

//   if (error) {
//     return (
//       <div className="flex justify-center items-center min-h-[60vh] px-4">
//         <div className="w-full text-center">
//           <div className="flex justify-center mb-4">
//             <XCircle className="text-red-500 w-10 h-10" />
//           </div>
//           <h2 className="text-xl font-semibold text-red-600 mb-2">
//             Payment Failed
//           </h2>
//           <p className="text-sm text-gray-600 mb-6">
//             {error}
//             <br className="hidden sm:block" />
//             Please go back to checking out again.
//           </p>
//           <button
//             onClick={() => router.push("/cart")}
//             className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//           >
//             Try Again
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     clientSecret && (
//       <Elements stripe={stripepromise} options={{ clientSecret, appearance }} >
//         <CheckoutForm
//           clientSecret={clientSecret}
//           cartItems={cartItems}
//           coupon={coupon}
//           sessionId={sessionId}
//         />
//       </Elements>
//     )
//   )

// };
