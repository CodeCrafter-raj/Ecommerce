import { ChevronRight } from "lucide-react";
import Link from "next/link";
import React from "react";

const Breadcrumbs = ({ title }: { title: string }) => {
  return (
    <div className="w-full text-white flex items-center">
      <Link href="/dashboard" className="text-blue-400 cursor-pointer hover:text-blue-500 transition-colors duration-200 ease-in-out hover:underline ">
        Dashboard
      </Link>
      <ChevronRight size={20} className="opacity-[.8]" />
      <span>
        {title}
      </span>
    </div>
  );
};

export default Breadcrumbs;