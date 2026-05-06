"use client"
import Image from "next/image";
import React from "react";
import { MoveRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLayout } from "../../../hooks/useLayout";

const Hero = () => {
  const router = useRouter();
  // Inside header.tsx
  const { layout } = useLayout();

  return (
    <div className="bg-[#115061] h-[85vh] flex flex-col justify-center w-full">
      <div className="md:w-[80%] w-[90%] m-auto md:flex h-full items-center">

        {/* LEFT TEXT SECTION */}
        <div className="md:w-1/2">
          <p className="font-Robot font-normal text-white pb-2 text-xl">
            Starting from $40
          </p>

          <h1 className="text-white text-6xl font-extrabold font-Roboto leading-tight">
            The best watch <br />
            Collection 2025
          </h1>

          <p className="font-Oregano text-3xl pt-4 text-white">
            Exclusive offer <span className="text-yellow-400">10%</span> Off this week
          </p>

          <button
            onClick={() => router.push("/product")}
            className="mt-6 bg-white text-[#115061] w-[140px] gap-2 font-semibold h-[40px] hover:bg-transparent hover:text-white border border-white flex items-center justify-center rounded-md transition"
          >
            Shop Now <MoveRight />
          </button>
        </div>

        {/* RIGHT IMAGE SECTION */}
        <div className="md:w-1/2 flex justify-center mt-6 md:mt-0">
          <Image
            src={"https://img.freepik.com/free-photo/gold-watch-black-background_1205-3380.jpg"}
            alt="Hero Watch"
            width={450}
            height={450}
            className="object-contain"
          />
        </div>

      </div>
    </div>
  );
};

export default Hero;
