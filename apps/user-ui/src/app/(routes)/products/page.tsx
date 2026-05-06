"use client"

import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../../utils/axiosInstance";
import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Range } from "react-range";
import ProductCard from "../../../shared/components/cards/product-card";
const MIN = 0;
const MAX = 200000;

const Page = () => {
  const router = useRouter();
  const [isProductLoading, setIsProductLoading] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [tempPriceRange, setTempPriceRange] = useState([0, 1199]);

  const colors = [
    { name: "Black", code: "#000" },
    { name: "Red", code: "#ff0000" },
    { name: "Green", code: "#00ff00" },
    { name: "Blue", code: "#0000ff" },
    { name: "Yellow", code: "#ffff00" },
    { name: "Magenta", code: "#ff00ff" },
    { name: "Cyan", code: "#00ffff" },
  ];

  const sizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

  const updateURL = () => {
    const params = new URLSearchParams();
    params.set("priceRange", priceRange.join(","));

    if (selectedCategories.length > 0) {
      params.set("categories", selectedCategories.join(","));
    }
    if (selectedSizes.length > 0) {
      params.set("sizes", selectedSizes.join(","));
    }
    if (selectedColors.length > 0) {
      params.set("colors", selectedColors.join(","));
    }
    params.set("page", page.toString());
    params.set("limit", "10");
    router.replace(`/products?${decodeURIComponent(params.toString())}`);

  };


  const fetchFilteredProducts = async () => {
    setIsProductLoading(true);
    try {
      const query = new URLSearchParams();
      query.set("priceRange", priceRange.join(","));
      if (selectedCategories.length > 0) {
        query.set("categories", selectedCategories.join(","));
      }
      if (selectedSizes.length > 0) {
        query.set("sizes", selectedSizes.join(","));
      }
      if (selectedColors.length > 0) {
        query.set("colors", selectedColors.join(","));
      }
      query.set("page", page.toString());
      query.set("limit", "10");
      const url = `/product/api/get-filtered-products?${query.toString()}`;
      const res = await axiosInstance.get(url);
      setProducts(res?.data?.products);
      setTotalPages(res?.data?.pagination.totalPages);


    } catch (error) {
      console.log(error);
    } finally {
      setIsProductLoading(false);
    }
  }

  useEffect(() => {
    updateURL();
    fetchFilteredProducts();
  }, [priceRange, selectedCategories, selectedSizes, selectedColors, page]);


  const { data, isLoading, error } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/get-categories");
      return res?.data;
    },
    staleTime: 1000 * 60 * 30,
  });

  const toggleCategory = (label: string) => {
    setSelectedCategories((prev) => prev.includes(label) ? prev.filter((cat) => cat !== label) : [...prev, label]);
  }

  const toggleColor = (color: string) => {
    setSelectedColors((prev) => prev.includes(color) ? prev.filter((cat) => cat !== color) : [...prev, color]);
  }

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) => prev.includes(size) ? prev.filter((cat) => cat !== size) : [...prev, size]);
  }

  return (
    <div className="w-full Wbg-[#f5f5f5] pb-10">
      <div className="w-[90%] lg:w-[80%] m-auto">
        <div className="pb-[50px]" >
          <h1 className="md: pt-[40px] font-medium text-[44px] leading-1 mb-[14px] font-jost">All Products</h1>
          <Link href="/" className="text-[#222] font-medium hover:underline font-jost">Home</Link>
          <span className="text-[#222] font-medium font-jost">{" "}</span>
          <span className="text-[#222] font-medium font-jost">All-Products</span>
        </div>
        {/* Sidebar */}
        <div className="w-full flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-[270px] !rounded bg-white p-4 space-y-6 shadow-md">
            <h3 className="text-xl font-Poppins font-medium">Price Filter</h3>
            <div className="ml-2">
              <Range
                step={1}
                min={MIN}
                max={MAX}
                values={tempPriceRange}
                onChange={(values: any) => setTempPriceRange(values)}
                renderTrack={({ props, children }) => {
                  const [min, max] = tempPriceRange;
                  const percentageLeft = ((min - MIN) / (MAX - MIN)) * 100;
                  const percentageRight = ((max - MIN) / (MAX - MIN)) * 100;
                  return (
                    <div {...props} className="h-[6px] bg-blue-200 rounded relative" style={{ ...props.style }}>
                      <div className="absolute h-full bg-blue-600 rounded"
                        style={{ left: `${percentageLeft}%`, width: `${percentageRight - percentageLeft}%` }} />
                      {children}
                    </div>
                  );
                }}
                renderThumb={({ props }) => {
                  const { key, ...rest } = props;
                  return (
                    <div {...rest} key={key} className="w-[12px] h-[12px] rounded-full bg-blue-600 cursor-pointer" />
                  )
                }}
              />
            </div>
            <div className="flex justify-between items-center mt-2 ">
              <div className="text-sm text-gray-600">
                ${tempPriceRange[0]} - ${tempPriceRange[1]}
              </div>
              <div>
                <button onClick={() => { setPriceRange(tempPriceRange); setPage(1) }} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                  Apply
                </button>
              </div>
            </div>

            {/* Category Filter */}
            <h3 className="text-xl font-Poppins font-medium border-b border-b-slate-300 pb-1">Categories</h3>
            <ul className="space-y-2 !mt-3">
              {isLoading ? (
                <p>Loading ... </p>)
                : (data?.categories?.map((category: any) => (
                  <li
                    key={category}
                    className="flex items-center justify-between">
                    <label className="flex items-center gap-3 text-sm text-gray-700 font-semibold">
                      <input type="checkbox" checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)} className="accent-blue-600" />
                      {category}
                    </label>
                  </li>
                ))
                )}
            </ul>

            {/* Colors */}
            <h3 className="text-xl font-Poppins font-medium border-b border-b-slate-300 pb-1 mt-6">Filter By Size</h3>
            <ul className="space-y-2 !mt-3">
              {colors.map((color) => (
                <li
                  key={color.name}
                  className="flex items-center justify-between">
                  <label className="flex items-center gap-3 text-sm text-gray-700 font-semibold">
                    <input type="checkbox" checked={selectedColors.includes(color.name)}
                      onChange={() => toggleColor(color.name)} className="accent-blue-600" />
                    <span className="w-[16px] h-[16px] rounded-full border border-gray-300" style={{ backgroundColor: color.code }}></span>
                    {color.name}
                  </label>
                </li>
              ))}
            </ul>

            <h3 className="text-xl font-Poppins font-medium border-b border-b-slate-300 pb-1 mt-6">Filter By Size</h3>
            <ul className="space-y-2 !mt-3">
              {sizes.map((size) => (
                <li
                  key={size}
                  className="flex items-center justify-between">
                  <label className="flex items-center gap-3 text-sm text-gray-700 font-semibold">
                    <input type="checkbox" checked={selectedSizes.includes(size)}
                      onChange={() => toggleSize(size)} className="accent-blue-600" />
                    <span className="font-medium">{size}</span>
                  </label>
                </li>
              ))}
            </ul>
          </aside>

          {/* Products Grid */}
          <div className="flex-1 px-2 lg:px-3">
            {isProductLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[250px] bg-gray-300 animate-pulse rounded-xl"
                  ></div>
                ))}
              </div>) : products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {products.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>) : (
              <p>No Products Found!</p>
            )}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`px-3 py-1 !rounded boder border-gray-200 text-sm ${page === i + 1 ? 'bg-blue-600 text-white' : 'bg-white text-black'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
};
export default Page;