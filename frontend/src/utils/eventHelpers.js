export const IMG = (path) => !path ? null : path.startsWith("http") ? path : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`;

export const fmt12 = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${(h % 12 || 12).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
};

export const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};

export const fmtDateLong = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
};

export const fmtCountdown = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export const localDateKey = (d) => {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

export const getSocketUserId = () => {
  let uid = localStorage.getItem("cvUserId");
  if (!uid) {
    uid = `u_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("cvUserId", uid);
  }
  return uid;
};

export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("userInfo") || "null");
  } catch {
    return null;
  }
};

export const EVENT_CATEGORIES = [
  "Music", "Nightlife", "Comedy Shows", "Expos", "Performances", "Workshops",
];

export const SEAT_CAT = {
  VIP:     { color: "#7c3aed", light: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.25)", pillText: "#5b21b6" },
  Premium: { color: "#f0545c", light: "rgba(240,84,92,0.07)",  border: "rgba(240,84,92,0.22)",  pillText: "#be123c" },
  General: { color: "#059669", light: "rgba(5,150,105,0.07)",  border: "rgba(5,150,105,0.22)",  pillText: "#065f46" },
};

export const OUTFIT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');";