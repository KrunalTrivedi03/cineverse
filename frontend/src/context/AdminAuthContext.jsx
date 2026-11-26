import { createContext, useEffect, useState } from "react";
import { matchPath, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ADMIN_ACTIVITY_KEY, ADMIN_IDLE_MS, ADMIN_SESSION_KEY, clearAdminSession,
  expireAdminSession, refreshAdminSession, revokeAdminSession,
} from "../api/axiosAdmin";

export const AdminAuthContext = createContext();
const HEARTBEAT_MS = 30_000;
const activityEvents = ["pointerdown", "pointermove", "keydown", "input", "wheel"];

function readAdmin() {
  try { return JSON.parse(localStorage.getItem("adminInfo")); }
  catch { return null; }
}

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(readAdmin);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onAdminPage = Boolean(matchPath("/admin/*", pathname)) && !matchPath("/admin/login", pathname);

  function login(data) {
    localStorage.setItem(ADMIN_SESSION_KEY, Date.now() + "-" + Math.random());
    localStorage.setItem(ADMIN_ACTIVITY_KEY, String(Date.now()));
    localStorage.setItem("adminInfo", JSON.stringify(data));
    setAdmin(data);
  }

  function logout() {
    const token = localStorage.getItem("adminAccessToken");
    clearAdminSession();
    setAdmin(null);
    revokeAdminSession(token).catch(() => {});
  }

  useEffect(() => {
    function onExpired() {
      setAdmin(null);
      if (onAdminPage) {
        toast.info("Your admin session ended. Sign in again to continue.");
        navigate("/admin/login", { replace: true });
      }
    }

    function onStorage(event) {
      if (event.key !== "adminInfo") return;
      const next = readAdmin();
      if (!next && admin) onExpired();
      else setAdmin(next);
    }

    window.addEventListener("admin-session-expired", onExpired);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("admin-session-expired", onExpired);
      window.removeEventListener("storage", onStorage);
    };
  }, [admin, navigate, onAdminPage]);

  useEffect(() => {
    if (!admin) return;
    let lastSync = 0;
    let sentActivity = 0;
    // Existing sessions issued before idle tracking require one fresh sign-in.
    function checkIdle() {
      const last = Number(localStorage.getItem(ADMIN_ACTIVITY_KEY));
      if (!last || Date.now() - last >= ADMIN_IDLE_MS) {
        expireAdminSession();
        return 0;
      }
      return last;
    }

    function syncActivity(last) {
      const now = Date.now();
      if (last <= sentActivity || now - lastSync < HEARTBEAT_MS) return;
      lastSync = now;
      refreshAdminSession(true).then(() => { sentActivity = last; }).catch(() => {});
    }

    function onActivity() {
      if (document.visibilityState !== "visible") return;
      const last = checkIdle();
      if (!last) return;
      const now = Date.now();
      const activity = now - last >= 1000 ? now : last;
      if (activity !== last) localStorage.setItem(ADMIN_ACTIVITY_KEY, String(activity));
      syncActivity(activity);
    }

    function tick() {
      const last = checkIdle();
      if (last && onAdminPage && document.visibilityState === "visible" && last > sentActivity && Date.now() - last < HEARTBEAT_MS) {
        syncActivity(last);
      }
    }

    tick();
    const timer = window.setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    if (onAdminPage) {
      for (const event of activityEvents) window.addEventListener(event, onActivity, { passive: true });
    }
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
      for (const event of activityEvents) window.removeEventListener(event, onActivity);
    };
  }, [admin, onAdminPage]);

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
