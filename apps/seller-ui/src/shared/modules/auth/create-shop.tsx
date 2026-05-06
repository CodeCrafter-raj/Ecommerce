'use client'
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import React from 'react';
import { useForm } from 'react-hook-form';
import { shopCategories } from 'apps/seller-ui/src/utils/categories';

const CreateShop = ({ 
  sellerId, setActiveStep }: { sellerId?: string; setActiveStep: (step: number) => void }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const shopCreateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URI}/api/create-shop`,
        data
      );

      return response.data;
    },
    onSuccess: () => {
      setActiveStep(3)
    }
  });

  const onSubmit = async (data: any) => {  
    const shopData = { ...data, sellerId };
    console.log("SENDING SHOP DATA:", shopData);
    shopCreateMutation.mutate(shopData);
  }

  const countWords=(text:string)=>text.trim().split(/\s+/).length;

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>

        <h3 className='text-2xl font-semibold text-center mb-4'>SetUp New Shop</h3>
        <label className='block text-gray-700 mb-1'>Name *</label>
        <input type='text'
          placeholder='....'
          className='w-full p-2 border border-gray-300 outline-0 rounded mb-1'
          {...register("name", {
            required: "Name is required",
          })}
        />
        {errors.name && (
          <p className='text-red-600 text-sm'>
            {String(errors.name.message)}
          </p>
        )}

        <label className='block text-gray-700 mb-1'>Bio(Description-Max 100 words) *</label>
        <input type='Shop bio'
          placeholder='....'
          className='w-full p-2 border border-gray-300 outline-0 rounded mb-1'
          {...register("bio", {
            required: "Bio/Description is required",
            validate:(value)=>countWords(value)<=100 || "Bio can't exceed 100 words",
          })}
        />
        {errors.bio && (
          <p className='text-red-600 text-sm'>
            {String(errors.bio.message)}
          </p>
        )}

        <label className='block text-gray-700 mb-1'>Address *</label>
        <input type='text'
          placeholder='Shop Location'
          className='w-full p-2 border border-gray-300 outline-0 rounded mb-1'
          {...register("address", {
            required: "Shop Address is required",
          })}
        />
        {errors.address && (
          <p className='text-red-600 text-sm'>
            {String(errors.address.message)}
          </p>
        )}

        <label className='block text-gray-700 mb-1'>Opening Hours *</label>
        <input type='text'
          placeholder='e.g.,Mon-Fri 9AM-8PM'
          className='w-full p-2 border border-gray-300 outline-0 rounded mb-1'
          {...register("opening_hours", {
          })}
        />
        {errors.opening_hours && (
          <p className='text-red-600 text-sm'>
            {String(errors.opening_hours.message)}
          </p>
        )}

        <label className='block text-gray-700 mb-1'>Website</label>
        <input type='url'
          placeholder='http://example.com'
          className='w-full p-2 border border-gray-300 outline-0 rounded mb-1'
          {...register("website", {
            pattern:{
              value:/^(http?:\/\/)?([\w\d-]+\.)+\w{2,}(\/.*)?$/,
              message:"Enter a Valid URL"
            },
          })}
        />
        {errors.websites && (
          <p className='text-red-600 text-sm'>
            {String(errors.websites.message)}
          </p>
        )}

        <label className='block text-gray-700 mb-1'>Category *</label>
        <select className='w-full p-2 border border-gray-300 outline-0 rounded mb-1'
          {...register("category", {
            required:"category is required"
          })}>
            <option value="">Select a category</option>
            {shopCategories.map((category)=>(
              <option  key={category.value} value={category.value}>{category.label}</option>
            ))}
        </select>
          
        {errors.category && (
          <p className='text-red-600 text-sm'>
            {String(errors.category.message)}
          </p>
        )}
        <button type={"submit"}
        className="w-full text-lg bg-blue-600 text-white py-2 rounded-lg mt-4">Submit</button> 
      </form>
    </div>
  )
};

export default CreateShop;
