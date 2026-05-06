"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Heart, MapPin, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/store";
import useUser from "@/hooks/useUser";
import Cart from "@/assets/svgs/cart";
import useDeviceTracking from "@/hooks/useDeviceTracking";
import useLocationTracking from "@/hooks/useLocationTracking";
import { Package, WalletMinimal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "../cards/product-card";


// --- Amazon-like magnifier ---
function MagnifierImage({ src, alt }: { src: string; alt: string }) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleMove = (e: any) => {
    if (!imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPosition({ x, y });
  };

  return (
    <div
      className="relative w-full overflow-hidden border rounded-lg bg-white"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onMouseMove={handleMove}
    >
      {/* Main Image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className="w-full object-contain pointer-events-none"
      />

      {/* Magnifier Lens */}
      {show && (
        <div
          className="absolute rounded-full border border-gray-300 shadow-xl pointer-events-none"
          style={{
            width: 180,
            height: 180,
            top: position.y - 90,
            left: position.x - 90,
            backgroundImage: `url(${src})`,
            backgroundPosition: `-${position.x * 2 - 90}px -${position.y * 2 - 90}px`,
            backgroundSize: `${imgRef.current?.width! * 2}px ${imgRef.current?.height! * 2
              }px`,
          }}
        />
      )}
    </div>
  );
}

export default function ProductDetails({
  productDetails,
}: {
  productDetails: any;
}) {
  const images = productDetails?.images || [];
  const { user, isLoading } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [colorSelected, setcolorSelected] = useState(productDetails?.colors?.[0] || "");
  const [sizeSelected, setSizeSelected] = useState(productDetails?.sizes?.[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [priceRange, setPriceRange] = useState([productDetails?.sale_price, 1999]);
  const [InStock, setInStock] = useState(true);
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  const addToCart = useStore((state: any) => state.addToCart);
  const cart = useStore((state: any) => state.cart);
  const isInCart = cart.some((item: any) => item.id === productDetails.id);
  const addToWishlist = useStore((state: any) => state.addToWishList);
  const removeFromWishlist = useStore((state: any) => state.removeFromWishList);
  const wishlist = useStore((state: any) => state.wishlist);
  const isWishlisted = wishlist.some((item: any) => item.id === productDetails.id);



  const prevImage = () =>
    setCurrentIndex((i) => (i > 0 ? i - 1 : i));

  const nextImage = () =>
    setCurrentIndex((i) =>
      i < images.length - 1 ? i + 1 : i
    );

  const discountPercentage = Math.round(
    ((productDetails?.regular_price - productDetails?.sale_price) /
      productDetails?.regular_price) *
    100);

  const fetchFilteredProducts = async () => {
    try {
      const query = new URLSearchParams();
      query.set("priceRange", priceRange.join(","));
      query.set("page", "1");
      query.set("limit", "10");
      query.set("sortBy", "createdAt");
      query.set("sortOrder", "desc");
      query.set("inStock", InStock.toString());
      query.set("colors", colorSelected);
      query.set("sizes", sizeSelected);

      const response = await fetch(`/api/products/get-filtered-products?${query.toString()}`);
      const data = await response.json();
      setRecommendedProducts(data?.products);

    } catch (error) {
      console.log("Failed to fetch filtered products", error);
    }
  };

  useEffect(() => {
    fetchFilteredProducts();
  }, [priceRange, InStock, colorSelected, sizeSelected]);

  return (
    <div className="w-full bg-[#f5f5f5] py-8">
      <div className="w-[90%] lg:w-[80%] mx-auto grid grid-cols-1 lg:grid-cols-[35%_45%_20%] gap-8">


        {/* LEFT — Product Image Viewer */}
        <div className="space-y-5">

          {/* MAIN IMAGE + ZOOM */}
          <MagnifierImage
            src={images[currentIndex]?.url}
            alt={productDetails?.title}
          />

          {/* THUMBNAILS */}
          <div className="relative flex items-center gap-3">

            {images.length > 4 && (
              <button
                onClick={prevImage}
                disabled={currentIndex === 0}
                className="absolute left-0 z-20 p-2 bg-white shadow-lg rounded-full hover:bg-gray-100 transition disabled:opacity-40"
              >
                <ChevronLeft size={22} />
              </button>
            )}

            <div className="flex gap-3 overflow-x-auto w-full px-12 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {images.map((image: any, index: number) => (
                <img
                  key={index}
                  src={image.url}
                  className={`w-20 h-20 object-cover rounded-lg cursor-pointer border transition-transform ${index === currentIndex
                    ? "border-blue-600 scale-[1.08] shadow"
                    : "border-gray-300 hover:scale-[1.03]"
                    }`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>

            {images.length > 4 && (
              <button
                onClick={nextImage}
                disabled={currentIndex === images.length - 1}
                className="absolute right-0 z-20 p-2 bg-white shadow-lg rounded-full hover:bg-gray-100 transition disabled:opacity-40"
              >
                <ChevronRight size={22} />
              </button>
            )}
          </div>
        </div>

        {/* Middle — PRODUCT INFO (UI Enhanced) */}
        <div className="bg-white p-8 rounded-2xl shadow-sm space-y-5">

          <h1 className="text-2xl font-semibold tracking-tight">
            {productDetails?.title}
          </h1>

          <div className="flex justify-between items-start">
            <div className="flex gap-3 text-yellow-500 items-center mt-1">
              <span className="text-sm font-medium">{productDetails?.rating}⭐</span>
              <span className="text-sm text-gray-600">{productDetails?.rating_count} ratings</span>
              <Link href={"#reviews"} className="text-blue-600 hover:underline text-sm ml-2">
                {productDetails?.reviews_count} reviews
              </Link>
            </div>

            <Heart
              size={24}
              fill={isWishlisted ? "red" : "transparent"}
              className="cursor-pointer transition"
              color={isWishlisted ? "transparent" : "#999"}
              onClick={() =>
                isWishlisted
                  ? removeFromWishlist(productDetails.id, user, location, deviceInfo)
                  : addToWishlist(
                    {
                      ...productDetails,
                      quantity,
                      selectedOptions: {
                        color: colorSelected,
                        size: sizeSelected,
                      },
                    },
                    user,
                    location,
                    deviceInfo
                  )
              }
            />
          </div>

          <div className="py-2 border-b border-gray-200 text-sm">
            <span className="text-gray-500">
              Brand:{" "}
              <span className="text-blue-600 font-semibold">
                {productDetails?.brand || "No Brand"}
              </span>
            </span>
          </div>

          {/* PRICE */}
          <div className="space-y-1 mt-2">
            <span className="text-3xl font-semibold text-orange-600">
              ₹{productDetails?.sale_price}
            </span>

            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <span className="line-through">₹{productDetails?.regular_price}</span>
              <span className="text-green-600 font-semibold">-{discountPercentage}%</span>
            </div>
          </div>

          {/* COLOR Options */}
          <div className="mt-3">
            <div className="flex flex-col gap-4">
              {productDetails?.colors?.length > 0 && (
                <div>
                  <strong className="text-sm">Color:</strong>
                  <div className="flex gap-3 mt-2">
                    {productDetails?.colors?.map((color: string, index: number) => (
                      <button
                        key={index}
                        style={{ backgroundColor: color }}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${colorSelected === color
                          ? "border-black scale-110 shadow-md"
                          : "border-gray-300 hover:scale-105"
                          }`}
                        onClick={() => setcolorSelected(color)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* QUANTITY */}
          <div className="mt-6 space-y-4">

            <div className="flex items-center gap-4">
              <div className="flex items-center rounded-lg border shadow-sm overflow-hidden">
                <button
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 font-bold transition"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                >
                  -
                </button>
                <span className="px-5 py-2 font-semibold">{quantity}</span>
                <button
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 font-bold transition"
                  onClick={() => setQuantity((prev) => prev + 1)}
                >
                  +
                </button>
              </div>

              {productDetails?.stock > 0 ? (
                <span className="text-green-600 font-semibold">
                  In Stock <span className="text-gray-500">(Stock {productDetails?.stock})</span>
                </span>
              ) : (
                <span className="text-red-600 font-semibold">Out of Stock</span>
              )}
            </div>

            {/* ADD TO CART BUTTON */}
            <button
              className={`flex items-center justify-center gap-2 w-full py-3 bg-[#ff5722] hover:bg-[#e64a19] rounded-xl 
              text-white text-lg font-medium shadow-md transition active:scale-[0.98] ${isInCart ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                }`}
              disabled={isInCart || productDetails?.stock === 0}
              onClick={() =>
                addToCart(
                  {
                    ...productDetails,
                    quantity,
                    selectedOptions: {
                      color: colorSelected,
                      size: sizeSelected,
                    },
                  },
                  user,
                  location,
                  deviceInfo
                )
              }
            >
              <Cart size={22} />
              Add to Cart
            </button>
          </div>
        </div>

        {/* RIGHT — Seller + Delivery Column */}
        <div className="space-y-4">

          {/* Delivery Box */}
          <div className="bg-white p-6 rounded-2xl shadow-sm h-fit">
            <div className="border-b pb-4">
              <span className="text-gray-600 text-sm">Delivery Option</span>

              <div className="flex items-center gap-2 mt-2 text-gray-700">
                <MapPin size={18} />
                <span>{location?.city + ", " + location?.country}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm h-fit">
            <span className="text-sm •text-gray-600">Return & Warranty</span>
            <div className="flex items-center text-gray-600 gap-1">
              <Package size={18} className="ml-[-5px]" />
              <span className="text-base font-normal">7 Days Returns</span>
            </ div>

            <div className="flex items-center py-2 text-gray-600 gap-1">
              <WalletMinimal size={18} className="ml-[-5px]" />
              <span className="text-base font-normal">
                Warranty Not Available
              </span>
            </div>
          </div>

          {/* Seller Box (You can replace or update */}
          {/* SELLER INFORMATION BOX */}
          <div className="bg-white p-6 rounded-2xl shadow-sm h-fit space-y-4 border border-gray-100">

            {/* Seller Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-gray-800 font-semibold text-lg">Seller Information</h3>

              {productDetails?.shop?.isVerified && (
                <span className="text-[11px] px-2 py-1 bg-green-100 text-green-700 rounded-md font-medium">
                  VERIFIED
                </span>
              )}
            </div>

            {/* Seller Name */}
            <div className="text-sm">
              <p className="text-gray-500">Sold By</p>
              <p className="font-medium text-gray-800">{productDetails?.shop?.name}</p>
            </div>

            {/* Seller Ratings */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-yellow-500">⭐</span>
              <span className="text-gray-700 font-medium">{productDetails?.shop?.rating ?? "4.5"}</span>
              <span className="text-gray-500 text-xs">(2k reviews)</span>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-3 gap-4 border-t border-gray-200 pt-4">

              <div className="text-center">
                <p className="text-[12px] text-gray-500 leading-none">Positive Ratings</p>
                <p className="text-xl font-semibold mt-1">88%</p>
              </div>

              <div className="text-center">
                <p className="text-[12px] text-gray-500 leading-none">Ship on Time</p>
                <p className="text-xl font-semibold mt-1">100%</p>
              </div>

              <div className="text-center">
                <p className="text-[12px] text-gray-500 leading-none">Response Rate</p>
                <p className="text-xl font-semibold mt-1">98%</p>
              </div>

            </div>

            {/* Go to Store */}
            <div className="text-center mt-5 border-t border-gray-200 pt-3">
              <Link
                href={`/shop/${productDetails?.shop?.id}`}
                className="text-blue-600 font-medium text-sm tracking-wide hover:underline"
              >
                GO TO STORE
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* detailed description of products */}
      <div className="w-[90%] lg:w-[80%] mx-auto mt-6">
        <div className="bg-white min-h-[60vh] h-full p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">
            Product details of {productDetails?.title}
          </h3>

          <div
            className="prose prose-sm prose-slate max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: productDetails?.description }}
          />
        </div>
      </div>

      <div className="w-[90%] lg:w-[80%] mx-auto mt-6">
        <div className="bg-white min-h-[50vh] h-full p-6 rounded-xl shadow-sm">

          <h3 className="text-lg font-semibold mb-4">
            Ratings & Reviews of {productDetails?.title}
          </h3>

          <p className="text-center text-gray-600 pt-14">
            No Reviews available yet!
          </p>

        </div>
      </div>

      <div className="w-[90%] lg:w-[80%] mx-auto">
        <div className="w-full h-full my-5 p-5">
          <h3 className="text-xl font-semibold mb-2">You may also like</h3>
          <div className="m-auto grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {/* {
              recommendedProducts?.map((i: any) => (
                <ProductCard key={i.id} product={i} />
              ))
            } */}
          </div>
        </ div>
      </ div>


    </div >
  );
};





















