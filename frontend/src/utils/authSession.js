// src/utils/authSession.js
//
// Single source of truth for the client-side pieces of session management:
//   - how long a user can be idle before we force-logout them (3h)
//   - what "logging out" actually clears from localStorage
//   - preserving/restoring an in-progress booking across a login redirect
//   - flagging that the user should be re-prompted to pick a city after an
//     inactivity logout
//
// Keeping this in one file means SeatSelection, EventSeatSelection,
// TicketQuantitySelection, BookingReview, Login, OAuthSuccess, Navbar and
// AuthContext all agree on the same storage keys and behaviour.

export const INACTIVITY_LIMIT_MS = 3 * 60 * 60 * 1000; // 3 hours

const LAST_ACTIVITY_KEY = "cvLastActivity";
const PROMPT_CITY_KEY = "cvPromptCity";
const PENDING_BOOKING_KEY = "cvPendingBooking";
const OAUTH_REDIRECT_KEY = "cvOAuthRedirect";
const BOOKING_DRAFT_KEY = "cvBookingDraft";

/* ── Basic auth state readers ─────────────────────────────────────────── */

export function getAccessToken() {
  return localStorage.getItem("accessToken") || "";
}

export function isAuthenticated() {
  return !!getAccessToken();
}

export function getCurrentUser() {
  try {
    const stored = localStorage.getItem("userInfo");
    if (!stored || stored === "undefined") return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/* ── Activity tracking (drives the 3h inactivity auto-logout) ────────── */

export function recordActivity() {
  localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
}

export function getLastActivity() {
  const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
  return raw ? Number(raw) : Date.now();
}

export function isSessionExpiredByInactivity() {
  if (!isAuthenticated()) return false;
  return Date.now() - getLastActivity() > INACTIVITY_LIMIT_MS;
}

/* ── Logout ────────────────────────────────────────────────────────────
 * Clears the local auth state. `reason: "inactivity"` also clears the
 * selected city/district and sets a flag so the app prompts the user to
 * pick their city again the next time it loads, per the session
 * management requirements. A manual logout leaves the city as-is. */
export function clearClientAuthState({ reason = "manual" } = {}) {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("userInfo");
  localStorage.removeItem(LAST_ACTIVITY_KEY);

  if (reason === "inactivity") {
    localStorage.removeItem("selectedCity");
    localStorage.removeItem("selectedCityId");
    localStorage.removeItem("selectedDistrict");
    localStorage.removeItem("selectedDistrictId");
    localStorage.setItem(PROMPT_CITY_KEY, "1");
  }
}

export function consumeCityPromptFlag() {
  const should = localStorage.getItem(PROMPT_CITY_KEY) === "1";
  if (should) localStorage.removeItem(PROMPT_CITY_KEY);
  return should;
}

/* ── Booking-intent preservation ──────────────────────────────────────
 * Used when a signed-out user tries to lock seats / buy tickets. We stash
 * *what they were trying to do* (not yet a live seat lock — locks are only
 * ever taken for authenticated users) so that after login we can jump them
 * straight back to the seat map / ticket picker and auto-resume, instead of
 * making them start over. */
export function savePendingBooking(intent) {
  try {
    sessionStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify({ ...intent, savedAt: Date.now() }));
  } catch {
    /* ignore quota errors */
  }
}

export function getPendingBooking() {
  try {
    const raw = sessionStorage.getItem(PENDING_BOOKING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Discard anything stale (>30 min) — the show/ticket context has likely moved on.
    if (Date.now() - (parsed.savedAt || 0) > 30 * 60 * 1000) {
      sessionStorage.removeItem(PENDING_BOOKING_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingBooking() {
  sessionStorage.removeItem(PENDING_BOOKING_KEY);
}

/* ── Google OAuth redirect target ─────────────────────────────────────
 * Google's redirect flow leaves the SPA entirely, so React Router `state`
 * can't survive it — we stash the intended return path here instead. */
export function saveOAuthRedirect(path) {
  if (path) sessionStorage.setItem(OAUTH_REDIRECT_KEY, path);
}

export function consumeOAuthRedirect() {
  const path = sessionStorage.getItem(OAUTH_REDIRECT_KEY);
  sessionStorage.removeItem(OAUTH_REDIRECT_KEY);
  return path || "/";
}

/* ── Session-expiry redirect target ───────────────────────────────────
 * A forced logout triggered from inside an axios interceptor (refresh
 * token missing/expired) can't use an in-SPA `navigate(..., { state })` —
 * it has to fall back to a hard `window.location.href = "/login"`, which
 * throws away React Router state entirely. Without this, the user always
 * lands back on "/" after signing back in, instead of exactly where their
 * session lapsed. We stash the full path (+ query) here first so Login can
 * pick it back up on the next load, the same way the Google OAuth flow
 * already preserves its own redirect target across a full navigation. */
const SESSION_EXPIRED_REDIRECT_KEY = "cvSessionExpiredRedirect";

export function saveSessionExpiredRedirect(path) {
  try {
    sessionStorage.setItem(SESSION_EXPIRED_REDIRECT_KEY, JSON.stringify({ path, savedAt: Date.now() }));
  } catch {
    /* ignore quota errors */
  }
}

export function consumeSessionExpiredRedirect() {
  try {
    const raw = sessionStorage.getItem(SESSION_EXPIRED_REDIRECT_KEY);
    sessionStorage.removeItem(SESSION_EXPIRED_REDIRECT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Discard anything stale (>30 min) — same window as pending bookings.
    if (Date.now() - (parsed.savedAt || 0) > 30 * 60 * 1000) return null;
    return parsed.path || null;
  } catch {
    return null;
  }
}

/* ── Booking review draft (shared Movies + Events review page) ───────── */

export function saveBookingDraft(draft) {
  try {
    sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* ignore quota errors */
  }
}

export function getBookingDraft() {
  try {
    const raw = sessionStorage.getItem(BOOKING_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearBookingDraft() {
  sessionStorage.removeItem(BOOKING_DRAFT_KEY);
}