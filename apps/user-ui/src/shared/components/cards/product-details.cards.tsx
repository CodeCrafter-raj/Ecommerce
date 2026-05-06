import { Pointer, MapPin, X, Heart } from 'lucide-react';
import Image from 'next/image';
import React, { act, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CartIcon from "../../../assets/svgs/cart";
import useLocationTracking from "../../../hooks/useLocationTracking";
import useDeviceTracking from "../../../hooks/useDeviceTracking";
import { useStore } from "../../../store";
import useUser from "../../../hooks/useUser";
import axiosInstance from '@/utils/axiosInstance';
import { isProtected } from '@/utils/protected';

const ProductDetailsCard = ({ data, setOpen }: { data: any, setOpen: (open: boolean) => void }) => {

  const [activeImage, setActiveImage] = useState(0);
  const [isSelected, setIsSelected] = useState(data?.colors?.[0] || "");
  const [isSizeSelected, setIsSizeSelected] = useState(data?.sizes?.[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const { user } = useUser();
  const router = useRouter();
  const wishlist = useStore((state: any) => state.wishlist);
  const cart = useStore((state: any) => state.cart);
  const addToCart = useStore((state: any) => state.addToCart);
  const addToWishList = useStore((state: any) => state.addToWishList);
  const removeFromWishList = useStore((state: any) => state.removeFromWishList);
  const isWishListed = wishlist.some((item: any) => item.id === data.id);
  const isInCart = cart.some((item: any) => item.id === data.id);


  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

  const handleChat = async () => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/chatting/api/create-user-conversationGroup", { sellerId: data?.shop?.sellerId }, isProtected);
      router.push(`/inbox?conversationId=${res.data.conversation.id}`);
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  }

  return (
    <div className='fixed flex items-center justify-center top-0 left-0 h-screen w-full bg-[#0000001d] z-50'
      onClick={() => setOpen(false)}>

      <div className='w-[85%] md:w-[65%] lg:w-[60%] md:mt-14 2xl:mt-0 max-h-[90vh] overflow-y-auto p-4 md:p-6 bg-white shadow-md rounded-lg' onClick={(e) => e.stopPropagation()}>

        {/* ---------- MAIN LAYOUT: LEFT IMAGE / RIGHT DETAILS ---------- */}
        <div className="w-full flex flex-col md:flex-row gap-6">
          {/* LEFT: IMAGE + THUMBNAILS */}
          <div className="w-full md:w-1/2 flex flex-col gap-4">
            <div className="w-full flex items-center justify-center">
              <Image
                src={data?.images?.[activeImage]?.url ?? "/placeholder.png"}
                alt={data?.images?.[activeImage]?.url ?? data?.title}
                height={400}
                width={400}
                className="w-full max-w-full rounded-lg object-contain"
              />
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 flex-wrap">
              {data?.images?.map((img: any, index: number) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`cursor-pointer border rounded-md p-0.5 ${activeImage === index ? "border-gray-500" : "border-transparent"}`}
                >
                  <Image
                    src={img?.url ?? "/placeholder.png"}
                    alt={`Thumbnail ${index}`}
                    width={80}
                    height={80}
                    className="rounded-md object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: DETAILS */}
          <div className="w-full md:w-1/2 flex flex-col gap-4">
            {/* Seller header (logo + name + actions) */}
            <div className="flex items-center justify-between border-b pb-3 border-gray-200">
              <div className="flex items-center gap-3">
                <Image
                  src={data?.shop?.avatar ?? "/shop-placeholder.png"}
                  alt="Shop Logo"
                  width={60}
                  height={60}
                  className="rounded-full w-[60px] h-[60px] object-cover"
                />
                <div>
                  <Link href={`/shop/${data?.shop?.id}`} className="text-lg font-medium block">
                    {data?.shop?.name ?? data?.shop?.sellerId ?? "Shop"}
                  </Link>
                  <p className="text-gray-600 text-sm mt-1 flex items-center gap-2">
                    <MapPin size={16} /> {data?.shop?.address ?? "Location Not Available"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <button
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  onClick={() => handleChat()}
                >
                  Chat With Seller
                </button>
                <button
                  aria-label="close"
                  className="p-1 rounded-full hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Title & Description (separate from header) */}
            <div>
              <h3 className="text-xl font-semibold">{data?.title}</h3>
              <p className="mt-2 text-gray-700 whitespace-pre-wrap">{data?.short_description}</p>
              {data?.brand && <p className="mt-2 text-sm"><strong>Brand:</strong> {data.brand}</p>}
            </div>

            {/* Options: colors / sizes */}
            <div className="flex flex-col lg:flex-row gap-6 mt-2">
              {data?.colors?.length > 0 && (
                <div>
                  <strong>Color:</strong>
                  <div className="flex gap-2 mt-2">
                    {data.colors.map((color: string) => (
                      <button
                        key={color}
                        onClick={() => setIsSelected(color)}
                        className={`w-8 h-8 rounded-full border-2 ${isSelected === color ? "border-gray-400 scale-105 shadow-md" : "border-transparent"}`}
                        style={{ background: color }}
                        aria-label={`select color ${color}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {data?.sizes?.length > 0 && (
                <div>
                  <strong>Size:</strong>
                  <div className="flex gap-2 mt-2">
                    {data.sizes.map((size: string) => (
                      <button
                        key={size}
                        onClick={() => setIsSizeSelected(size)}
                        className={`px-4 py-1 rounded-md ${isSizeSelected === size ? "bg-gray-800 text-white" : "bg-gray-200"}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Price / Quantity / Actions */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="text-2xl font-semibold text-gray-900">${data?.sale_price}</div>
                {data?.regular_price && <div className="text-sm text-gray-400 line-through">${data.regular_price}</div>}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-md">
                  <button className="px-3 py-1 bg-gray-300" onClick={() => setQuantity((p) => Math.max(1, p - 1))}>-</button>
                  <span className="px-4 bg-gray-100 py-1">{quantity}</span>
                  <button className="px-3 py-1 bg-gray-300" onClick={() => setQuantity((p) => p + 1)}>+</button>
                </div>

                <button disabled={isInCart}
                  onClick={() => addToCart({
                    ...data,
                    quantity,
                    selectedOptions: {
                      color: isSelected,
                      size: isSizeSelected
                    }
                  },
                    user,
                    location,
                    deviceInfo
                  )}
                  className={`flex items-center gap-2 px-4 py-2 bg-[#ff5722] text-white rounded-md ${isInCart ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                  <CartIcon size={18} />
                  Add to Cart
                </button>

                <button className="p-1">
                  <Heart size={28} fill={isWishListed ? "red" : "transparent"}
                    color={isWishListed ? "transparent" : "black"}
                    onClick={() =>
                      isWishListed ?
                        removeFromWishList(data.id, user, location, deviceInfo)
                        : addToWishList(
                          {
                            ...data, quantity,
                            selectedOptions: {
                              color: isSelected,
                              size: isSizeSelected
                            }
                          },
                          user,
                          location,
                          deviceInfo
                        )}
                  />
                </button>
              </div>
            </div>

            {/* Stock & Delivery */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
              <div>
                {data?.stock > 0 ? <span className="text-green-600 font-semibold">In Stock</span> : <span className="text-red-600 font-semibold">Out of Stock</span>}
              </div>
              <div className="text-gray-600 text-sm">Estimated Delivery: <strong>{estimatedDelivery.toDateString()}</strong></div>
            </div>

            {/* Any other product details */}
            <div className="mt-4 text-sm text-gray-700">
              { /* custom specifications, properties etc can go here */}
            </div>
          </div>
        </div>

      </div>
    </div>

  );
};
export default ProductDetailsCard;