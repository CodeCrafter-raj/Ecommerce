"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";


type FormData = {
  email: string,
  password: string
}

const Page = () => {

  const { register, handleSubmit } = useForm<FormData>();
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/login-admin`, data, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setServerError(null);
      router.push("/dashboard");
    },
    onError: (error: AxiosError) => {
      const errorMessage = (error.response?.data as { message?: string })?.message || "Invalid credentials";
      setServerError(errorMessage);
    },
  });

  const onSubmit = (data: FormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="md:w-[450px] pb-8 bg-slate-800 rounded-md shadow-lg">
        <form className="p-5" onSubmit={handleSubmit(onSubmit)}>
          <h1 className="text-2xl pb-3 pt-4 font-semibold text-center text-white font-poppins">Welcome Admin</h1>
          <div className="flex flex-col gap-4">
            <input type="email" placeholder="Email" className="p-2 border border-slate-600 rounded-md" {...register("email")} />
            <input type="password" placeholder="Password" className="p-2 border border-slate-600 rounded-md" {...register("password")} />
            <button type="submit" disabled={loginMutation.isPending} className="p-2 bg-slate-600 rounded-md text-white font-semibold cursor-pointer bg-blue-500 text-white hover:bg-blue-600 rounded-lg">{loginMutation.isPending ? "Logging in..." : "Login"}</button>
            {serverError && <p className="text-red-500">{serverError}</p>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Page;