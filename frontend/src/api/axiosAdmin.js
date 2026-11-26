import axios from "axios";

const options = { baseURL: import.meta.env.VITE_API_URL + "/api", withCredentials: true };
const axiosAdmin = axios.create(options);
const sessionApi = axios.create(options);
export const ADMIN_IDLE_MS = 10 * 60 * 1000;
export const ADMIN_ACTIVITY_KEY = "adminLastActivity";
export const ADMIN_SESSION_KEY = "adminSessionKey";

let pendingRefresh;

export function clearAdminSession() {
  for (const key of ["adminAccessToken", "adminInfo", ADMIN_ACTIVITY_KEY, ADMIN_SESSION_KEY]) {
    localStorage.removeItem(key);
  }
}

export function revokeAdminSession(token) {
  return sessionApi.post("/admin/auth/logout", {}, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
}

export function expireAdminSession() {
  clearAdminSession();
  window.dispatchEvent(new Event("admin-session-expired"));
}

export function refreshAdminSession(activity = false) {
  const session = localStorage.getItem(ADMIN_SESSION_KEY);
  if (pendingRefresh?.session === session) return pendingRefresh.request;
  const token = localStorage.getItem("adminAccessToken");
  const renewal = activity
    ? sessionApi.post("/admin/auth/activity", {}, { headers: { Authorization: `Bearer ${token}` } })
      .catch((error) => {
        if (error.response?.data?.code !== "ACCESS_TOKEN_EXPIRED") throw error;
        if (session !== localStorage.getItem(ADMIN_SESSION_KEY)) throw error;
        return sessionApi.post("/admin/auth/refresh-token");
      })
    : sessionApi.post("/admin/auth/refresh-token");
  const request = renewal
    .then(({ data }) => {
      if (session !== localStorage.getItem(ADMIN_SESSION_KEY) || !localStorage.getItem("adminAccessToken")) {
        throw new axios.CanceledError("Admin session changed");
      }
      localStorage.setItem("adminAccessToken", data.accessToken);
      return data.accessToken;
    })
    .catch((error) => {
      if (error.response?.status === 401 && session === localStorage.getItem(ADMIN_SESSION_KEY)) {
        expireAdminSession();
      }
      throw error;
    })
    .finally(() => {
      if (pendingRefresh?.request === request) pendingRefresh = undefined;
    });
  pendingRefresh = { session, request };
  return request;
}

axiosAdmin.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminAccessToken");
  const session = localStorage.getItem(ADMIN_SESSION_KEY);
  if (config.adminRetried && config.adminSession !== session) throw new axios.CanceledError("Admin session changed");
  if (token) {
    config.adminSession = session;
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosAdmin.interceptors.response.use(undefined, async (error) => {
  const { config, response } = error;
  const token = localStorage.getItem("adminAccessToken");
  if (response?.status !== 401 || !token || config.adminSession !== localStorage.getItem(ADMIN_SESSION_KEY)) throw error;

  if (response.data?.code === "ADMIN_SESSION_EXPIRED") expireAdminSession();
  if (response.data?.code !== "ACCESS_TOKEN_EXPIRED" || config.adminRetried) throw error;

  const lastActivity = Number(localStorage.getItem(ADMIN_ACTIVITY_KEY));
  if (!lastActivity || Date.now() - lastActivity >= ADMIN_IDLE_MS) {
    expireAdminSession();
    throw error;
  }

  if (config.headers.Authorization === `Bearer ${token}`) await refreshAdminSession();
  if (config.adminSession !== localStorage.getItem(ADMIN_SESSION_KEY)) throw error;

  // Auth rejects this request before its route handler runs, so a save can be retried safely.
  config.adminRetried = true;
  return axiosAdmin.request(config);
});

export default axiosAdmin;
