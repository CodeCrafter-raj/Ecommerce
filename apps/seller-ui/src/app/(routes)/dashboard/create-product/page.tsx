"use client"

import React, { useMemo, useState, useEffect } from "react";
import { Controller, useForm } from 'react-hook-form';
import { ChevronRight, Wand, X } from "lucide-react";
import ImagePlaceHolder from "../../../../shared/components/image-placeholder";
import Input from "packages/components/input";
import ColorSelector from "packages/components/color-selector";
import CustomSpecifications from "packages/components/custom-specification";
import CustomProperties from "packages/components/custom-properties";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../../../utils/axiosInstance";
import RichTectEditor from "packages/components/rich-text-editor";
import SizeSelector from "packages/components/size-selector";
import { rejects } from "assert";
import { read } from "fs";
import Image from "next/image";
import { enhancements } from "apps/seller-ui/src/utils/AI.Enhancement";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// interface uploadedImage {
//   fileId: string;
//   file_url: string;
// }

interface uploadedImage {
  file_id: string;
  url: string;
}

const Page = () => {
  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // 2️⃣ Type for uploaded images
  // type UploadedImage = {
  //   fileId: string;
  //   file_url: string;
  // };

  type UploadedImage = {
    file_id: string;
    url: string;
  };


  const [openImageModal, setOpenImageModal] = React.useState(false);
  const [isChanged, setIsChanged] = React.useState(false);
  const [activeEffect, setActiveEffect] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = React.useState('');
  const [pictureUploadingLoader, setPictureUploadingLoader] = React.useState(false);
  const [images, setImages] = React.useState<(uploadedImage | null)[]>([null]);
  const [loading, setLoading] = React.useState(false);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();



  const { data, isLoading, isError } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {

      try {
        const res = await axiosInstance.get("/product/api/get-categories");
        return res.data || null;
      } catch (error) {
        console.log(error);
        return null; // <- important: don't return undefined
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  const { data: discountCodes = [], isLoading: discountLoading } = useQuery({
    queryKey: ["shop-discounts"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/get-discount-codes");
      return res?.data?.discount_codes || [];
    },
  });

  const categories = data?.categories || [];
  const subCategoriesData = data?.subCategories || {};

  const selectedCategory = watch("category");
  const regularPrice = watch("regular_price");

  const subCategories = useMemo(() => {
    return selectedCategory ? subCategoriesData[selectedCategory] || [] : [];
  }, [selectedCategory, subCategoriesData]);



  // const salePrice= watch("sale_price");

  console.log({ categories, subCategoriesData });
  // console.log("selectedCategory →", selectedCategory);
  // console.log("subCategoriesData →", subCategoriesData);
  // console.log("subCategories →", subCategories);


  const onSubmit = async (data: any) => {
    //console.log(data);
    try {
      setLoading(true);
      await axiosInstance.post("/product/api/create-product", data);
      router.push("/dashboard/all-products");
    } catch (error: any) {
      toast.error(error?.data?.message);
    } finally {
      setLoading(false);
    }
  }

  const convertFileToBase64 = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };


  const handleImageChange = async (file: File | null, index: number) => {
    if (!file) return;

    setPictureUploadingLoader(true);
    try {
      const fileBase64 = await convertFileToBase64(file);

      const response = await axiosInstance.post("/product/api/upload-product-image", {
        fileBase64,
      });

      const uploaded = {
        file_id: response.data.fileId,
        url: response.data.file_url,
      };


      // Update local UI state
      const updatedImages = [...images];
      updatedImages[index] = uploaded;

      // Add a new placeholder if needed
      if (index === images.length - 1 && updatedImages.length < 8) {
        updatedImages.push(null);
      }
      console.log("🔥 updatedImages:", updatedImages);
      console.log("🔥 form images:", watch("images"));

      // 🔥 ADD LOGS RIGHT HERE


      setImages(updatedImages);

      console.log("⬅️ UPDATED IMAGES STATE:", updatedImages);

      console.log(
        "⬅️ FILTER CHECK DATA:",
        updatedImages.map(img => img && {
          file_id: img.file_id,
          url: img.url,
          hasFileId: !!img.file_id,
          hasUrl: !!img.url
        })
      );

      console.log("⬅️ BEFORE setValue(), RHF watch(images):", watch("images"));


      // Update form value with CLEAN ARRAY for backend
      // setValue(
      //   "images",
      //   updatedImages
      //     .filter((img) => img && img.fileId && img.file_url)
      //     .map((img) => ({
      //       file_id: img!.fileId,
      //       url: img!.file_url,
      //     })),
      //   { shouldDirty: true, shouldValidate: true }  
      // );

      setValue(
        "images",
        updatedImages
          .filter((img) => img && img.file_id && img.url)
          .map((img) => ({
            file_id: img!.file_id,
            url: img!.url,
          })),
        { shouldDirty: true, shouldValidate: true }
      );

      console.log("➡️ AFTER setValue(), RHF watch(images):", watch("images"));

    } catch (error) {
      console.log(error);
    } finally {
      setPictureUploadingLoader(false);
    }
  };


  const handleRemoveImage = async (index: number) => {
    try {
      const updatedImages = [...images];
      const imageToDelete = updatedImages[index];

      // Delete ImageKit file if exists
      if (imageToDelete && typeof imageToDelete === "object") {
        await axiosInstance.delete("/product/api/delete-product-image", {
          data: { fileId: imageToDelete.file_id }
        });
      }

      updatedImages.splice(index, 1);

      if (!updatedImages.includes(null) && updatedImages.length < 8) {
        updatedImages.push(null);
      }

      setImages(updatedImages);

     console.log("⬅️ UPDATED IMAGES STATE (DELETE):", updatedImages);
      console.log("⬅️ BEFORE setValue() (DELETE):", watch("images"));


      // console.log(
      //   "⬅️ FILTER CHECK DATA:",
      //   updatedImages.map(img => img && {
      //     file_id: img.file_id,
      //     url: img.url,
      //     hasFileId: !!img.file_id,
      //     hasUrl: !!img.url
      //   })
      // );

      // console.log("⬅️ BEFORE setValue(), RHF watch(images):", watch("images"));


      setValue(
        "images",
        updatedImages
          .filter((img) => img && img.file_id && img.url)
          .map((img) => ({
            file_id: img!.file_id,
            url: img!.url,
          })),
        { shouldDirty: true, shouldValidate: true }
      );
      

     console.log("➡️ AFTER setValue() (DELETE):", watch("images"));

    } catch (error) {
      console.log(error);
    }
  };


  const applyTransformation = async (transformation: string) => {
    if (!selectedImage || processing) return;
    setProcessing(true);
    setActiveEffect(transformation);
    try {
      const transformedUrl = `${selectedImage}?tr=${transformation}`;
      setSelectedImage(transformedUrl);
    }
    catch (error) {
      console.log(error)
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveDraft = () => {
    // Implement save draft functionality here
  };

  return (
    <form className='w-full mx-auto p-8 shadow-md rounded-lg text-white'
      onSubmit={handleSubmit(onSubmit)}>

      {/* Hidden field to make RHF track images */}
      <input type="hidden" {...register("images")} />

      {/* Heading & Breadcrumbs */}
      <h2 className="text-2xl py-z font-semibold font-Poppins text-white">
        Create Product
      </ h2>
      <div className="flex items-center">
        <span className="text-[#80Deea] cursor-pointer">Dashboard</ span>
        <ChevronRight size={20} className="opacity-[.8]" />
        <span>Create Product</span>
      </div>

      {/* Content Layout */}

      <div className="py-4 w-full gap-6">
        {/* Left Side - Image upload section */}
        <div className="md:w-[35%]">
          {images?.length > 0 && (
            <ImagePlaceHolder
              setOpenImageModal={setOpenImageModal}
              size="765 x 850"
              small={false}
              images={images}
              pictureUploadingLoader={pictureUploadingLoader}
              index={0}
              onImageChange={handleImageChange}
              setSelectedImage={setSelectedImage}
              onRemove={handleRemoveImage}
            />
          )}

          <div className="grid grid-cols-2 gap-3 mt-4">
            {images?.slice(1).map((_, index) => (
              <ImagePlaceHolder
                setOpenImageModal={setOpenImageModal}
                size="765 X 850"
                images={images}
                pictureUploadingLoader={pictureUploadingLoader}
                small={true}
                index={index + 1}
                key={index + 1}
                onImageChange={handleImageChange}
                setSelectedImage={setSelectedImage}
                onRemove={handleRemoveImage}
                defaultImage={null}
              />
            ))}
          </div>
        </div>
        {/* Right side - form inputs */}
        <div className="md: w-[65%] " >
          <div className="w-full flex gap-6">
            {/* Product Title Input */}
            <div className="w-2/4">
              <Input
                label="Product Title *"
                placeholder="Enter product title"
                {...register("title", { required: "Title is required" })} />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.title.message as string}
                </p>
              )}

              <div className="mt-2">
                <Input
                  type="textarea"
                  rows={7}
                  cols={10}
                  label="Short Description * (Max 150 words)"
                  placeholder="Enter product description for quick view"
                  {...register("short_description", {
                    required: "Description is required",
                    validate: (value) => {
                      const wordCount = value.trim().split(/\s+/).length;
                      return (
                        wordCount <= 150 || `Description cannot exceed 150 words (Current: ${wordCount})`)
                    },
                  })} />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.description.message as string}
                  </p>
                )} ;
              </div>

              <div className="mt-2">
                <Input
                  label="Tags *"
                  placeholder="Apple, Flagship"
                  {...register("tags", {
                    required: "Seperated realted tags with a comma,",
                  })} />
                {errors.tags && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.tags.message as string}
                  </p>
                )} ;
              </div>

              <div className="mt-2">
                <Input
                  label="Warranty *"
                  placeholder="1 yr/ No warranty"
                  {...register("warranty", {
                    required: "Warranty is required,",
                  })} />
                {errors.warranty && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.warranty.message as string}
                  </p>
                )} ;
              </ div>

              <div className="mt-2">
                <Input
                  label="Slug *"
                  placeholder="product_slug"
                  {...register("slug", {
                    required: "Slug is required!",
                    pattern: {
                      value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                      message: "Invalid slug format! Use only lowercase letters, numbers, and hyphens."
                    },
                    minLength: {
                      value: 3,
                      message: "Slug must be at least 3 characters long."
                    },
                    maxLength: {
                      value: 50,
                      message: "Slug cannot exceed 50 characters."
                    }
                  })} />
                {errors.slug && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.slug.message as string}
                  </p>
                )} ;
              </div>

              <div className="mt-2">
                <Input
                  label="Brand"
                  placeholder="Apple"
                  {...register("brand")} />

                {errors.brand && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.brand.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <ColorSelector control={control} errors={errors} />
              </div>

              <div className="mt-2">
                <CustomSpecifications control={control} errors={errors} />
              </div>

              <div className="mt-2">
                <CustomProperties control={control} errors={errors} />
              </div>

              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">
                  Cash On Delivery *
                </label>
                <select
                  {...register("cashOnDelivery", {
                    required: "Cash on Delivery is required",
                  })}
                  defaultValue="yes"
                  className="w-full border outline-none border-gray-700 bg-transparent"
                >
                  <option value="yes" className="bg-gray-900">Yes</option>
                  <option value="no" className="bg-gray-900">No</option>
                </select>
              </div>

            </ div>

            <div className="w-2/4">
              < label className="block font-semibold text-gray-300 mb-1">
                Category *
              </label>
              {
                isLoading ? (
                  <p className="text-gray-400">Loading Categories...</p>
                ) : isError ? (
                  <p className="text-red-500">Error loading categories.</p>
                ) : (
                  <Controller
                    name="category"
                    control={control}
                    rules={{ required: "Category is required" }}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full border outline-none border-gray-700 bg-transparent p-2 rounded"
                      >
                        <option value="" className="bg-gray-900">
                          Select Category
                        </option>

                        {categories?.map((category: any) => (
                          <option value={category} key={category} className="bg-gray-900">
                            {category}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                )}
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.category.message as string}
                </p>
              )}

              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">
                  Sub Category *
                </label>
                <Controller
                  name="subCategory"
                  control={control}
                  rules={{ required: "Sub Category is required" }}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full border outline-none border-gray-700 bg-transparent p-2 rounded"
                    >
                      <option value="" className="bg-gray-900">Select Sub Category</option>
                      {subCategories?.map((subCategory: any) => (
                        <option
                          value={subCategory}
                          key={subCategory}
                          className="bg-gray-900"
                        >
                          {subCategory}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.subCategory && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.subCategory.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">
                  Detailed Description * (Min 100 words)
                </ label>
                <Controller
                  name="detailed_description"
                  control={control}
                  rules={{
                    required: "Detailed description is required!",
                    validate: (value) => {
                      const wordCount = value.trim().split(/\s+/).length;
                      return (
                        wordCount >= 50 || `Detailed description must be at least 100 words (Current: ${wordCount})`
                      );
                    },
                  }}
                  render={({ field }) => (
                    <RichTectEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.detailed_description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.detailed_description.message as string}
                  </p>
                )} ;
              </div>

              <div className="mt-2">
                <Input
                  label="Video URL"
                  placeholder="https://www.youtube.com/embed/xyz123"
                  {...register("video_url", {
                    pattern: {
                      value: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
                      message: "Please enter a valid YouTube URL.",
                    },
                  }
                  )} />
                {errors.video_url && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.video_url.message as string}
                  </p>
                )} ;
              </div>

              <div className="mt-2">
                <Input
                  type="number"
                  label="Regular Price *"
                  placeholder="1000"
                  {...register("regular_price", {
                    required: "Regular price is required",
                    valueAsNumber: true,
                    min: {
                      value: 1, message: "Price cannot be negative",
                    },
                    validate: (value) =>
                      !isNaN(value) || "Price must be greater than zero",
                  })} />
                {errors.regular_price && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.regular_price.message as string}
                  </p>
                )} ;
              </div>

              <div className="mt-2">
                <Input
                  type="number"
                  label="Sale Price"
                  placeholder="800"
                  {...register("sale_price", {
                    valueAsNumber: true,
                    min: {
                      value: 1,
                      message: "Sale price cannot be negative",
                    },
                    validate: (value) =>
                      isNaN(value) || value < regularPrice ||
                      "Sale price must be less than regular price",
                  })} />
                {errors.sale_price && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.sale_price.message as string}
                  </p>
                )} ;
              </div>

              <div className="mt-2">
                <Input
                  type="number"
                  label="Stock Quantity *"
                  placeholder="50"
                  {...register("stock", {   // <-- FIXED HERE
                    required: "Stock quantity is required",
                    valueAsNumber: true,
                    min: {
                      value: 1,
                      message: "Stock quantity cannot be negative",
                    },
                    max: {
                      value: 1000,
                      message: "Stock quantity cannot exceed 1000",
                    },
                    validate: (value) =>
                      !isNaN(value) || "Stock quantity must be a number",
                  })}
                />

                {errors.stock && (   // <-- FIXED HERE
                  <p className="text-red-500 text-xs mt-1">
                    {errors.stock.message as string}
                  </p>
                )}
              </div>


              <div className="mt-2">
                <SizeSelector control={control} errors={errors} />
              </div>

              <div className="mt-3">
                <label className="block font-semibold text-gray-300 mb-1">
                  Select Discount Codes (optional)
                </label>

                {discountLoading ? (
                  <p className="text-gray-400">Loading Discount Codes..</p>
                ) : (
                  <div className="flex flex:wrap gap-2">
                    {discountCodes?.map((code: any) => (
                      <button
                        key={code.id}
                        type="button"
                        className={`px-3 py-1 rounded-md text-sm font-semibold border ${watch("discount_codes")?.includes(code.id)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700 "
                          }`}
                        onClick={() => {
                          const current = watch("discount_codes") || [];

                          const updated = current.includes(code.id)
                            ? current.filter((id: string) => id !== code.id)
                            : [...current, code.id];

                          setValue("discount_codes", updated);
                        }}
                      >
                        {code?.public_name} ({code.discountValue}
                        {code.discountType === "percentage" ? "%" : "$"})
                      </button>
                    ))}
                  </div>
                )}
              </div>


            </div>

            {/* <div className="mt-2">
              <SizeSelector control={control} errors={errors}/>
            </div> */}
          </ div>
        </div>
      </div>
      {openImageModal && (
        <div className="fixed top-0 left-0 w-full  h-full flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-[450px] text-white">
            <div className="flex justify-between items-center pb-3 mb-4">
              <h2 className="text-lg font-semibold">Enhance Product Image</h2>
              <X size={20} className="cursor-pointer"
                onClick={() => setOpenImageModal(!openImageModal)} />
            </div>

            <div className="w-full h-[250px] rounded-md overflow-hidden border border-gray-600">
              <Image src={selectedImage}
                alt="preview"
                layout="fill" />
            </div>
            {selectedImage && (
              <div className="mt-4 space-y-2">
                <h3 className="text-white text-sm font-semibold">AI Enhancement</h3>
                <div className="grid grid-cols-2 gap-3 mx-h-[250px] overflow-y-auto">
                  {enhancements?.map(({ label, effect }) => (
                    <button
                      key={effect}
                      className={`p-2 rounded-md items-center gap-2 ${activeEffect === effect ? "bg-blue-600 text-white" : "bg-gray-700 hover:bg-gray-600"
                        }`}
                      onClick={() => applyTransformation(effect)}
                      disabled={processing}

                    >
                      <Wand size={18} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="mt-6 flex justify-end gap-3">
        {isChanged && (
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            SaveDraft
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Creating Product..." : "Create Product"}
        </button>
      </div>
    </form >
  );
};

export default Page;


