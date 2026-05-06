import React from "react";
import { MapPin, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface ShopCardProps {
  shop: {
    id: string;
    name: string;
    description?: string;
    avatar: string;
    coverBanner?: string;
    address?: string;
    followers?: [];
    rating?: number;
    category?: string;
  };
}

// Safe image handler → prevents empty string src error
const safeImage = (value: string | undefined, fallback: string) => {
  return value && value.trim() !== "" ? value : fallback;
};

const ShopCard: React.FC<ShopCardProps> = ({ shop }) => {
  return (
    <div className="w-full rounded-md cursor-pointer bg-white border border-gray-200 shadow-sm overflow-hidden transition">

      {/* Shop Cover Banner */}
      <div className="h-[120px] w-full relative">
        <img
          src={safeImage(shop.coverBanner, "/placeholder-cover.jpg")}
          alt={shop.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Shop Avatar */}
      <div className="relative flex justify-center -mt-8">
        <div className="w-16 h-16 rounded-full border-4 border-white overflow-hidden shadow bg-white">
          <img
            src={safeImage(shop.avatar, "/fallback-avatar.png")}
            alt={shop.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Shop Information */}
      <div className="px-4 pb-4 pt-2 text-center">
        <h3 className="text-base font-semibold text-gray-800">{shop.name}</h3>

        <p className="text-xs text-gray-500 mt-0.5">
          {shop.followers?.length ?? 0} Followers
        </p>

        {/* Address + Rating */}
        <div className="flex items-center justify-center text-xs text-gray-500 mt-2 gap-4 flex-wrap">
          {shop.address && (
            <span className="flex items-center gap-1 max-w-[120px]">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">{shop.address}</span>
            </span>
          )}

          <span className="flex items-center gap-1">
            {shop.rating ?? "N/A"}
          </span>
        </div>

        {/* Category */}
        {shop.category && (
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
            <span className="bg-blue-50 capitalize text-blue-600 px-2 py-0.5 rounded-full font-medium">
              {shop.category}
            </span>
          </div>
        )}

        {/* Visit Button */}
        <div className="mt-4">
          <Link
            href={`/shop/${shop.id}`}
            className="inline-flex items-center text-sm text-blue-600 font-medium hover:underline hover:text-blue-800 transition"
          >
            Visit Shop
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ShopCard;








// import React from 'react';
// import { MapPin } from 'lucide-react';
// import Link from 'next/link';
// import { ArrowUpRight } from 'lucide-react';
// import { Image } from 'next/image';

// interface ShopCardProps {
//   shop: {
//     id: string;
//     name: string;
//     description?: string;
//     avatar: string;
//     coverBanner?: string;
//     address?: string;
//     followers?: [];
//     rating?: number;
//     category?: string;
//   };
// }

// const ShopCard: React.FC<ShopCardProps> = ({ shop }) => {
//   return (
//     <div className='w-full rounded-d cursor-pointer bg-white border border-gray-200 shadow-sm overflow-hidden transition'>
//       {/* Shop Cover Banner */}
//       <div className='h-[120px] w-full relative'>
//         <Image
//           src={shop.coverBanner || "/placeholder-cover.jpg"}
//           alt={shop.name}
//           width={500}
//           height={200}
//           className="w-full h-full object-cover"
//         />
//       </div>

//       {/* Shop Avatar */}
//       <div className="relative flex justify-center -mt-8">
//         <div className="w-16 h-16 rounded-full border-4 border-white overflow-hidden shadow bg-white">

//           <Image src={shop.avatar}
//             alt={shop.name}
//             width={64}
//             height={64}
//             className='object-cover'
//           />
//         </div>
//       </div>

//       {/* Shop Information */}
//       <div className="px-4 pb-4 pt-2 text-center">
//         <h3 className="text-base font-semibold text-gray-800">{shop?.name}</ h3>
//         <p className="text-xs text-gray-500 mt-o.5">
//           {shop?.followers?.length ?? 0} Followers
//         </p>
//         {/* Address + Rating */}

//         {/* Address + Rating */}
//         <div className="flex items-center justify-center text-xs text-gray-500 mt-2 gap-4 flex-wrap">
//           {shop.address && (
//             <span className="flex items-center gap-1 max-w-[120px]">
//               <MapPin className="w-4 h-4 shrink-0" />
//               <span className="truncate" >{shop.address}</ span>
//             </ span>
//           )}

//           <span className="flex items-center gap-1">
//             {/* <Star className="w-4 h-4 text-yellow-400" fill-yellow-400 /> */}
//             {shop.rating ?? "N/A"}
//           </span>
//         </div>

//         {/* Category */}
//         {shop?.category
//           && (
//             <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
//               <span className="bg-blue-50 capitalize text-blue-600 px-2 py-0.5 rounded-full font-medium">
//                 {shop.category}
//               </span>
//             </div>
//           )}

//         {/* Visit Button */}
//         <div className="mt-4">
//           <Link
//             href={`/shop/${shop.id}`}
//             className="inline-flex items-center text-sm text-blue-600 font-medium hover:underline hover:text-blue-800 transition">
//             Visit Shop
//             <ArrowUpRight className="w-4 h-4 ml-1" />
//           </Link>
//         </ div>
//       </div>
//     </div >
//   );
// };
// export default ShopCard