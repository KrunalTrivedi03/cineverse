import axios from "axios";

const axiosAdmin = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  withCredentials: true,
});

axiosAdmin.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminAccessToken");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export default axiosAdmin;
