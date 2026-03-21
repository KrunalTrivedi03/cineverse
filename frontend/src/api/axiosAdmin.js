import axios from "axios";

const axiosAdmin = axios.create({
  baseURL: "http://localhost:5000/api",
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
