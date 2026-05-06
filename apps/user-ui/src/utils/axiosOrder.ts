import axios from "axios";

const axiosOrder = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_ORDER_API_URL}/api/order`,
  withCredentials: true,
});

export default axiosOrder;
