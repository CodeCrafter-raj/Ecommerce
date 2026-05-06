"use client";
import React from "react";
import { Shops } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StarHalf, Stars, XIcon } from "lucide-react";
import Youtube from "apps/user-ui/src/assets/svgs/youtube-icon.svg";
import axiosInstance from "@/utils/axiosInstance";
import { Calendar, Clock, Globe, Heart, MapPin, Star, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import ProductCard from "../cards/product-card";
import useLocationTracking from "@/hooks/useLocationTracking";
import useDeviceTracking from "@/hooks/useDeviceTracking";
import { sendKafkaEvent } from "@/actions/track-user";
import useUser from "@/hooks/useUser";


const TABS = ["Products", "Orders", "Reviews"];

const SellerProfile = ({
  shop,
  followersCount
}: {
  shop: Shops;
  followersCount: number;
}) => {
  const [activeTab, setActiveTab] = useState("Products");
  const [followers, setFollowers] = useState(followersCount);
  const [isFollowing, setIsFollowing] = useState(false);

  const { user } = useUser();
  const location = useLocationTracking();
  const device = useDeviceTracking();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["seller-products"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/seller/api/get-seller-products/${shop?.id}?page=1&limit=10`);
      return res.data.products;
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const fetchFollowStatus = async () => {
      if (!shop?.id) {
        return;
      }
      try {
        const res = await axiosInstance.get(`/seller/api/is-following/${shop?.id}`);
        setIsFollowing(res.data.isFollowing != null);

      } catch (error) {
        console.log("Failed to fetch follow status", error);
      }
    };
    fetchFollowStatus();
  }, [shop?.id]);

  const { data: events, isLoading: isEventsLoading } = useQuery({
    queryKey: ["seller-events"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/seller/api/get-seller-events/${shop?.id}?page=1&limit=10`);
      return res.data.events;
    },
    staleTime: 1000 * 60 * 5,
  });

  const toggleFollowMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        await axiosInstance.post("/seller/api/unfollow-shop", {
          shopId: shop?.id
        });
      } else {
        await axiosInstance.post("/seller/api/follow-shop", {
          shopId: shop?.id
        });
      }
    },
    onSuccess: async () => {
      if (isFollowing) {
        setFollowers(followers - 1);
      } else {
        setFollowers(followers + 1);
      }
      setIsFollowing((prev) => !prev);
      queryClient.invalidateQueries({
        queryKey: ["is-following", shop?.id]
      })
    },
    onError: (error) => {
      console.log("Failed to follow/unfollow shop", error);
    }
  });

  useEffect(() => {
    if (!isLoading) {
      if (!location || !deviceInfo || !user?.id) return;
      sendKafkaEvent({
        userId: user.id,
        shopId: shop?.id,
        action: "shop_visited",
        country: location?.country || "Unknown",
        city: location?.city || "Unknown",
        device: deviceInfo || "Unknown",

      })
    }
  }, [location, deviceInfo, user?.id]);

  return (
    <div>
      <div className="relative w-full flex justify-center">
        <Image src={shop?.coverBanner || "Cover Banner"} width={1200} height={300} alt="Cover Banner" className="w-full h-[400px] object-cover" />
      </div>

      {/* {seller Info Section} */}
      <div className="w-[85%] lg:w-[70%] mt-[-50px] mx-auto relative z-20 flex flex-col lg:flex-row  gap-6">
        <div className="bg-gray-200 p-6 rounded-lg shadow-lg flex-1">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="relative w-[100px] h-[100px] rounded-full border-4 border-slate-300 overflow-hidden">
              <Image src={shop?.avatar || "shop avatar"} alt="seller Avatar" layout="fill"
                objectFit="cover"
              />
            </div>
            <div className="flex-1 w-full">
              <h1 className="text-2xl font-semibold text-slate-900">{shop?.name}</h1>
              <p className="text-sm mt-1 text-slate-800">{shop?.bio || "No Bio Available"}</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center text-blue-400 gap-1">
                  <Stars fill="#60a5fa" size={18} /> {" "}
                  <span>{shop?.rating || "N/A"}</span>
                </div>
                <div className="flex items-center text-slate-700 gap-1">
                  <Users size={18} />
                  <span>{followers}:Followers</span>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 text-slate-700">
                <Clock size={18} />
                <span>{shop?.opening_hours || "Mon-sat:9AM-8PM"}</span>
              </div>
              <div className="flex items-center gap-3 mt-3 text-slate-700">
                <MapPin size={18} />
                <span>{shop?.address || "No Address Available"}</span>
              </div>
            </div>
            <button className={`px-6 py-2 h-[40px] rounded-lg font-semibold flex items-center gap-2 transition ${isFollowing ? "bg-red-500 text-white" : "bg-blue-500 text-white"}`}
              onClick={() => toggleFollowMutation.mutate()}
              disabled={toggleFollowMutation.isPending}
            >
              <Heart size={18} />
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          </div>
        </div>

        <div className="bg-gray-200 p-6 rounded-lg shadow-lg w-full lg:w-[30%]">
          <h2 className="text-xl font-semibold text-slate-900">Shop Details</h2>
          <div className="flex items-center gap-3 mt-3 text-slate-700">
            <Calendar size={18} />
            <span>Joined At:{new Date(shop?.created_at).toLocaleDateString() || "N/A"}</span>
          </div>
          {shop?.website && (
            <div className="flex items-center gap-3 mt-3 text-slate-700">
              <Globe size={18} />
              <Link href={shop?.website} target="_blank" className="hover:underline text-blue-500">{shop?.website}</Link>
            </div>
          )}

          {shop?.socialLinks && shop?.socialLinks.length > 0 && (
            <div className="mt-3">
              <h3 className="text-slate-700 text-lg font-medium">Follow Us:</h3>
              <div className="flex gap-3 mt-2">
                {shop?.socialLinks?.map((link: any, index: number) => (
                  <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-500 opacity-[.9]">
                    {link.type === "youtube" && <Youtube size={18} />}
                    {link.type === "X" && <XIcon />}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* {Tab section} */}
      <div className="w-[85%] lg:w-[70%] mx-auto mt-8">
        {/* {Tabs} */}
        <div className="flex border-b border-gray-300">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`py-3 px-6 text-lg font-semibold ${activeTab === tab ? "text-slate-800 border-b-2 border-blue-600" : "text-slate-600"} transition`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* {Tab Content} */}
        <div className="bg-gray-200 rounded-lg my-4 text-slate-700">
          {activeTab === "products" && (
            <div className="m-auto grid grid-cols-1 p-4 sm:grid-cols-3 md:rid-cols-4 lg:grid-cols-5">
              {isLoading && (
                <>
                  {Array.from({ length: 10 }, (_, index) => (
                    <div className="h-[250px] bg-gray-300 animate-pulse rounded-xl" key={index}></div>
                  ))}
                </>
              )}
              {products?.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
              {products?.length === 0 && (
                <p className="text-slate-700 text-center py-2">No products found</p>
              )}
            </div>
          )}

          {activeTab === "Offers" && (
            <div className="m-auto grid grid-cols1 p-4 sm:grid-cols-3 md:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {isLoading && (
                <>
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div className="h-[250px] bg-gray-300 animate-pulse rounded-xl" key={index}></div>
                  ))}
                </>
              )}
              {events?.map((product: any) => (
                <ProductCard isEvent={true} key={product.id} product={product} />
              ))}
              {/* If this does not work replace events with products */}
              {events?.length === 0 && (
                <p className="text-slate-700 text-center py-2">No products found</p>
              )}
            </div>
          )}
          {activeTab === "Reviews" && (
            <div>
              <p className="text-center py-5">No reviews found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
};

export default SellerProfile;
