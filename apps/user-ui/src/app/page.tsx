"use client";

import React from "react";
import Hero from "../shared/modules/hero/page";
import SectionTitle from "../shared/modules/sectionTitle/page";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";
import ProductCard from "../shared/components/cards/product-card";
import ShopCard from "../shared/components/cards/shop-card";

const Page = () => {
  const {
    data: products,
    isLoading,
    isError
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await axiosInstance.get(
        "/product/api/get-all-products?page=1&limit=10"
      );
      return res.data.products;
    },
    staleTime: 1000 * 60 * 2
  });

  const { data: latestProducts, isLoading: latestProductsLoading } = useQuery({
    queryKey: ["latest-products"],
    queryFn: async () => {
      const res = await axiosInstance.get(
        "/product/api/get-all-products?page=1&limit=10&type=latest"
      );
      return res.data.products;
    },
    staleTime: 1000 * 60 * 2
  });

  const { data: shops, isLoading: shopLoading } = useQuery({
    queryKey: ["shops"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/get-filtered-shops?page=1&limit=10")
      return res.data.shops
    },
    staleTime: 1000 * 60 * 2
  });

  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ["offers"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/get-filtered-offers?page=1&limit=10")
      return res.data.offers
    },
    staleTime: 1000 * 60 * 2
  });

  return (
    <div className="bg-[#f5f5f5]">
      <Hero />

      <div className="md:w-[80%] w-[90%] my-10 m-auto">
        <div className="mb-8">
          <SectionTitle title="Suggested Products" />
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="h-[250px] bg-gray-300 animate-pulse rounded-xl"
              />
            ))}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
            {products?.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        {products?.length === 0 && (
          <div className="text-center py-10">
            <p className=" text-center text-gray-600">No products found</p>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="h-[250px] bg-gray-300 animate-pulse rounded-xl"
              />
            ))}
          </div>
        )}

        <div className="my-8 block">
          <SectionTitle title="Latest Products" />
        </div>

        {!latestProductsLoading && !isError && (
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
            {latestProducts?.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        {latestProducts?.length === 0 && (
          <div className="text-center py-10">
            <p className=" text-center text-gray-600">No products found</p>
          </div>
        )}

        <div className="my-8 block">
          <SectionTitle title="Top Sellers" />
        </div>

        {!shopLoading && !isError && (
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
            {shops?.map((shop: any) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}
        {shops?.length === 0 && (
          <div className="text-center py-10">
            <p className=" text-center text-gray-600">No shops found</p>
          </div>
        )}

        {shops?.length === 0 && (
          <div className="text-center py-10">
            <p className=" text-center text-gray-600">No shops found</p>
          </div>
        )}

        <div className="my-8 block">
          <SectionTitle title="Top Offers" />
        </div>

        {!offersLoading && !isError && (
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
            {offers?.map((offer: any) => (
              <ShopCard key={offer.id} shop={offer} />
            ))}
          </div>
        )}
        {offers?.length === 0 && (
          <div className="text-center py-10">
            <p className=" text-center text-gray-600">No offers found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;







