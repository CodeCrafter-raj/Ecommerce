import React from 'react';
import axiosInstance from '@/utils/axiosInstance';

async function fetchSellerDetails(id: string) {
  const response = await axiosInstance.get(`/seller/api/get-seller/${id}`)
  return response.data;
}

//Dynamic MetaData Generator
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const data = await fetchSellerDetails(params.id);
  return {
    title: `${data?.shop?.name} | Myshop Marketplace`,
    description: data?.shop?.bio || "Explore products and services from trusted sellers on Myshop Marketplace",
    openGraph: {
      title: `${data?.shop?.name} | Myshop Marketplace`,
      description: data?.shop?.bio || "Explore products and services from trusted sellers on Myshop Marketplace",
      type: "website",
      images: [{
        url: data?.shop?.avatar || "/default-shop.png",
        width: 800,
        height: 600,
        alt: data?.shop?.name || "Shop Logo",
      },],
    },
    twitter: {
      card: "summary_large_image",
      title: `${data?.shop?.name} | Myshop Marketplace`,
      description: data?.shop?.bio || "Explore products and services from trusted sellers on Myshop Marketplace",
      images: [{
        url: data?.shop?.avatar || "/default-shop.png",
        width: 800,
        height: 600,
        alt: data?.shop?.name || "Shop Logo",
      },],
    }
  }
}

const Page = async ({ params }: { params: { id: string } }) => {
  const data = await fetchSellerDetails(params.id);
  return (
    <div>
      <SellerProfile shop

    </div>
  )
}