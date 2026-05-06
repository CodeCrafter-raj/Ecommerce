import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";

// fetch layout data from API
const fetchLayout = async () => {
  const response = await axiosInstance.get("/api/get-layouts");
  return response.data.layout;
};

export const useLayout = () => {
  const {
    data: layout,
    isPending: isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["layout"],
    queryFn: fetchLayout,
    staleTime: 1000 * 60 * 60,
  });

  // ✅ IMPORTANT: return values explicitly
  return {
    layout,
    isLoading,
    isError,
    refetch,
  };
};












// import axiosInstance from "@/utils/axiosInstance";
// import { UseQueryResult, useQuery } from "@tanstack/react-query";


// //fetch layout data from API
// const fetchLayout = async () => {
//   const response = await axiosInstance.get("/api/get-layouts");
//   return response.data.layout;
// }

// export const useLayout = () => {
//   const {
//     data: layout,
//     isPending: isLoading,
//     isError,
//     refetch,
//   } = useQuery({
//     queryKey: ["layout"],
//     queryFn: fetchLayout,
//     staleTime: 1000 * 60 * 60,
//   })
// };