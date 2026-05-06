"use client"
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import useUser from '@/hooks/useUser';
import axiosInstance from '@/utils/axiosInstance';

import axios, { AxiosError } from 'axios'; // 1. Import axios and the type
import Loadable from 'next/dist/shared/lib/loadable.shared-runtime';
import { Loader2 } from 'lucide-react';

interface Item {
  productId: string;
  quantity: number;
  price: number;
  selectedOptions: Record<string, string | number>; // Define it here
  product?: {
    title: string;
    images: { url: string }[];
  };
}

const Page = () => {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);


  useEffect(() => {
    const controller = new AbortController();

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setOrder(null);

        const res = await axiosInstance.get(`/order/api/get-order-details/${orderId}`, {
          signal: controller.signal
        });

        setOrder(res.data.order);
      } catch (err) {
        // 2. Use axios.isCancel(err) - it acts as a Type Guard
        if (axios.isCancel(err)) {
          return;
        }

        // 3. Cast err to AxiosError to access .response or .message safely
        const axiosError = err as AxiosError;
        console.error("Failed to fetch order details", axiosError.message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (orderId) {
      fetchOrder();
    }

    return () => {
      controller.abort();
    };
  }, [orderId, axiosInstance]);

  if (loading) {
    return <div className='flex justify-center items-center h-[40vh]'>
      <Loader2 className="animate-spin w-6 h-6 text-gray-600" />
    </div>;
  }

  if (!order) {
    return <div className='flex justify-center items-center h-[40vh]'>
      <p className="text-gray-600">Order not found</p>
    </div>;
  }

  return (
    <div className='max-w-5xl mx-auto px-4 py-10'>
      <h1 className='text-2xl font-bold text-gray-800 mb-4'>Order #{order.id.slice(-6)}</h1>

      <div className='my-4'>
        {/* Step Labels */}
        <div className='flex items-center justify-between text-xs font-medium text-gray-500 mb-2'>
          {[
            "Ordered",
            "Packed",
            "Shipped",
            "Out for Delivery",
            "Delivered"
          ].map((status, index) => {
            const deliveryStatus = (order.deliveryStatus || "Processing").toLowerCase();
            const current = status.toLowerCase() === deliveryStatus;
            const passed = index <= [
              "Ordered", "Packed", "Shipped", "Out for Delivery", "Delivered"
            ].findIndex((s) => s.toLowerCase() === deliveryStatus);

            return (
              <div
                key={index}
                className={`flex-1 text-left ${current ? "text-blue-600" : passed ? "text-green-600" : "text-gray-600"}`}
              >
                {status}
              </div>
            );
          })}
        </div>

        {/* Step Indicators */}
        <div className='flex items-center'>
          {[
            "Ordered", "Packed", "Shipped", "Out for Delivery", "Delivered"
          ].map((status, index) => {
            const isReached = index <= [
              "Ordered", "Packed", "Shipped", "Out for Delivery", "Delivered"
            ].findIndex((s) => s.toLowerCase() === (order.deliveryStatus || "Processing").toLowerCase());

            return (
              <div key={index} className={`flex items-center ${index !== 4 ? "flex-1" : ""}`}>
                <div className={`w-4 h-4 rounded-full flex-shrink-0 ${isReached ? "bg-green-600" : "bg-gray-200"}`} />
                {index !== 4 && (
                  <div className={`flex-1 h-1 ${isReached ? "bg-green-600" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Info */}
      <div className="mb-6 space-y-1 text-sm text-gray-700">
        <p>
          <span className="font-semibold">Payment Status: </span>
          <span className="text-green-600 font-medium">{order.status}</span>
        </p>

        <p>
          <span className="font-semibold">Total Paid: </span>
          <span className="font-medium">${order.total.toFixed(2)}</span>
        </p>

        {order.discountAmount > 0 && (
          <p>
            <span className="font-semibold">Discount Applied: </span>
            <span className="text-green-700">
              -${order.discountAmount.toFixed(2)} ({order.couponCode?.discountType === "percentage"
                ? `${order.couponCode.discountValue}%`
                : `$${order.couponCode.discountValue}`} off)
            </span>
          </p>
        )}

        {order.couponCode && (
          <p>
            <span className="font-semibold">Coupon: </span>
            <span className="text-blue-700">
              {order.couponCode.public_name}
            </span>
          </p>
        )}

        <p>
          <span className="font-semibold">Date: </span>
          {new Date(order.createdAt).toLocaleDateString()}
        </p>
      </div>
      {/* Shipping Info */}
      {order.shippingAddress && (
        <div className="mb-6 text-sm text-gray-700">
          <h2 className="text-md font-semibold mb-2">Shipping Address</h2>
          <p>{order.shippingAddress.name}</p>
          <p>
            {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.zip}
          </p>
          <p>{order.shippingAddress.country}</p>
        </div>
      )}

      {/* Order Items */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Order Items
        </h2>
        <div className="space-y-4">
          {order.items.map((item: any) => (
            <div
              key={item.productId}
              className="border border-gray-200 rounded-md p-4 flex items-center gap-4"
            >
              <img
                src={item.product?.images[0]?.url || "/placeholder.png"}
                alt={item.product?.title || "Product image"}
                className="w-16 h-16 object-cover rounded-md border border-gray-200"
              />

              <div className="flex-1">
                <p className="font-medium text-gray-800">
                  {item.product?.title || "Unnamed Product"}
                </p>
                <p className="text-sm text-gray-600">
                  Quantity: {item.quantity}
                </p>

                {/* Selected Options (Size, Color, etc.) */}
                {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                  <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-3">
                    {Object.entries(item.selectedOptions as Record<string, string | number>).map(([key, value]) => (
                      value && (
                        <span key={key} className="flex items-center gap-1">
                          <span className="font-medium capitalize">{key}: </span>
                          {typeof value === 'string' && value.startsWith('#') ? (
                            <span
                              className="w-3 h-3 rounded-full border border-gray-300"
                              style={{ backgroundColor: value }}
                            />
                          ) : (
                            <span>{String(value)}</span>
                          )}
                        </span>
                      )
                    ))}
                  </div>
                )}
              </div>

              <p className="text-sm font-semibold text-gray-800">
                ${item.price.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}  
