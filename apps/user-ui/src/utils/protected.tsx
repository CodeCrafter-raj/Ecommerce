import { CustomAxiosRequestConfig } from "./axiosInstance.type";

export const isProtected = (config: CustomAxiosRequestConfig) => {
  config.requireAuth = true;
  return config;
};