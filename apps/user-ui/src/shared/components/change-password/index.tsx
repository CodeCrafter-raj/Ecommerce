"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import axiosInstance from "@/utils/axiosInstance";
import { Eye, EyeOff } from "lucide-react";

const ChangePassword = () => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Password strength validation regex
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const onSubmit = async (data: any) => {
    setError("");
    setMessage("");

    // Confirm password check (frontend only)
    if (data.newPassword !== data.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    try {
      await axiosInstance.post("/api/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      setMessage("Password changed successfully.");
      reset();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Something went wrong.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-sm space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 text-center">
        Change Password
      </h2>

      {/* Success message */}
      {message && (
        <p className="text-green-600 text-sm bg-green-50 p-2 rounded">{message}</p>
      )}

      {/* Error message */}
      {error && (
        <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showPassword.current ? "text" : "password"}
              className="w-full border rounded p-2 pr-10"
              {...register("currentPassword", {
                required: "Current password is required.",
              })}
            />

            <button
              type="button"
              className="absolute right-2 top-2"
              onClick={() =>
                setShowPassword((prev) => ({
                  ...prev,
                  current: !prev.current,
                }))
              }
            >
              {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {errors.currentPassword && (
            <p className="text-red-600 text-xs mt-1">
              {String(errors.currentPassword.message)}
            </p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            New Password
          </label>

          <div className="relative">
            <input
              type={showPassword.new ? "text" : "password"}
              className="w-full border rounded p-2 pr-10"
              {...register("newPassword", {
                required: "New password is required.",
                validate: (value) =>
                  strongPasswordRegex.test(value) ||
                  "Password must be at least 8 characters and include uppercase, lowercase, number & special character.",
              })}
            />

            <button
              type="button"
              className="absolute right-2 top-2"
              onClick={() =>
                setShowPassword((prev) => ({ ...prev, new: !prev.new }))
              }
            >
              {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {errors.newPassword && (
            <p className="text-red-600 text-xs mt-1">
              {String(errors.newPassword.message)}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Confirm New Password
          </label>

          <div className="relative">
            <input
              type={showPassword.confirm ? "text" : "password"}
              className="w-full border rounded p-2 pr-10"
              {...register("confirmPassword", {
                required: "Please confirm your password.",
              })}
            />

            <button
              type="button"
              className="absolute right-2 top-2"
              onClick={() =>
                setShowPassword((prev) => ({
                  ...prev,
                  confirm: !prev.confirm,
                }))
              }
            >
              {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {errors.confirmPassword && (
            <p className="text-red-600 text-xs mt-1">
              {String(errors.confirmPassword.message)}
            </p>
          )}
        </div>

        {/* Submit button */}
        <button
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isSubmitting ? "Changing..." : "Change Password"}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
