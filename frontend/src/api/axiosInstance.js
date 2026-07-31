import axios from "axios";
import { clearClientAuthState, saveSessionExpiredRedirect } from "../utils/authSession";

const BASE_URL = import.meta.env.VITE_API_URL + "/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const OPTIONAL_AUTH = [
  "/watchlist/check",
];

const isOptional = (url = "") =>
  OPTIONAL_AUTH.some((u) => url.includes(u));

let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status          = error.response?.status;
    const url             = originalRequest?.url || "";

    if (status !== 401) return Promise.reject(error);

    if (isOptional(url)) {
      return Promise.reject(error);
    }

    if (!localStorage.getItem("accessToken")) {
      return Promise.reject(error);
    }

    if (!originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newToken = data.accessToken;
        localStorage.setItem("accessToken", newToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh token missing/expired/revoked (e.g. 7 days idle, or backend
        // rejected it) — treat this the same as an inactivity logout so the
        // user is prompted to pick their city again on next login.
        clearClientAuthState({ reason: "inactivity" });
        window.dispatchEvent(new Event("cv-auth-changed"));
        saveSessionExpiredRedirect(window.location.pathname + window.location.search);
        window.location.href = "/login?sessionExpired=1";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;