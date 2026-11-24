import { toast as sonnerToast } from "sonner";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const CONFIG = {
  success: { icon: CheckCircle2, color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
  error:   { icon: XCircle,      color: "#106579", bg: "rgba(16,101,121,0.1)" },
  info:    { icon: Info,         color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
};

function CineToast({ id, type, message }) {
  const { icon: Icon, color, bg } = CONFIG[type];
  return (
    <div
      style={{
        fontFamily: "var(--now-ui-font)",
        display: "flex", alignItems: "center", gap: 12,
        background: "#fff", borderRadius: 14, padding: "14px 16px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.10)", border: "1px solid #f0f0f0",
        minWidth: 300, maxWidth: 380,
      }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={18} color={color} />
      </div>
      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "#1f2937", lineHeight: 1.4, flex: 1 }}>
        {message}
      </p>
      <button
        onClick={() => sonnerToast.dismiss(id)}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", flexShrink: 0, padding: 2 }}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export const showToast = {
  success: (message) =>
    sonnerToast.custom((id) => <CineToast id={id} type="success" message={message} />, { duration: 3500 }),
  error: (message) =>
    sonnerToast.custom((id) => <CineToast id={id} type="error" message={message} />, { duration: 4000 }),
  info: (message) =>
    sonnerToast.custom((id) => <CineToast id={id} type="info" message={message} />, { duration: 3500 }),
};