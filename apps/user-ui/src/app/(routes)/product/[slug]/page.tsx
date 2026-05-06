export const dynamic = "force-dynamic";

import { Metadata } from "next";
// import axiosInstance from "../../../../utils/axiosInstance";
import React from "react";
import ProductDetails from "@/shared/components/productDetails/page";

async function fetchProductDetails(slug: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URI}/product/api/get-product-details/${slug}`,
    {
      cache: "no-store",
      credentials: "include",
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  return data?.product;
}

// Generate Metadata
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {

  const product = await fetchProductDetails(params.slug);

  return {
    title: product?.title ? `${product.title} | Myshop` : "Product | Myshop",
    description:
      product?.short_description || "Discover good products on Myshop.",
    openGraph: {
      title: product?.title || "Product",
      description: product?.short_description || "",
      images: [product?.images?.[0]?.url || "/default-image.jpg"],
      type: "website",
    },
  };
}

// ⭐ FIX: Page cannot be async if params are used
export default function Page({ params }: { params: { slug: string } }) {

  // fetch inside client-safe async wrapper
  const dataPromise = fetchProductDetails(params.slug);

  // You MUST use Suspense (Next.js requirement for async calls in server components)
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <ProductPage promise={dataPromise} />
    </React.Suspense>
  );
}

// async child server component to load product
async function ProductPage({ promise }: { promise: Promise<any> }) {
  const productDetails = await promise;
  //console.log(productDetails);

  return <ProductDetails productDetails={productDetails} />;
}























