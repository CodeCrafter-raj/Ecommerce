"use client";

import React from 'react'
import useLocationTracking from '../../../hooks/useLocationTracking';
import useDeviceTracking from '../../../hooks/useDeviceTracking';
import { useStore } from '../../../store/index';
import Link from 'next/link';
import useUser from "../../../hooks/useUser";



const WishlistPage = () => {
  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const addToCart = useStore((state: any) => state.addToCart);
  const addToWishList = useStore((state: any) => state.addToWishList);
  const removeFromWishList = useStore((state: any) => state.removeFromWishList);

  const wishlist = useStore((state: any) => state.wishlist);
  const cart = useStore((state: any) => state.cart);

  // const isWishListed = wishlist.some((item: any) => item.id === product.id);
  // const isInCart = cart.some((item: any) => item.id === product.id);

  const decreaseQuantity = (id: string) => {
    useStore.setState((state: any) => ({
      wishlist: state.wishlist.map((item: any) =>
        item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item),
    }));
  };

  const increaseQuantity = (id: string) => {
    useStore.setState((state: any) => ({
      wishlist: state.wishlist.map((item: any) =>
        item.id === id && item.quantity < item.stock ? { ...item, quantity: item.quantity + 1 } : item),
    }));
  }

  const removeItem = (id: string) => {
    removeFromWishList(id, user, location, deviceInfo);
  }


  return (
    <div className='w-full bg-white'>
      <div className='md:w-[80%] w-[95%]  mx-auto min-h-screen'>
        {/* Breadcrumb */}
        <div className='pb-[50px]'>
          <h1 className='md:pt-[50px] font-medium text-[44px] leading-[1] mb-[16px] font-jost'>Wishlist</h1>
          <Link href="/" className='text-[#55585b] hover:underline'>Home</Link>

          <span className="inline-block p-[1.5px] mx-1 bg-[#a8acb0] rounded-full"></span>
          <span className="text-[#55585b]">Wishlist</span>
        </div>

        {/* if wishlist is empty show message */}
        {wishlist.length === 0 ? (
          <div className='flex items-center justify-center h-[calc(100vh-200px)]'>
            <p className='text-[#55585b]'>Your wishlist is empty!Start adding items to it now.  </p>
          </div>
        ) : (
          <div className='flex flex-col gap-10'>
            <table className='w-full'>
              <thead className='bg-[#f1f3f4]'>
                <tr>
                  <th className='py-3 text-left pl-4'>Product</th>
                  <th className='py-3 text-left'>Price</th>
                  <th className='py-3 text-left'>Qunatity</th>
                  <th className='py-3  pl-20 text-left'>Actions</th>
                  <th className='py-3 text-left'>Total</th>
                </tr>
              </thead>
              <tbody>
                {wishlist?.map((product: any) => (
                  <tr key={product.id} className='border-b border-[#e5e7eb]'>
                    <td className='flex items-center gap-4 p-4'>
                      <img src={product.images?.[0]?.url} alt={product.title} height={80} width={80} className='rounded' />
                      <span>{product.title}</span>
                    </td>
                    <td className='px-6 text-lg'>{product?.sale_price?.toFixed(2)}</td>
                    <td>
                      <div className='flex justify-center items-center border border-gray-200 rounded-[20px] w-[90px] p-[2px]'>
                        <button className='text-black cursor-pointer text-xl'
                          onClick={() => decreaseQuantity(product.id)}
                        >
                          -
                        </button>
                        <span className='px-4'>{product?.quantity}</span>
                        <button className='text-black cursor-pointer text-xl' onClick={() => increaseQuantity(product.id)}>+</button>
                      </div>
                    </td>

                    <td>
                      <button className='bg-[#ff4d4d] cursor-pointer text-white px-4 py-2 rounded hover:bg-[#ff4d4d]/80 transition-all' onClick={() => addToCart(product, user, location, deviceInfo)}>
                        Add to Cart
                      </button>{" "}

                      <button className='bg-[#ff4d4d] text-white px-4 py-2 rounded hover:bg-[#ff4d4d]/80 transition-all'
                        onClick={() => removeItem(product.id)}>
                        Remove from Wishlist
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )};
      </div>
    </div>
  );
};

export default WishlistPage;