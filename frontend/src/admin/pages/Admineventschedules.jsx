import Dialog from "../../components/Dialog";
import { useState, useEffect, Fragment } from "react";
import axiosAdmin from "../../api/axiosAdmin";
import AdminLayout from "../layout/AdminLayout";
import {
  Search, Trash2, PartyPopper, Plus, SlidersHorizontal,
  Loader2, CheckCircle2, AlertCircle, X, MapPin, Armchair,
  Building2, Clock, CalendarDays, IndianRupee, Users2,
  Edit, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Ticket,
} from "lucide-react";

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmt12 = (t) => {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h % 12) || 12).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
};

const isPast = (d) => d && new Date(d) < new Date();

const emptyTicketType = () => ({ name: "", price: "", totalQuantity: "" });
const emptySlot = (bookingType) =>
  bookingType === "seated"
    ? { time: "", endTime: "", price: "" }
    : { time: "", endTime: "", ticketTypes: [emptyTicketType()] };

/* ─────────────────────────────────────────
   Toast
───────────────────────────────────────── */
function Toast({ toast, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-[13px] font-medium"
      style={{
        background: toast.type === "success" ? "#f0fdf4" : "#fff1f2",
        color:      toast.type === "success" ? "#16a34a" : "#dc2626",
        border:    `1px solid ${toast.type === "success" ? "#bbf7d0" : "#fecdd3"}`,
        fontFamily: "var(--now-ui-font)",
      }}>
      {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {toast.message}
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

/* ─────────────────────────────────────────
   Confirm Modal
───────────────────────────────────────── */
function ConfirmModal({ title, description, onConfirm, onCancel, busy = false }) {
  return (
    <Dialog variant="form" label={title} maxWidth={340} onDismiss={() => { if (!busy) onCancel(); }} dismissOnBackdrop={false}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-[340px]" style={{ fontFamily: "var(--now-ui-font)" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ background: "#fff1f2" }}>
          <Trash2 size={18} style={{ color: "#106579" }} />
        </div>
        <h3 className="text-[15px] font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-[13px] text-gray-500 mb-5">{description}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={busy} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50">Cancel</button>
          <button onClick={onConfirm} disabled={busy}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#106579" }}
            onMouseEnter={(e) => { if (!busy) e.currentTarget.style.background = "#e04048"; }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#106579")}>
            {busy && <Loader2 size={13} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </Dialog>
  );
}

/* ─────────────────────────────────────────
   Schedule Form Modal — Add / Edit
   One doc = event + venue + date + showTimes[]
───────────────────────────────────────── */
function ScheduleFormModal({ mode = "add", initial = null, events, venues, onSave, onCancel, saving }) {
  const [form, setForm] = useState(
    mode === "edit" && initial
      ? {
          event:     initial.event?._id || "",
          venue:     initial.venue?._id || "",
          eventDate: initial.eventDate ? initial.eventDate.slice(0, 10) : "",
        }
      : { event: "", venue: "", eventDate: "" }
  );

  const selectedEvent = events.find((e) => e._id === form.event);
  const bookingType   = selectedEvent?.bookingType || "general";

  const [slots, setSlots] = useState(
    mode === "edit" && initial?.showTimes?.length
      ? initial.showTimes.map((t) => (
          bookingType === "seated"
            ? { time: t.time || "", endTime: t.endTime || "", price: t.price != null ? String(t.price) : "" }
            : {
                time: t.time || "", endTime: t.endTime || "",
                ticketTypes: (t.ticketTypes?.length ? t.ticketTypes : [emptyTicketType()]).map((tt) => ({
                  name: tt.name || "",
                  price: tt.price != null ? String(tt.price) : "",
                  totalQuantity: tt.totalQuantity != null ? String(tt.totalQuantity) : "",
                })),
              }
        ))
      : [emptySlot(bookingType)]
  );

  const [errors, setErrors] = useState({});

  const set = (field, val) => {
    setForm((p) => ({ ...p, [field]: val }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  /* Re-shape slots when the selected event's booking type changes */
  const setEvent = (val) => {
    const ev = events.find((e) => e._id === val);
    const newType = ev?.bookingType || "general";
    set("event", val);
    setSlots((prev) => prev.map((s) => (
      newType === "seated"
        ? { time: s.time, endTime: s.endTime, price: s.price ?? "" }
        : { time: s.time, endTime: s.endTime, ticketTypes: s.ticketTypes?.length ? s.ticketTypes : [emptyTicketType()] }
    )));
  };

  const addSlot    = () => setSlots((p) => [...p, emptySlot(bookingType)]);
  const removeSlot = (i) => setSlots((p) => p.filter((_, idx) => idx !== i));
  const updateSlot = (i, field, val) =>
    setSlots((p) => p.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)));

  const addTicketType    = (si) => setSlots((p) => p.map((s, idx) => idx === si ? { ...s, ticketTypes: [...s.ticketTypes, emptyTicketType()] } : s));
  const removeTicketType = (si, ti) => setSlots((p) => p.map((s, idx) => idx === si ? { ...s, ticketTypes: s.ticketTypes.filter((_, tidx) => tidx !== ti) } : s));
  const updateTicketType = (si, ti, field, val) =>
    setSlots((p) => p.map((s, idx) => idx === si
      ? { ...s, ticketTypes: s.ticketTypes.map((tt, tidx) => tidx === ti ? { ...tt, [field]: val } : tt) }
      : s));

  const validate = () => {
    const e = {};
    if (!form.event)      e.event     = "Select an event";
    if (!form.venue)      e.venue     = "Select a venue";
    if (!form.eventDate)  e.eventDate = "Select a date";

    slots.forEach((s, i) => {
      if (!s.time) e[`st${i}`] = "Required";
      if (bookingType === "seated") {
        if (!s.price || isNaN(s.price) || +s.price < 0) e[`sp${i}`] = "Required";
      } else {
        if (!s.ticketTypes?.length) e[`stt${i}`] = "Add at least one ticket type";
        s.ticketTypes?.forEach((tt, ti) => {
          if (!tt.name.trim())                                            e[`ttn${i}_${ti}`] = "Required";
          if (!tt.price || isNaN(tt.price) || +tt.price < 0)              e[`ttp${i}_${ti}`] = "Required";
          if (!tt.totalQuantity || isNaN(tt.totalQuantity) || +tt.totalQuantity < 1) e[`ttq${i}_${ti}`] = "Required";
        });
      }
    });
    if (slots.length === 0) e.slots = "Add at least one show time";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const showTimes = slots.map((s) => (
      bookingType === "seated"
        ? { time: s.time, endTime: s.endTime || undefined, price: Number(s.price) }
        : {
            time: s.time, endTime: s.endTime || undefined,
            ticketTypes: s.ticketTypes.map((tt) => ({
              name: tt.name, price: Number(tt.price), totalQuantity: Number(tt.totalQuantity),
            })),
          }
    ));
    onSave({ event: form.event, venue: form.venue, eventDate: form.eventDate, showTimes });
  };

  return (
    <Dialog variant="form" label={(mode === "edit" ? "Edit " : "Add ") + "event schedule"} maxWidth={620} onDismiss={() => { if (!saving) onCancel(); }} dismissOnBackdrop={false}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[620px] max-h-[92vh] flex flex-col" style={{ fontFamily: "var(--now-ui-font)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,101,121,0.08)" }}>
              {mode === "edit" ? <Edit size={18} style={{ color: "#106579" }} /> : <PartyPopper size={18} style={{ color: "#106579" }} />}
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">{mode === "edit" ? "Edit Schedule" : "Add New Schedule"}</h3>
              <p className="text-[12px] text-gray-400">One entry per event · venue · date</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-all">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">

          {/* Event */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Event <span style={{ color: "#106579" }}>*</span>
            </label>
            <div className="relative">
              <PartyPopper size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              <ChevronDown size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              <select value={form.event} onChange={(e) => setEvent(e.target.value)}
                className={`w-full pl-9 pr-9 py-2.5 rounded-xl border text-[13px] outline-none appearance-none cursor-pointer transition-all ${errors.event ? "border-red-400" : "border-gray-200"} ${form.event ? "text-gray-800" : "text-gray-400"}`}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#106579")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = errors.event ? "#f87171" : "#e4e4e7")}>
                <option value="">Select an event…</option>
                {events.map((ev) => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
              </select>
            </div>
            {errors.event && <p className="text-[11px] text-red-500 mt-1">{errors.event}</p>}
            {selectedEvent && (
              <p className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1.5">
                {bookingType === "seated" ? <Armchair size={11} /> : <Users2 size={11} />}
                This event uses <strong className="text-gray-500">{bookingType === "seated" ? "seated" : "general admission"}</strong> ticketing
              </p>
            )}
          </div>

          {/* Venue */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Venue <span style={{ color: "#106579" }}>*</span>
            </label>
            <div className="relative">
              <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              <ChevronDown size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              <select value={form.venue} onChange={(e) => set("venue", e.target.value)}
                className={`w-full pl-9 pr-9 py-2.5 rounded-xl border text-[13px] outline-none appearance-none cursor-pointer transition-all ${errors.venue ? "border-red-400" : "border-gray-200"} ${form.venue ? "text-gray-800" : "text-gray-400"}`}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#106579")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = errors.venue ? "#f87171" : "#e4e4e7")}>
                <option value="">Select a venue…</option>
                {venues.map((v) => (
                  <option key={v._id} value={v._id}>{v.name}{v.city?.name ? ` — ${v.city.name}` : ""}</option>
                ))}
              </select>
            </div>
            {errors.venue && <p className="text-[11px] text-red-500 mt-1">{errors.venue}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Event Date <span style={{ color: "#106579" }}>*</span>
            </label>
            <div className="relative">
              <CalendarDays size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              <input type="date" value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-[13px] text-gray-800 outline-none transition-all ${errors.eventDate ? "border-red-400" : "border-gray-200"}`}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#106579")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = errors.eventDate ? "#f87171" : "#e4e4e7")}
              />
            </div>
            {errors.eventDate && <p className="text-[11px] text-red-500 mt-1">{errors.eventDate}</p>}
          </div>

          {/* ── Show Times ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                Show Times <span style={{ color: "#106579" }}>*</span>
              </label>
              <button onClick={addSlot}
                className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                style={{ color: "#106579", background: "rgba(16,101,121,0.08)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(16,101,121,0.14)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(16,101,121,0.08)")}>
                <Plus size={12} /> Add Time
              </button>
            </div>

            {errors.slots && <p className="text-[11px] text-red-500 mb-2">{errors.slots}</p>}

            <div className="flex flex-col gap-3">
              {slots.map((slot, i) => (
                <div key={i} className="p-3 rounded-xl border border-gray-100 bg-gray-50 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white" style={{ background: "#106579" }}>
                      {i + 1}
                    </div>

                    {/* Start time */}
                    <div className="flex-1">
                      <div className="relative">
                        <Clock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                        <input type="time" value={slot.time}
                          onChange={(e) => updateSlot(i, "time", e.target.value)}
                          className={`w-full pl-8 pr-3 py-2 rounded-lg border text-[12.5px] text-gray-800 outline-none bg-white transition-all ${errors[`st${i}`] ? "border-red-400" : "border-gray-200"}`}
                          onFocus={(e) => (e.currentTarget.style.borderColor = "#106579")}
                          onBlur={(e)  => (e.currentTarget.style.borderColor = errors[`st${i}`] ? "#f87171" : "#e4e4e7")}
                        />
                      </div>
                      {errors[`st${i}`] && <p className="text-[10px] text-red-500 mt-0.5">{errors[`st${i}`]}</p>}
                    </div>

                    {/* End time (optional) */}
                    <div className="flex-1">
                      <div className="relative">
                        <Clock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                        <input type="time" value={slot.endTime} placeholder="End (optional)"
                          onChange={(e) => updateSlot(i, "endTime", e.target.value)}
                          className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-[12.5px] text-gray-800 outline-none bg-white transition-all"
                          onFocus={(e) => (e.currentTarget.style.borderColor = "#106579")}
                          onBlur={(e)  => (e.currentTarget.style.borderColor = "#e4e4e7")}
                        />
                      </div>
                    </div>

                    {/* Seated: single price */}
                    {bookingType === "seated" && (
                      <div className="w-28">
                        <div className="relative">
                          <IndianRupee size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                          <input type="number" min="0" placeholder="Base price"
                            value={slot.price}
                            onChange={(e) => updateSlot(i, "price", e.target.value)}
                            className={`w-full pl-7 pr-3 py-2 rounded-lg border text-[12.5px] text-gray-800 placeholder-gray-300 outline-none bg-white transition-all ${errors[`sp${i}`] ? "border-red-400" : "border-gray-200"}`}
                            onFocus={(e) => (e.currentTarget.style.borderColor = "#106579")}
                            onBlur={(e)  => (e.currentTarget.style.borderColor = errors[`sp${i}`] ? "#f87171" : "#e4e4e7")}
                          />
                        </div>
                        {errors[`sp${i}`] && <p className="text-[10px] text-red-500 mt-0.5">{errors[`sp${i}`]}</p>}
                      </div>
                    )}

                    {slots.length > 1 && (
                      <button onClick={() => removeSlot(i)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ background: "#fff1f2" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#fff1f2")}>
                        <X size={12} style={{ color: "#106579" }} />
                      </button>
                    )}
                  </div>

                  {/* General admission: ticket types */}
                  {bookingType !== "seated" && (
                    <div className="pl-8 space-y-2">
                      {errors[`stt${i}`] && <p className="text-[10px] text-red-500">{errors[`stt${i}`]}</p>}
                      {slot.ticketTypes.map((tt, ti) => (
                        <div key={ti} className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Ticket size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                            <input placeholder="Type (e.g. General, VIP)" value={tt.name}
                              onChange={(e) => updateTicketType(i, ti, "name", e.target.value)}
                              className={`w-full pl-7 pr-2 py-1.5 rounded-lg border text-[12px] text-gray-800 placeholder-gray-300 outline-none bg-white transition-all ${errors[`ttn${i}_${ti}`] ? "border-red-400" : "border-gray-200"}`}
                            />
                          </div>
                          <div className="relative w-24">
                            <IndianRupee size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                            <input type="number" min="0" placeholder="Price" value={tt.price}
                              onChange={(e) => updateTicketType(i, ti, "price", e.target.value)}
                              className={`w-full pl-6 pr-2 py-1.5 rounded-lg border text-[12px] text-gray-800 placeholder-gray-300 outline-none bg-white transition-all ${errors[`ttp${i}_${ti}`] ? "border-red-400" : "border-gray-200"}`}
                            />
                          </div>
                          <div className="relative w-24">
                            <Users2 size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                            <input type="number" min="1" placeholder="Qty" value={tt.totalQuantity}
                              onChange={(e) => updateTicketType(i, ti, "totalQuantity", e.target.value)}
                              className={`w-full pl-6 pr-2 py-1.5 rounded-lg border text-[12px] text-gray-800 placeholder-gray-300 outline-none bg-white transition-all ${errors[`ttq${i}_${ti}`] ? "border-red-400" : "border-gray-200"}`}
                            />
                          </div>
                          {slot.ticketTypes.length > 1 && (
                            <button onClick={() => removeTicketType(i, ti)}
                              className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                              style={{ background: "#fff1f2" }}>
                              <X size={10} style={{ color: "#106579" }} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => addTicketType(i)}
                        className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                        style={{ color: "#106579", background: "rgba(16,101,121,0.06)" }}>
                        <Plus size={10} /> Add ticket type
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p className="text-[11px] text-gray-400 mt-2">
              {bookingType === "seated"
                ? "Each time slot has a base seat price; category add-ons apply automatically."
                : "Each time slot can offer multiple ticket types (e.g. General, VIP) with their own price & quantity."}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#106579" }}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = "#e04048"; }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#106579")}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : mode === "edit" ? <Edit size={14} /> : <Plus size={14} />}
            {mode === "edit" ? "Save Changes" : "Schedule Event"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

/* ─────────────────────────────────────────
   Expanded Times Row
───────────────────────────────────────── */
function TimesRow({ scheduleId, showTimes, bookingType, onRemoveTime }) {
  return (
    <tr>
      <td colSpan={7} className="px-4 pb-3 pt-0 bg-gray-50/50">
        <div className="ml-12 py-2 flex flex-wrap gap-2">
          {showTimes.length === 0 ? (
            <span className="text-[12px] text-gray-400 italic">No times</span>
          ) : (
            showTimes.map((t) => (
              <div key={t._id}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-100 bg-white text-[12px]">
                <Clock size={11} style={{ color: "#106579" }} />
                <span className="font-semibold text-gray-700">{fmt12(t.time)}</span>
                {t.endTime && <span className="text-gray-400">– {fmt12(t.endTime)}</span>}
                <span className="text-gray-300">·</span>
                {bookingType === "seated" ? (
                  <span className="text-gray-500 flex items-center gap-0.5">
                    <IndianRupee size={10} />{t.price}
                  </span>
                ) : (
                  <span className="text-gray-500 flex items-center gap-1 flex-wrap">
                    {(t.ticketTypes || []).map((tt, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-gray-50 border border-gray-100">
                        {tt.name} · <IndianRupee size={9} className="inline" />{tt.price} · {tt.bookedQuantity || 0}/{tt.totalQuantity}
                      </span>
                    ))}
                  </span>
                )}
                <button
                  onClick={() => onRemoveTime(scheduleId, t._id)}
                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 rounded flex items-center justify-center hover:bg-red-50"
                  title="Remove this time slot">
                  <X size={10} style={{ color: "#106579" }} />
                </button>
              </div>
            ))
          )}
        </div>
      </td>
    </tr>
  );
}

/* ─────────────────────────────────────────
   Action Button
───────────────────────────────────────── */
const COLOR_MAP = {
  red:  { bg: "#fff1f2", text: "#dc2626", hover: "#fee2e2" },
  blue: { bg: "#eff6ff", text: "#2563eb", hover: "#dbeafe" },
  gray: { bg: "#f9fafb", text: "#6b7280", hover: "#f3f4f6" },
};
function ActionBtn({ onClick, color, title, children, disabled }) {
  const c = COLOR_MAP[color];
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-40"
      style={{ background: c.bg, color: c.text }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = c.hover; }}
      onMouseLeave={(e) => (e.currentTarget.style.background = c.bg)}>
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function AdminEventSchedules() {
  const [schedules, setSchedules]       = useState([]);
  const [events, setEvents]             = useState([]);
  const [venues, setVenues]             = useState([]);
  const [search, setSearch]             = useState("");
  const [filterEvent, setFilterEvent]   = useState("");
  const [filterCity, setFilterCity]     = useState("");
  const [sortBy, setSortBy]             = useState("date_asc");
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [deletingId, setDeletingId]     = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editSchedule, setEditSchedule] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: "schedule"|"time"|"bulk", scheduleId, timeId? }
  const [expandedId, setExpandedId]     = useState(null);
  const [toast, setToast]               = useState(null);

  const [pageSize, setPageSize]         = useState(20);
  const [currentPage, setCurrentPage]   = useState(1);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const showToast = (msg, type = "success") => setToast({ message: msg, type });

  /* ── Fetch ── */
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [sRes, eRes, vRes] = await Promise.all([
        axiosAdmin.get("/event-schedules"),
        axiosAdmin.get("/admin/events"),
        axiosAdmin.get("/venues"),
      ]);
      setSchedules(sRes.data);
      setEvents(eRes.data);
      setVenues(vRes.data);
    } catch {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search, filterEvent, filterCity, sortBy, pageSize]);

  /* ── Derived ── */
  const cities = [...new Map(
    venues.filter((v) => v.city).map((v) => [v.city._id, v.city])
  ).values()];

  const filtered = schedules
    .filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        s.event?.title?.toLowerCase().includes(q) ||
        s.venue?.name?.toLowerCase().includes(q);
      const matchEvent = filterEvent ? s.event?._id === filterEvent : true;
      const matchCity  = filterCity  ? s.venue?.city?._id === filterCity : true;
      return matchSearch && matchEvent && matchCity;
    })
    .sort((a, b) => {
      if (sortBy === "date_asc")  return new Date(a.eventDate) - new Date(b.eventDate);
      if (sortBy === "date_desc") return new Date(b.eventDate) - new Date(a.eventDate);
      if (sortBy === "event")     return (a.event?.title || "").localeCompare(b.event?.title || "");
      return 0;
    });

  const upcoming   = schedules.filter((s) => !isPast(s.eventDate)).length;
  const past       = schedules.filter((s) =>  isPast(s.eventDate)).length;
  const totalSlots = schedules.reduce((acc, s) => acc + (s.showTimes?.length || 0), 0);

  const totalPages        = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage    = Math.min(currentPage, totalPages);
  const paginatedSchedules = filtered.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  /* ── Create ── */
  const handleCreate = async (data) => {
    try {
      setSaving(true);
      const res = await axiosAdmin.post("/event-schedules/admin/create", data);
      setSchedules((prev) => [res.data.schedule, ...prev]);
      setShowAddModal(false);
      showToast("Schedule created successfully");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create schedule", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── Update ── */
  const handleUpdate = async (data) => {
    if (!editSchedule) return;
    try {
      setSaving(true);
      const res = await axiosAdmin.put(`/event-schedules/admin/update/${editSchedule._id}`, data);
      setSchedules((prev) => prev.map((s) => (s._id === editSchedule._id ? res.data.schedule : s)));
      setEditSchedule(null);
      showToast("Schedule updated successfully");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update schedule", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete entire schedule ── */
  const handleDeleteSchedule = async () => {
    const { scheduleId } = confirmDelete;
    try {
      setDeletingId(scheduleId);
      await axiosAdmin.delete(`/event-schedules/admin/delete/${scheduleId}`);
      setSchedules((prev) => prev.filter((s) => s._id !== scheduleId));
      showToast("Schedule deleted");
    } catch {
      showToast("Failed to delete schedule", "error");
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    const ids = filtered.map((s) => s._id);
    if (ids.length === 0) return;
    try {
      setBulkDeleting(true);
      await axiosAdmin.delete("/event-schedules/admin/bulk-delete", { data: { ids } });
      setSchedules((prev) => prev.filter((s) => !ids.includes(s._id)));
      showToast(`${ids.length} schedule(s) deleted`);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete schedules", "error");
    } finally {
      setBulkDeleting(false);
      setConfirmDelete(null);
    }
  };

  /* ── Remove single time slot ── */
  const handleRemoveTime = (scheduleId, timeId) => {
    setConfirmDelete({ type: "time", scheduleId, timeId });
  };

  const handleDeleteTime = async () => {
    const { scheduleId, timeId } = confirmDelete;
    try {
      const res = await axiosAdmin.delete(`/event-schedules/admin/${scheduleId}/times/${timeId}`);
      setSchedules((prev) => prev.map((s) => (s._id === scheduleId ? res.data.schedule : s)));
      showToast("Time slot removed");
    } catch {
      showToast("Failed to remove time slot", "error");
    } finally {
      setConfirmDelete(null);
    }
  };

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-6 md:p-8" style={{ fontFamily: "var(--now-ui-font)" }}>

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Event Schedules</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">Schedule events at venues with multiple time slots per day</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all active:scale-[0.98] self-start sm:self-auto"
            style={{ background: "#106579" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#125467")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#106579")}>
            <Plus size={15} /> Add Schedule
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Schedules", value: schedules.length, color: "#6366f1", },
            { label: "Upcoming",        value: upcoming,          color: "#10b981", },
            { label: "Completed",       value: past,              color: "#6b7280", },
            { label: "Total Time Slots",value: totalSlots,        color: "#106579", },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
              <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-[26px] font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex-1 min-w-0">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input type="text" placeholder="Search by event or venue..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-[13px] text-gray-900 outline-none bg-transparent placeholder-gray-400" />
            {search && <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500 text-[11px] font-medium flex-shrink-0">Clear</button>}
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-600">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} className="outline-none bg-transparent text-[13px] text-gray-700 cursor-pointer">
              <option value="">All Events</option>
              {events.map((ev) => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-600">
            <MapPin size={14} className="text-gray-400" />
            <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="outline-none bg-transparent text-[13px] text-gray-700 cursor-pointer">
              <option value="">All Cities</option>
              {cities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-600">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="outline-none bg-transparent text-[13px] text-gray-700 cursor-pointer">
              <option value="date_asc">Date (Earliest)</option>
              <option value="date_desc">Date (Latest)</option>
              <option value="event">Event A → Z</option>
            </select>
          </div>

          {filtered.length > 0 && (
            <button
              onClick={() => setConfirmDelete({ type: "bulk" })}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold border border-red-100 text-red-500 hover:bg-red-50 transition-all whitespace-nowrap">
              <Trash2 size={14} /> Delete Filtered
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["#", "Event", "Venue", "Date", "Time Slots", "Status", "Actions"].map((h) => (
                  <th key={h} className="py-3 px-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-4 px-4"><div className="h-4 w-6 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-32 bg-gray-100 rounded animate-pulse" /></td>
                    {[1, 2, 3, 4].map((j) => <td key={j} className="py-4 px-4"><div className="h-4 w-16 bg-gray-100 rounded animate-pulse" /></td>)}
                    <td className="py-4 px-4"><div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse" /></td>
                  </tr>
                ))
              ) : paginatedSchedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(16,101,121,0.08)" }}>
                      <CalendarDays size={22} style={{ color: "#106579" }} />
                    </div>
                    <p className="text-[14px] font-semibold text-gray-400">No schedules found</p>
                    <p className="text-[12px] text-gray-300 mt-0.5">{search ? `No results for "${search}"` : "Add your first event schedule to get started"}</p>
                  </td>
                </tr>
              ) : (
                paginatedSchedules.map((sch, index) => (
                  <Fragment key={sch._id}>
                    <tr className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                      <td className="py-4 px-4 text-[13px] text-gray-400 font-medium w-10">
                        {(safeCurrentPage - 1) * pageSize + index + 1}
                      </td>

                      {/* Event */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(16,101,121,0.08)" }}>
                            {sch.event?.bookingType === "seated" ? <Armchair size={14} style={{ color: "#106579" }} /> : <Users2 size={14} style={{ color: "#106579" }} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-gray-900 truncate max-w-[180px]">{sch.event?.title || "—"}</p>
                            <p className="text-[11px] text-gray-400 truncate max-w-[180px] mt-0.5">{sch.event?.category || ""}</p>
                          </div>
                        </div>
                      </td>

                      {/* Venue */}
                      <td className="py-4 px-4">
                        <p className="text-[12.5px] font-semibold text-gray-700 truncate max-w-[160px]">
                          {sch.venue?.name || "—"}
                        </p>
                        {sch.venue?.city && (
                          <p className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                            <MapPin size={9} />{sch.venue.city.name}
                          </p>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4">
                        <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-700">
                          <CalendarDays size={12} style={{ color: "#6366f1" }} />
                          {fmtDate(sch.eventDate)}
                        </p>
                      </td>

                      {/* Time slots preview */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(sch.showTimes || []).slice(0, 3).map((t) => (
                            <span key={t._id}
                              className="text-[11px] font-semibold px-2 py-0.5 rounded-md border border-gray-100 bg-gray-50 text-gray-600 whitespace-nowrap">
                              {fmt12(t.time)}
                            </span>
                          ))}
                          {sch.showTimes?.length > 3 && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md border border-gray-100 bg-gray-50 text-gray-400">
                              +{sch.showTimes.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {isPast(sch.eventDate) ? (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">Completed</span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Upcoming</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <ActionBtn onClick={() => toggleExpand(sch._id)} color="gray"
                            title={expandedId === sch._id ? "Hide times" : "View times"}>
                            {expandedId === sch._id ? <ChevronUp size={14} /> : <Clock size={14} />}
                          </ActionBtn>
                          <ActionBtn onClick={() => setEditSchedule(sch)} color="blue" title="Edit schedule">
                            <Edit size={14} />
                          </ActionBtn>
                          <ActionBtn
                            onClick={() => setConfirmDelete({ type: "schedule", scheduleId: sch._id })}
                            disabled={deletingId === sch._id}
                            color="red" title="Delete schedule">
                            {deletingId === sch._id
                              ? <Loader2 size={14} className="animate-spin" />
                              : <Trash2 size={14} />}
                          </ActionBtn>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded time slots */}
                    {expandedId === sch._id && (
                      <TimesRow
                        scheduleId={sch._id}
                        showTimes={sch.showTimes || []}
                        bookingType={sch.event?.bookingType}
                        onRemoveTime={handleRemoveTime}
                      />
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>

          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-[12px] text-gray-400">
                Showing <span className="font-semibold text-gray-600">{(safeCurrentPage - 1) * pageSize + 1}</span>–
                <span className="font-semibold text-gray-600">{Math.min(safeCurrentPage * pageSize, filtered.length)}</span> of{" "}
                <span className="font-semibold text-gray-600">{filtered.length}</span> schedules
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all">
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[12px] font-semibold text-gray-600 px-2">
                  Page {safeCurrentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Add Modal ── */}
      {showAddModal && (
        <ScheduleFormModal mode="add" events={events} venues={venues}
          onSave={handleCreate} onCancel={() => setShowAddModal(false)} saving={saving} />
      )}

      {/* ── Edit Modal ── */}
      {editSchedule && (
        <ScheduleFormModal mode="edit" initial={editSchedule} events={events} venues={venues}
          onSave={handleUpdate} onCancel={() => setEditSchedule(null)} saving={saving} />
      )}

      {/* ── Confirm (schedule delete) ── */}
      {confirmDelete?.type === "schedule" && (
        <ConfirmModal
          title="Delete Schedule"
          description="This will permanently delete all time slots for this event schedule."
          onConfirm={handleDeleteSchedule}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* ── Confirm (bulk delete — respects current search/filters) ── */}
      {confirmDelete?.type === "bulk" && (
        <ConfirmModal
          title="Delete All Filtered Schedules"
          description={`This will permanently delete ${filtered.length} schedule(s) matching your current search/filters. This cannot be undone.`}
          onConfirm={handleBulkDelete}
          onCancel={() => setConfirmDelete(null)}
          busy={bulkDeleting}
        />
      )}

      {/* ── Confirm (time slot delete) ── */}
      {confirmDelete?.type === "time" && (
        <ConfirmModal
          title="Remove Time Slot"
          description="This time slot will be permanently removed from this schedule."
          onConfirm={handleDeleteTime}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}