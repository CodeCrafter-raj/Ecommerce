'use client';
import Link from 'next/link';
import React from 'react'
import { Search } from 'lucide-react';
import ProfileIcon from "../../assets/svgs/profile-icon";
import HeartIcon from '../../assets/svgs/heartIcon';
import Cart from "../../assets/svgs/cart";
import HeaderBottom from './header-bottom';
import useUser from '../../hooks/useUser';
import { useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { useStore } from '../../store';
import { useLayout } from '../../hooks/useLayout';

const Header = () => {
  const { user, isLoading } = useUser();
  const wishlist = useStore((state: any) => state.wishlist);
  const cart = useStore((state: any) => state.cart);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  // Inside header.tsx
  const { layout } = useLayout();


  const handleSearchClick = async () => {
    if (!searchQuery.trim()) return;
    setLoadingSuggestions(true);
    try {
      const res = await axiosInstance.get(`/product/api/get-all-products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSuggestions(res.data.products.slice(0, 5));
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  return (
    <div className='w-full bg-white'>
      <div className='w-[80%] py-5 m-auto flex items-center justify-between'>
        <div>
          <Link href={"/"}>
            <span className='text-2xl font-800'>My-Shop</span>
          </Link>
        </div>
        <div className='w-[50%] relative'>
          <input type='text' placeholder='Search for Products...'
            className='w-full px-4 font-Poppins font-medium border-[2.5px] border-[#3489FF] outline-none h-[45px]'
          />
          <div className='w-[50px] cursor-pointer flex items-center justify-center h-[45px] bg-[#3489FF] absolute top-0 right-0'>
            <Search />
          </div>
        </div>
        <div className='flex items-center gap-8'>
          <div className='flex items-center gap-2'>
            {!isLoading && user ? (
              <>
                <Link href={"/profile"} className='border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full border-[#010f1c1a]'>
                  <ProfileIcon />
                </Link>
                <Link href={"/profile"}>
                  <span className='block font-medium'>Hello</span>
                  <span className='font-semibold'>{user?.name?.split(" ")[0]}</span>
                </Link>
              </>
            ) : (
              <>
                <Link href={"/login"} className='border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full border-[#010f1c1a]'>
                  <ProfileIcon />
                </Link>
                <Link href={"/login"}>
                  <span className='block font-medium'>Hello</span>
                  <span className='font-semibold'>{isLoading ? "..." : "Sign In"}</span>
                </Link>
              </>
            )}
          </div>
          <div className='flex items-center gap-5'>
            <Link href={"/wishlist"} className='relative'>
              <HeartIcon />
              <div className='w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]'>
                <span className='text-white font-medium text-sm'>{wishlist?.length}</span>
              </div>
            </Link>
            <Link href={"/cart"} className='relative'>
              <Cart />
              <div className='w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]'>
                <span className='text-white font-medium text-sm'>{cart?.length}</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
      <div className='border-b border-b-[#99999938]' />
      <HeaderBottom />
    </div>
  );
};

export default Header;
