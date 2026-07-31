import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axiosInstance";
import {
  getAccessToken,
  getCurrentUser,
  recordActivity,
  isSessionExpiredByInactivity,
  clearClientAuthState,
} from "../utils/authSession";

const AuthContext = createContext(null);

// How often we check for inactivity. Doesn't need to be tight — worst case
// the user gets logged out a few seconds later than exactly 3h.
const CHECK_INTERVAL_MS = 30 * 1000;

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser());
  const [token, setToken] = useState(() => getAccessToken());
  const navigate = useNavigate();
  const location = useLocation();
  const throttleRef = useRef(0);

  const isAuthenticated = !!token;

  const performLogout = useCallback(
    async ({ reason = "manual", redirect = true } = {}) => {
      // Best-effort — revoke the refresh token server-side. Never blocks the
      // client-side logout on network failure.
      api.post("/auth/logout").catch(() => {});
      clearClientAuthState({ reason });
      setUser(null);
      setToken("");
      if (redirect) {
        navigate("/login", {
          replace: true,
          state:
            reason === "inactivity"
              ? { sessionExpired: true, from: location.pathname + location.search }
              : undefined,
        });
      }
    },
    [navigate, location],
  );

  // Keep context state in sync if some other part of the app writes
  // localStorage directly (Login.jsx, OAuthSuccess.jsx, Navbar's logout, etc.)
  useEffect(() => {
    const sync = () => {
      setUser(getCurrentUser());
      setToken(getAccessToken());
    };
    window.addEventListener("storage", sync); // cross-tab
    window.addEventListener("cv-auth-changed", sync); // same-tab custom event
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("cv-auth-changed", sync);
    };
  }, []);

  // Record activity (throttled to at most once every 5s) on any user
  // interaction, and periodically check whether 3h have passed since the
  // last recorded activity while a session is active.
  useEffect(() => {
    if (!isAuthenticated) return;

    recordActivity();

    const onActivity = () => {
      const now = Date.now();
      if (now - throttleRef.current < 5000) return;
      throttleRef.current = now;
      recordActivity();
    };
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));

    const interval = setInterval(() => {
      if (isSessionExpiredByInactivity()) {
        performLogout({ reason: "inactivity" });
      }
    }, CHECK_INTERVAL_MS);

    // Also catch the case where the tab was backgrounded/asleep for >3h and
    // just came back — check immediately on visibility change.
    const onVisibility = () => {
      if (document.visibilityState === "visible" && isSessionExpiredByInactivity()) {
        performLogout({ reason: "inactivity" });
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, onActivity));
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isAuthenticated, performLogout]);

  const login = useCallback((accessToken, userInfo) => {
    localStorage.setItem("accessToken", accessToken);
    if (userInfo) localStorage.setItem("userInfo", JSON.stringify(userInfo));
    recordActivity();
    setToken(accessToken);
    setUser(userInfo || getCurrentUser());
    window.dispatchEvent(new Event("cv-auth-changed"));
  }, []);

  const logout = useCallback((opts) => performLogout({ reason: "manual", ...opts }), [performLogout]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}