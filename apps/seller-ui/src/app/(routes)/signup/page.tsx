'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import countries from 'apps/seller-ui/src/utils/countries';
import CreateShop from 'apps/seller-ui/src/shared/modules/auth/create-shop';

interface SellerRegistrationData {
  name: string;
  email: string;
  password: string;
  phone_number: string;
  country: string;
  sellerId?: string;
}


const Signup = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [passwordVisible, setPasswordVisible] = useState(false);
  // const [serveError, setServerError] = useState<string | null>(null);
  const [showOtp, setShowOtp] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [timer, setTimer] = useState(60);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [sellerData, setSellerData] = useState<SellerRegistrationData | null>(null);

  // const [sellerData, setSellerData] = useState<{ sellerId?: string } | null>(null);
  // const [sellerData, setSellerData] = useState<FormData | null>(null);
  const [sellerId, setSellerId] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const startResendTimer = () => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setCanResend(true);
          return 0
        }

        return prev - 1
      });
    }, 1000);
  };
  console.log("API URL:", process.env.NEXT_PUBLIC_SERVER_URI);
  //console.log("PARENT SELLER ID:", sellerId);


  const signupMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URI}/api/seller-registration`, data);
      return response.data
    },

    onSuccess: (_, formData) => {
      setSellerData({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone_number,
        country: formData.country,
      });

      setShowOtp(true);
      setActiveStep(1); // Move to OTP screen
    },

    // onSuccess: (_, formData) => {
    //   setSellerData(formData);
    //   setShowOtp(true);
    //   setCanResend(false);
    //   setTimer(60);
    //   startResendTimer();
    // }
  });

  const VerifyOtpMutation = useMutation({
  mutationFn: async () => {
    if (!sellerData) return;

    const payload = {
      name: sellerData.name,
      email: sellerData.email,
      password: sellerData.password,
      phone_number: sellerData.phone_number,
      country: sellerData.country,
      otp: otp.join(""),
    };

    console.log("OTP VERIFY PAYLOAD:", payload);

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_SERVER_URI}/api/verify-seller`,
      payload
    );

    return response.data;
  },

  onSuccess: (response) => {
    console.log("OTP VERIFIED:", response);

    setSellerData(prev => ({
      ...prev!,
      sellerId: response.sellerId,
    }));

    setActiveStep(2); // Move to CreateShop
  },
});



  //   const VerifyOtpMutation = useMutation({
  //     mutationFn: async () => {
  //       if (!sellerData) return;

  //       const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URI}/api/verify-seller`,
  //         {
  //           ...sellerData,
  //           otp: otp.join(""),
  //         }
  //       );
  //       return response.data
  //     },
  //     onSuccess: (response) => {
  //     console.log("OTP VERIFIED:", response);
  //     setSellerData({ sellerId: response.sellerId });
  //     setActiveStep(2); // Step before CreateShop
  // }

  //     // onSuccess: (data) => {
  //     //   setSellerId(data?.select?.id);
  //     //   setActiveStep(2)
  //     // },
  //   });


  const onSubmit = (data: any) => {
    //console.log(data)
    signupMutation.mutate(data);

  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp]
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const resendOtp = () => {
    if (sellerData) {
      signupMutation.mutate(sellerData);
    }
  }

  const connectStripe = async () => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URI}/api/create-stripe-link`,
        { sellerId }
      );

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.log("Stripe Connection Error:", error);
    }

  }

  return (
    <div className='w-full flex flex-col items-center pt-10 min-h-screen'>
      {/* Stepper Container */}
      <div className='relative flex items-start justify-center md:w-[50%] mb-12'>

        {/* Step Circles and Labels */}
        <div className='relative flex justify-between w-full max-w-lg'>
          {/* Progress Line */}
          <div
            className='absolute top-5 left-0 h-1 bg-gray-300 w-full'
          >
            {/* Active Progress Line (using dynamic width for effect, assuming 3 steps) */}
            <div
              className={`h-full bg-blue-600 transition-all duration-500`}
              style={{ width: `${((activeStep - 1) / 2) * 100}%` }}
            ></div>
          </div>

          {/* Steps */}
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className='flex flex-col items-center relative z-10' // Position step content over the line
            >
              {/* Step Circle */}
              <div className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-bold transition-colors duration-300 ${step <= activeStep ? 'bg-blue-600' : 'bg-gray-300'}`}>
                {step}
              </div>
              {/* Step Label */}
              <span className={`mt-2 text-sm text-center w-24 ${step <= activeStep ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                {step === 1 ? "Create Account" : step === 2 ? "Set Up Shop" : "Connect Bank"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className='md:w-[480px] p-8 bg-white shadow rounded-lg'>
        {activeStep === 1 && (
          <>

            {!showOtp ? (
              <form onSubmit={handleSubmit(onSubmit)}>
                <h3 className='text-2xl font-semibold text-center mb-4'>Create Account</h3>

                <label className='block text-gray-700 mb-1'>Name</label>
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

                <label className='block text-gray-700 mb-1'>Email</label>
                <input type='email'
                  placeholder='myshop@gmail.com'
                  className='w-full p-2 border border-gray-300 outline-0 rounded mb-1'
                  {...register("email", {
                    required: "email is required",
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: "Invalid email address"
                    }
                  })}
                />
                {errors.email && (
                  <p className='text-red-600 text-sm'>
                    {String(errors.email.message)}
                  </p>
                )}

                <label className='block text-gray-700 mb-1'>Phone Number</label>
                <input type='tel'
                  placeholder='e.g., +1234567890'
                  className='w-full p-2 border border-gray-300 outline-0 rounded mb-1'
                  {...register("phone_number", {
                    required: "Phone number is required",
                    pattern: {
                      // Allows optional leading '+' and requires 10 to 15 digits
                      value: /^\+?\d{10,15}$/,
                      message: "Invalid phone number (must be 10-15 digits)"
                    },
                    minLength: {
                      value: 10,
                      message: "Phone Number cannot be less then 10 digits"
                    },
                    maxLength: {
                      value: 15,
                      message: "Phone Number cannot exceed 15 digits"
                    }
                  })}
                />
                {errors.phone_number && (
                  <p className='text-red-600 text-sm'>
                    {String(errors.phone_number.message)}
                  </p>
                )}


                <label className='block text-gray-700 mb-1'>Country</label>
                <select
                  className='w-full p-2 border border-gray-300 outline-0 rounded mb-1 bg-white'
                  {...register("country", {
                    required: "Country is required",
                  })}
                >
                  {/* Default placeholder option */}
                  <option value="" disabled>Select your country</option>

                  {/* Map over the imported countries array */}
                  {countries?.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <p className='text-red-600 text-sm'>
                    {String(errors.country.message)}
                  </p>
                )}


                <label className='block text-gray-700 mb-1'>Password</label> {/* Corrected typo: Paasword -> Password */}
                <div className='relative'>
                  <input type={passwordVisible ? "text" : "password"}
                    placeholder='Min 6 Characters'
                    className='w-full p-2 border border-gray-300 outline-0 rounded mb-1'
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters"
                      },
                    })}
                  />

                  <button type='button' onClick={() => setPasswordVisible(!passwordVisible)}
                    className='absolute inset-y-0 right-3 flex items-center text-gray-400'>
                    {passwordVisible ? <Eye /> : <EyeOff />}
                  </button>
                  {errors.password && (
                    <p className='text-red-600 text-sm mt-2'> {/* Added mt-2 for spacing */}
                      {String(errors.password.message)}
                    </p>
                  )}
                </div>
                <button type="submit"
                  disabled={signupMutation.isPending}
                  className='w-full text-lg cursor-pointer mt-4 bg-black text-white py-2 rounded-lg transition duration-200 disabled:opacity-50'>
                  {signupMutation.isPending ? " Signing up..." : "Signup"}
                </button>
                {signupMutation.isError && signupMutation.error instanceof AxiosError && (
                  <p className='text-red-500 text-sm mt-2'>
                    {signupMutation.error.response?.data?.message || signupMutation.error.message}
                  </p>
                )}
                <p className='pt-3 text-center'>
                  Already Have an Account?{" "}
                  <Link href={"/login"} className='text-blue-600'>
                    Login
                  </Link>
                </p>
              </form>
            ) : (
              <div>
                <h3 className='text-xl font-semibold text-center mb-4'> Enter OTP</h3>
                <div className='flex justify-center gap-4'> {/* Reduced gap for better mobile fit */}
                  {otp?.map((digit, index) => (
                    <input
                      key={index}
                      type='text'
                      ref={(el) => {
                        if (el) inputRefs.current[index] = el;
                      }}
                      maxLength={1}
                      className="w-10 h-10 text-center border border-gray-300 outline-none rounded-md text-xl font-mono focus:border-blue-500" // Improved styling
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    />
                  ))}
                </div>
                <button className='w-full mt-6 text-lg cursor-pointer bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition duration-200 disabled:opacity-50'
                  disabled={VerifyOtpMutation.isPending}
                  onClick={() => VerifyOtpMutation.mutate()}
                >
                  {VerifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}
                </button>
                <p className='text-center text-sm mt-4'>
                  {canResend ? (
                    <button
                      onClick={resendOtp}
                      className='text-blue-600 hover:text-blue-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                      disabled={VerifyOtpMutation.isPending} // Disable resend while verifying
                    >
                      Resend OTP
                    </button>
                  ) : (
                    `Resend OTP in ${timer}s`
                  )}
                </p>
                {
                  VerifyOtpMutation?.isError && VerifyOtpMutation.error instanceof AxiosError &&
                  (
                    <p className='text-red-500 text-sm mt-2 text-center'>
                      {VerifyOtpMutation.error.response?.data?.message || VerifyOtpMutation.error.message}
                    </p>
                  )
                }

              </div>
            )}

          </>
        )}
        {/* Add content for activeStep 2 and 3 here */}
        {activeStep === 2 && <CreateShop sellerId={sellerData?.sellerId} setActiveStep={setActiveStep} />}




        {activeStep === 3 && (
          <div className='text-center'>
            <h3 className='text-2xl font-semibold'>Withdrwa Method</h3>
            <br />
            <button className='w-full m-auto flex items-center justify-center gap-3 text-lg bg-[#334155] text-white py-2 rounded-lg' onClick={connectStripe}>Connect Stripe</button>
          </div>
        )}

      </div>
    </div>

  );
};

export default Signup;
