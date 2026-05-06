'use client';

import { MapPin, Plus, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import countries from '@/utils/countries';
import { useMutation, useQuery } from '@tanstack/react-query';
import axiosInstance from '@/utils/axiosInstance';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { isProtected } from "@/utils/protected";


const ShippingAddressSection = () => {
  const [showModal, setshowmodal] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      label: "",
      name: "",
      street: "",
      city: "",
      country: "India",
      zip: "",
      isDefault: false,
    },
  });

  const { mutate: addAddress } = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axiosInstance.post(
        "/api/add-user-address",
        payload,
        isProtected({})
      );
      return res.data.address;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-addresses"] });
      setshowmodal(false);
      reset();
    },
    onError: () => {
      toast.error("Something went wrong")
    }
  });


  const onSubmit = async (data: any) => {
    addAddress({
      ...data,
      isDefault: data?.isDefault === "true",
    });
  };



  const { data: addresses, isLoading } = useQuery({
    queryKey: ["shipping-addresses"],
    queryFn: async () => {
      const res = await axiosInstance.get(
        "/api/user-addresses",
        isProtected({})
      );
      return res.data.addresses;
    }
  });

  const { mutate: deleteAddress } = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(
        `/api/delete-user-address/${id}`,
        isProtected({})
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-addresses"] });
    },
    onError: () => {
      toast.error("Something went wrong")
    }
  });

  return (
    <div className='space-y-4'>
      {/* Headers */}
      <div className='flex justify-between items-center'>
        <h2 className='text-xl font-semibold text-gray-800'>Saved Address</h2>
        <button
          className='flex items-center gap-2 text-sm text-blue-600 font-medium hover:underline'
          onClick={() => setshowmodal(true)}
        >
          <Plus className='w-4 h-4' />
          Add New Address
        </button>
      </div>

      {/* Address List */}
      <div className='space-y-4'>
        {isLoading ? (
          <p className='text-sm text-gray-500'>Loading Addresses...</p>
        ) : !addresses || addresses.length === 0 ? (
          <p className='text-sm text-gray-600'>No saved addresses found.</p>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {addresses.map((address: any) => (
              <div
                key={address.id}
                className='border border-gray-200 rounded-md p-4 relative'
              >
                {address.isDefault && (
                  <span className='absolute top-2 right-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full'>
                    Default
                  </span>
                )}

                <div className='flex items-start gap-2 text-sm text-gray-700'>
                  <MapPin className='w-5 h-5 mt-0.5 text-gray-500' />
                </div>

                <div>
                  <p className='font-medium'>
                    {address.label} - {address.name}
                  </p>

                  {/* FIXED: removed parentheses */}
                  <p>
                    {address.street}, {address.city}, {address.zip}, {address.country}
                  </p>
                </div>

                <div className='flex gap-3 mt-4'>
                  <button
                    className='flex items-center gap-1 !cursor-pointer text-xs text-red-600'
                    onClick={() => deleteAddress(address.id)}
                  >
                    <Trash2 className='w-4 h-4' /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Address */}
      {showModal && (
        <div className='fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50'>
          <div className='bg-white w-full max-w-md p-6 rounded-md shadow-md relative'>
            <button
              className='absolute top-3 right-3 text-gray-600 hover:text-gray-800'
              onClick={() => setshowmodal(false)}
            >
              <X className='w-5 h-5' />
            </button>

            <h3 className='text-lg font-semibold mb-4 text-gray-800'>
              Add New Address
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className='form-input space-y-4'>

              {/* FIX: This select was wrongly bound to `country`. It should be label. */}
              <select
                {...register("label", { required: "Label is required" })}
                className='form-input'
              >
                <option value="">Select Label</option>
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
              {errors.label && <p className='text-red-500 text-xs'>{errors.label.message}</p>}

              <input
                placeholder='Name'
                {...register("name", { required: "Name is required" })}
                className='form-input'
              />
              {errors.name && <p className='text-red-500 text-xs'>{errors.name.message}</p>}

              <input
                placeholder='Street'
                {...register("street", { required: "Street is required" })}
                className='form-input'
              />
              {errors.street && <p className='text-red-500 text-xs'>{errors.street.message}</p>}

              <input
                placeholder='City'
                {...register("city", { required: "City is required" })}
                className='form-input'
              />
              {errors.city && <p className='text-red-500 text-xs'>{errors.city.message}</p>}

              {/* FIX: Only ONE country field now (correct) */}
              <select
                {...register("country", { required: "Country is required" })}
                className='form-input'
              >
                <option value="">Select Country</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
              {errors.country && (
                <p className='text-red-500 text-xs'>{errors.country.message}</p>
              )}

              <input
                placeholder='Zip'
                {...register("zip", { required: "Zip is required" })}
                className='form-input'
              />
              {errors.zip && <p className='text-red-500 text-xs'>{errors.zip.message}</p>}

              <select {...register("isDefault")} className='form-input'>
                <option value="false">Not Default</option>
                <option value="true">Set as Default</option>
              </select>

              <button
                type='submit'
                className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700'
              >
                Add Address
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );



  // return (
  //   <div className='space-y-4'>
  //     {/* Headers */}
  //     <div className='flex justify-between items-center'>
  //       <h2 className='text-xl font-semibold text-gray-800'>Saved Address</h2>
  //       <button className=' flex items-center gap-2 text-sm text-blue-600 font-medium hover:underline'
  //         onClick={() => setshowmodal(true)}>
  //         <Plus className='w-4 h-4' />
  //         Add New Address
  //       </button>
  //     </div>

  //     {/* Address List */}
  //     <div className='space-y-4'>
  //       {isLoading ? (
  //         <p className='text-sm text-gray-500'>
  //           Loading Addresses...
  //         </p>
  //       ) : !addresses || addresses.length === 0 ? (
  //         <p className='text-sm text-gray-600'>No saved addresses found.</p>
  //       ) : (
  //         <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
  //           {addresses.map((address: any) => (
  //             <div key={address.id}
  //               className='border border-gray-200 rounded-md p-4 relative'>
  //               {address.isDefault && (
  //                 <span className='absolute top-2 right-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full'>
  //                   Default
  //                 </span>
  //               )}
  //               <div className='flex items-start gap-2 text-sm text-gray-700'>
  //                 <MapPin className='w-5 h-5 mt-0.5 text-gray-500' />
  //               </div>
  //               <div>
  //                 <p className=" font-medium">
  //                   {address.label} - {address.name}
  //                 </p>
  //                 <p>
  //                   (address.street), {address.city}, {address.zip},{" "}
  //                   {address.country}
  //                 </p>
  //               </div>

  //               <div className='flex gap-3 mt-4'>
  //                 <button className='flex items-center gap-1 !cursor-pointer text-xs text-red-600' onClick={() => deleteAddress(address.id)}>
  //                   <Trash2 className='w-4 h-4' /> Delete
  //                 </button>
  //               </div>
  //             </div>
  //           ))}
  //         </div>
  //       )}
  //     </div>
  //     {/* Modal Address */}
  //     {showModal && (
  //       <div className='fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50'>
  //         <div className='bg-white w-full max-w-md p-6 rounded-md shadow-md relative'>
  //           <button className='absolute top-3 right-3 text-gray-600 hover:text-gray-800' onClick={() => setshowmodal(false)}>
  //             <X className='w-5 h-5' />
  //           </button>
  //           <h3 className='text-lg font-semibold mb-4 text-gray-800'>Add New Address</h3>
  //           <form onSubmit={handleSubmit(onSubmit)} className='form-input space-y-4'>
  //             <select {...register("country")}>
  //               <option value="Home">Home</option>
  //               <option value="Work">Work</option>
  //               <option value="Other">Other</option>
  //             </select>

  //             <input placeholder='Name' {...register("name", { required: "Name is required" })} className="form-input" />
  //             {errors.name && (<p className='text-red-500 text-xs'>{errors.name.message}</p>)}


  //             <input placeholder='City' {...register("city", { required: "City is required" })} className="form-input" />
  //             {errors.city && (<p className='text-red-500 text-xs'>{errors.city.message}</p>)}


  //             <input placeholder='Country' {...register("country", { required: "Country is required" })} className="form-input" />
  //             {errors.country && (<p className='text-red-500 text-xs'>{errors.country.message}</p>)}


  //             <input placeholder='Zip' {...register("zip", { required: "Zip is required" })} className="form-input" />
  //             {errors.zip && (<p className='text-red-500 text-xs'>{errors.zip.message}</p>)}

  //             <select {...register("country")} className='form-input'>
  //               {countries.map((country) => (
  //                 <option key={country.code} value={country.name}>{country.name}</option>
  //               ))}
  //             </select>

  //             <select {...register("isDefault")} className="form-input">
  //               <option value="true">Set as Default</option>
  //               <option value="false">Not Default</option>
  //             </select>

  //             <button type='submit' className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700'>Add Address</button>
  //           </form>
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // );
};
export default ShippingAddressSection;
