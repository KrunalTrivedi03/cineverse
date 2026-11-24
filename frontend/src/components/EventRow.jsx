// src/components/events/EventRow.jsx
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EventCard from "./EventCard";

export default function EventRow({ title, events, seeAllPath, emptyText }) {
  const navigate = useNavigate();
  if (!events?.length) {
    return emptyText ? (
      <div style={{ padding: "8px 0" }}>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>{emptyText}</p>
      </div>
    ) : null;
  }

  return (
    <section style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#111", letterSpacing: "-.3px" }}>{title}</h2>
        {seeAllPath && (
          <button
            onClick={() => navigate(seeAllPath)}
            style={{
              display: "flex", alignItems: "center", gap: 2, border: "none", background: "none",
              cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#106579",
            }}
          >
            See all <ChevronRight size={14} />
          </button>
        )}
      </div>
      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "none" }}>
        {events.map((ev) => <EventCard key={ev._id} event={ev} />)}
      </div>
    </section>
  );
}