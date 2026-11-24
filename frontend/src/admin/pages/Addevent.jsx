import { useState, useEffect } from "react";
import axiosAdmin from "../../api/axiosAdmin";
import AdminLayout from "../layout/AdminLayout";
import {
  Image,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  PartyPopper,
  Star,
  Mic2,
  Building2,
  Calendar,
  Link2,
  Type,
  AlignLeft,
  Tag,
  CheckCircle2,
  Upload,
  Globe,
  Clock,
  ShieldCheck,
  Radio,
  Ticket,
  Armchair,
  Users2,
  ListChecks,
  User,
  Mail,
  Phone,
  Sparkles,
  Images,
  Route,
} from "lucide-react";
import { toast } from "sonner";

/* ── Step config ─────────────────────────────────────── */
const STEPS = [
  { id: 1, label: "Details",  icon: PartyPopper },
  { id: 2, label: "Info",     icon: Radio },
  { id: 3, label: "Artists",  icon: Mic2 },
  { id: 4, label: "Organizer",icon: Building2 },
  { id: 5, label: "Review",   icon: CheckCircle2 },
];

const CATEGORY_OPTIONS = [
  "Music", "Nightlife", "Comedy Shows", "Expos", "Performances", "Workshops", "Sports",
];
const AGE_OPTIONS = ["All Ages", "13+", "16+", "18+"];
const BOOKING_OPTIONS = [
  { value: "general", label: "General Admission", icon: Users2 },
  { value: "seated",  label: "Seated",             icon: Armchair },
];
const STATUS_OPTIONS = ["upcoming", "live", "completed", "cancelled"];

/* ── Small reusable components ───────────────────────── */
function InputField({ icon: Icon, label, children }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
          {Icon && <Icon size={12} />}
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

function StyledInput({ className = "", ...props }) {
  return (
    <input
      className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[14px] text-gray-900
        placeholder-gray-400 outline-none focus:border-now-accent focus:ring-2 focus:ring-now-accent/10
        transition-all ${className}`}
      {...props}
    />
  );
}

function StyledSelect({ className = "", children, ...props }) {
  return (
    <select
      className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[14px] text-gray-900
        outline-none focus:border-now-accent focus:ring-2 focus:ring-now-accent/10
        transition-all appearance-none cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

function StyledTextarea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[14px] text-gray-900
        placeholder-gray-400 outline-none focus:border-now-accent focus:ring-2 focus:ring-now-accent/10
        transition-all resize-none ${className}`}
      {...props}
    />
  );
}

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(16,101,121,0.09)" }}>
          <Icon size={16} style={{ color: "#106579" }} />
        </div>
        <h3 className="text-[15px] font-bold text-gray-900">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function NavButtons({ onBack, onNext, nextLabel = "Next", isFirst = false, isLast = false, onSubmit }) {
  return (
    <div className="flex items-center justify-between pt-2">
      {!isFirst ? (
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white
            text-[13px] font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
        >
          <ArrowLeft size={16} /> Back
        </button>
      ) : <span />}

      {isLast ? (
        <button
          onClick={onSubmit}
          className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all shadow-sm hover:shadow-md"
          style={{ background: "#106579" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#d94040")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#106579")}
        >
          <CheckCircle2 size={16} /> Save Event
        </button>
      ) : (
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all shadow-sm hover:shadow-md"
          style={{ background: "#106579" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#d94040")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#106579")}
        >
          {nextLabel} <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}

function ToggleChip({ label, active, onClick, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold border transition-all"
      style={
        active
          ? { background: "rgba(16,101,121,0.1)", color: "#106579", borderColor: "rgba(16,101,121,0.35)" }
          : { background: "#f9fafb", color: "#6b7280", borderColor: "#e4e4e7" }
      }
    >
      {Icon && <Icon size={12} />}
      {label}
    </button>
  );
}

/* ── Status Badge ────────────────────────────────────── */
const STATUS_STYLES = {
  upcoming:  { bg: "rgba(99,102,241,0.08)",  color: "#6366f1", border: "rgba(99,102,241,0.2)"  },
  live:      { bg: "rgba(16,185,129,0.08)",  color: "#059669", border: "rgba(16,185,129,0.2)"  },
  completed: { bg: "rgba(107,114,128,0.08)", color: "#4b5563", border: "rgba(107,114,128,0.2)" },
  cancelled: { bg: "rgba(220,38,38,0.08)",   color: "#dc2626", border: "rgba(220,38,38,0.2)"   },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.upcoming;
  return (
    <span className="text-[11px] font-semibold px-3 py-1 rounded-full border capitalize"
      style={{ background: s.bg, color: s.color, borderColor: s.border }}>
      {status}
    </span>
  );
}

/* ── Main Component ───────────────────────────────────── */
export default function AddEvent() {
  const [step, setStep] = useState(1);
  const [showTrailer, setShowTrailer] = useState(false);
  const [artistOptions, setArtistOptions] = useState([]);
  const [artistSearch, setArtistSearch] = useState("");
  const [tourOptions, setTourOptions] = useState([]);

  const [form, setForm] = useState({
    // Step 1 — core details
    title: "",
    description: "",
    category: "",
    genre: "",
    tags: [],
    poster: null,
    // Step 2 — event info
    languages: [],
    duration: "",
    ageRestriction: "All Ages",
    bookingType: "general",
    status: "upcoming",
    isFeatured: false,
    trailerLink: "",
    // Step 3 — artists & rules
    artists: [],
    tour: "",
    eventRules: [],
    // Step 4 — organizer & gallery
    organizer: { name: "", email: "", phone: "" },
    gallery: [],
  });

  const [posterPreview, setPosterPreview] = useState(null);

  /* ── helpers ── */
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setOrganizer = (key, val) =>
    setForm((f) => ({ ...f, organizer: { ...f.organizer, [key]: val } }));

  useEffect(() => {
    const loadArtists = async () => {
      try {
        const res = await axiosAdmin.get("/artists");
        setArtistOptions(res.data || []);
      } catch (err) {
        console.error("Failed to load artists", err);
      }
    };
    const loadTours = async () => {
      try {
        const res = await axiosAdmin.get("/tours");
        setTourOptions(res.data || []);
      } catch (err) {
        console.error("Failed to load tours", err);
      }
    };
    loadArtists();
    loadTours();
  }, []);

  const toggleArtist = (id) =>
    set("artists", form.artists.includes(id)
      ? form.artists.filter((a) => a !== id)
      : [...form.artists, id]);

  const handlePoster = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    set("poster", file);
    setPosterPreview(URL.createObjectURL(file));
  };

  const handleGallery = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const items = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    set("gallery", [...form.gallery, ...items]);
  };
  const removeGalleryItem = (i) =>
    set("gallery", form.gallery.filter((_, idx) => idx !== i));

  const getYoutubeId = (url) => {
    if (!url) return "";
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : "";
  };

  const filteredArtistOptions = artistOptions.filter((a) =>
    a.name.toLowerCase().includes(artistSearch.toLowerCase())
  );
  const selectedArtists = artistOptions.filter((a) => form.artists.includes(a._id));

  const handleSubmit = async () => {
    if (!form.title || !form.category) {
      toast.error("Title and category are required");
      setStep(1);
      return;
    }
    try {
      const data = new FormData();
      data.append("title",          form.title);
      data.append("description",    form.description);
      data.append("category",       form.category);
      data.append("genre",          form.genre);
      data.append("tags",           JSON.stringify(form.tags));
      data.append("language",       form.languages);
      data.append("duration",       form.duration);
      data.append("ageRestriction", form.ageRestriction);
      data.append("bookingType",    form.bookingType);
      data.append("status",         form.status);
      data.append("isFeatured",     form.isFeatured);
      data.append("trailerLink",    form.trailerLink);
      data.append("artists",        JSON.stringify(form.artists));
      if (form.tour) data.append("tour", form.tour);
      data.append("eventRules",     JSON.stringify(form.eventRules));
      data.append("organizer",      JSON.stringify(form.organizer));
      if (form.poster) data.append("poster", form.poster);
      form.gallery.forEach((g) => data.append("gallery", g.file));

      await axiosAdmin.post("/admin/events", data, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Event added successfully!");
      window.location.href = "/admin/events";
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to add event");
    }
  };

  const LANGUAGE_OPTIONS = [
  "English",
  "Hindi",
  "Gujarati",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
];

  return (
    <AdminLayout>
      <div
        className="min-h-screen bg-gray-50 p-6 md:p-8"
        style={{ fontFamily: "var(--now-ui-font)" }}
      >

        <div className="mb-8">
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">
            Add New Event
          </h1>
          <p className="text-[13px] text-gray-400 mt-0.5">
            Fill in the details across all steps and submit
          </p>
        </div>

        {/* ── Step Indicator ── */}
        <div className="flex items-center gap-0 mb-8 bg-white border border-gray-100 rounded-2xl shadow-sm p-2 w-fit">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isCompleted = step > s.id;
            return (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => step > s.id && setStep(s.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all"
                  style={
                    isActive
                      ? { background: "rgba(16,101,121,0.09)", color: "#106579" }
                      : isCompleted
                        ? { background: "transparent", color: "#10b981" }
                        : { background: "transparent", color: "#9ca3af" }
                  }
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border flex-shrink-0"
                    style={
                      isActive
                        ? {
                            background: "#106579",
                            color: "#fff",
                            borderColor: "#106579",
                          }
                        : isCompleted
                          ? {
                              background: "#10b981",
                              color: "#fff",
                              borderColor: "#10b981",
                            }
                          : {
                              background: "transparent",
                              color: "#d1d5db",
                              borderColor: "#e4e4e7",
                            }
                    }
                  >
                    {isCompleted ? "✓" : s.id}
                  </div>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div
                    className="w-4 h-px mx-1"
                    style={{ background: "#e4e4e7" }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ══════════════ STEP 1 — Core Details ══════════════ */}
        {step === 1 && (
          <SectionCard title="Event Details" icon={PartyPopper}>
            <div className="space-y-5">
              <InputField icon={Type} label="Title">
                <StyledInput
                  placeholder="e.g. Sunburn Music Festival"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                />
              </InputField>

              <InputField icon={AlignLeft} label="Description">
                <StyledTextarea
                  placeholder="Brief description of the event..."
                  rows={4}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </InputField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField icon={Tag} label="Category">
                  <StyledSelect
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                  >
                    <option value="">Select category</option>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </StyledSelect>
                </InputField>

                <InputField icon={Sparkles} label="Genre">
                  <StyledInput
                    placeholder="Rock, Stand-up, Tech..."
                    value={form.genre}
                    onChange={(e) => set("genre", e.target.value)}
                  />
                </InputField>
              </div>

              <InputField icon={Tag} label="Tags">
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1 rounded-lg border"
                        style={{
                          background: "rgba(16,101,121,0.08)",
                          color: "#106579",
                          borderColor: "rgba(16,101,121,0.25)",
                        }}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() =>
                            set(
                              "tags",
                              form.tags.filter((_, idx) => idx !== i),
                            )
                          }
                          className="hover:opacity-70 transition-opacity leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <StyledInput
                  placeholder='Type a tag and press Enter or ","'
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      const val = e.target.value.trim().replace(/,$/, "");
                      if (val && !form.tags.includes(val))
                        set("tags", [...form.tags, val]);
                      e.target.value = "";
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim().replace(/,$/, "");
                    if (val && !form.tags.includes(val)) {
                      set("tags", [...form.tags, val]);
                      e.target.value = "";
                    }
                  }}
                />
              </InputField>

              <InputField icon={Image} label="Event Poster">
                <div className="flex items-start gap-4">
                  <label className="flex-1 flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer hover:border-now-accent hover:bg-[rgba(16,101,121,0.03)] transition-all group">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                      style={{ background: "rgba(16,101,121,0.09)" }}
                    >
                      <Upload size={18} style={{ color: "#106579" }} />
                    </div>
                    <div className="text-center">
                      <p className="text-[13px] font-semibold text-gray-700">
                        Click to upload poster
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handlePoster}
                    />
                  </label>

                  {posterPreview && (
                    <div className="relative flex-shrink-0">
                      <img
                        src={posterPreview}
                        alt="poster preview"
                        className="w-28 h-40 object-cover rounded-xl border border-gray-200 shadow-sm"
                      />
                      <button
                        onClick={() => {
                          setPosterPreview(null);
                          set("poster", null);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </InputField>

              <NavButtons
                isFirst
                onNext={() => setStep(2)}
                nextLabel="Event Info"
              />
            </div>
          </SectionCard>
        )}

        {/* ══════════════ STEP 2 — Event Info ══════════════ */}
        {step === 2 && (
          <SectionCard title="Event Information" icon={Radio}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputField icon={Globe} label="Language">
  <div className="flex flex-wrap gap-2">
    {LANGUAGE_OPTIONS.map((lang) => (
      <ToggleChip
        key={lang}
        label={lang}
        active={form.languages.includes(lang)}
        onClick={() => {
          set(
            "languages",
            form.languages.includes(lang)
              ? form.languages.filter((l) => l !== lang)
              : [...form.languages, lang]
          );
        }}
      />
    ))}
  </div>
  <p className="text-[11px] text-gray-400 mt-2">
    Select all languages this event will be presented in
  </p>
</InputField>

                <InputField icon={Clock} label="Duration (minutes)">
                  <StyledInput
                    type="number"
                    placeholder="e.g. 180"
                    min="1"
                    value={form.duration}
                    onChange={(e) => set("duration", e.target.value)}
                  />
                </InputField>

                <InputField icon={ShieldCheck} label="Age Restriction">
                  <StyledSelect
                    value={form.ageRestriction}
                    onChange={(e) => set("ageRestriction", e.target.value)}
                  >
                    {AGE_OPTIONS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </StyledSelect>
                </InputField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField icon={Radio} label="Status">
                  <StyledSelect
                    value={form.status}
                    onChange={(e) => set("status", e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s} className="capitalize">
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </StyledSelect>
                </InputField>

                <InputField icon={Link2} label="Trailer / Promo URL">
                  <StyledInput
                    placeholder="https://youtube.com/watch?v=..."
                    value={form.trailerLink}
                    onChange={(e) => set("trailerLink", e.target.value)}
                  />
                </InputField>
              </div>

              <InputField icon={Ticket} label="Booking Type">
                <div className="flex flex-wrap gap-2">
                  {BOOKING_OPTIONS.map((b) => (
                    <ToggleChip
                      key={b.value}
                      label={b.label}
                      icon={b.icon}
                      active={form.bookingType === b.value}
                      onClick={() => set("bookingType", b.value)}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  Determines the booking flow used for schedules of this event
                </p>
              </InputField>

              {/* Featured Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/60">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(16,101,121,0.09)" }}
                  >
                    <Star size={15} style={{ color: "#106579" }} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">
                      Featured Event
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Highlight this event in recommended sections
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => set("isFeatured", !form.isFeatured)}
                  className="relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0"
                  style={{
                    background: form.isFeatured ? "#106579" : "#d1d5db",
                  }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
                    style={{
                      transform: form.isFeatured
                        ? "translateX(20px)"
                        : "translateX(0)",
                    }}
                  />
                </button>
              </div>

              <NavButtons
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
                nextLabel="Artists & Rules"
              />
            </div>
          </SectionCard>
        )}

        {/* ══════════════ STEP 3 — Artists & Rules ══════════════ */}
        {step === 3 && (
          <SectionCard title="Artists & Event Rules" icon={Mic2}>
            <div className="space-y-6">
              <InputField icon={Mic2} label="Artists / Performers">
                {selectedArtists.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedArtists.map((a) => (
                      <span
                        key={a._id}
                        className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1 rounded-lg border"
                        style={{
                          background: "rgba(16,101,121,0.08)",
                          color: "#106579",
                          borderColor: "rgba(16,101,121,0.25)",
                        }}
                      >
                        {a.name}
                        <button
                          type="button"
                          onClick={() => toggleArtist(a._id)}
                          className="hover:opacity-70 transition-opacity leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <StyledInput
                  placeholder="Search artists..."
                  value={artistSearch}
                  onChange={(e) => setArtistSearch(e.target.value)}
                />
                <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
                  {filteredArtistOptions.length === 0 ? (
                    <p className="text-[13px] text-gray-400 text-center py-6">
                      {artistOptions.length === 0
                        ? "No artists found — add some in the Artists section"
                        : "No matches"}
                    </p>
                  ) : (
                    filteredArtistOptions.map((a) => {
                      const active = form.artists.includes(a._id);
                      return (
                        <button
                          key={a._id}
                          type="button"
                          onClick={() => toggleArtist(a._id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                            {a.image ? (
                              <img
                                src={a.image}
                                className="w-full h-full object-cover"
                                alt=""
                              />
                            ) : (
                              <Mic2 size={13} className="text-gray-300" />
                            )}
                          </div>
                          <span className="flex-1 text-[13px] font-medium text-gray-800 truncate">
                            {a.name}
                          </span>
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center border flex-shrink-0"
                            style={
                              active
                                ? {
                                    background: "#106579",
                                    borderColor: "#106579",
                                  }
                                : { background: "#fff", borderColor: "#e4e4e7" }
                            }
                          >
                            {active && (
                              <CheckCircle2 size={13} className="text-white" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </InputField>

              <InputField icon={Route} label="Part of a Tour? (optional)">
                <StyledSelect value={form.tour} onChange={(e) => set("tour", e.target.value)}>
                  <option value="">Standalone event — not part of a tour</option>
                  {tourOptions.map((t) => (
                    <option key={t._id} value={t._id}>{t.title}</option>
                  ))}
                </StyledSelect>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Pick this if this show is one city leg of a multi-city/country tour (e.g. "Forever Tour 2026").
                  Create tours first from Event Management → Tours.
                </p>
              </InputField>

              <InputField icon={ListChecks} label="Event Rules">
                {form.eventRules.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.eventRules.map((rule, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1 rounded-lg border"
                        style={{
                          background: "rgba(16,101,121,0.08)",
                          color: "#106579",
                          borderColor: "rgba(16,101,121,0.25)",
                        }}
                      >
                        {rule}
                        <button
                          type="button"
                          onClick={() =>
                            set(
                              "eventRules",
                              form.eventRules.filter((_, idx) => idx !== i),
                            )
                          }
                          className="hover:opacity-70 transition-opacity leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <StyledInput
                  placeholder='e.g. "No outside food" — press Enter'
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = e.target.value.trim();
                      if (val && !form.eventRules.includes(val))
                        set("eventRules", [...form.eventRules, val]);
                      e.target.value = "";
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val && !form.eventRules.includes(val)) {
                      set("eventRules", [...form.eventRules, val]);
                      e.target.value = "";
                    }
                  }}
                />
              </InputField>

              <NavButtons
                onBack={() => setStep(2)}
                onNext={() => setStep(4)}
                nextLabel="Organizer & Gallery"
              />
            </div>
          </SectionCard>
        )}

        {/* ══════════════ STEP 4 — Organizer & Gallery ══════════════ */}
        {step === 4 && (
          <SectionCard title="Organizer & Gallery" icon={Building2}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputField icon={User} label="Organizer Name">
                  <StyledInput
                    placeholder="e.g. Live Nation"
                    value={form.organizer.name}
                    onChange={(e) => setOrganizer("name", e.target.value)}
                  />
                </InputField>
                <InputField icon={Mail} label="Organizer Email">
                  <StyledInput
                    type="email"
                    placeholder="contact@organizer.com"
                    value={form.organizer.email}
                    onChange={(e) => setOrganizer("email", e.target.value)}
                  />
                </InputField>
                <InputField icon={Phone} label="Organizer Phone">
                  <StyledInput
                    placeholder="+1 234 567 890"
                    value={form.organizer.phone}
                    onChange={(e) => setOrganizer("phone", e.target.value)}
                  />
                </InputField>
              </div>

              <InputField icon={Images} label="Gallery Images">
                <label className="flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer hover:border-now-accent hover:bg-[rgba(16,101,121,0.03)] transition-all group">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{ background: "rgba(16,101,121,0.09)" }}
                  >
                    <Upload size={18} style={{ color: "#106579" }} />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-semibold text-gray-700">
                      Click to upload gallery images
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      You can select multiple images
                    </p>
                  </div>
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={handleGallery}
                  />
                </label>

                {form.gallery.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mt-3">
                    {form.gallery.map((g, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-lg overflow-hidden border border-gray-200"
                      >
                        <img
                          src={g.preview}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                        <button
                          onClick={() => removeGalleryItem(i)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </InputField>

              <NavButtons
                onBack={() => setStep(3)}
                onNext={() => setStep(5)}
                nextLabel="Review"
              />
            </div>
          </SectionCard>
        )}

        {/* ══════════════ STEP 5 — Review ══════════════ */}
        {step === 5 && (
          <div className="space-y-5">
            {/* Event Details card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(16,101,121,0.09)" }}
                >
                  <PartyPopper size={16} style={{ color: "#106579" }} />
                </div>
                <h3 className="text-[15px] font-bold text-gray-900">
                  Event Details
                </h3>
              </div>

              <div className="p-6 flex gap-6">
                <div className="w-36 h-52 rounded-xl overflow-hidden border border-gray-100 shadow-sm flex-shrink-0 bg-gray-50 flex items-center justify-center">
                  {posterPreview ? (
                    <img
                      src={posterPreview}
                      className="w-full h-full object-cover"
                      alt="poster"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-300">
                      <Image size={24} />
                      <span className="text-[11px]">No Poster</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-3">
                  <h2 className="text-[20px] font-bold text-gray-900 truncate">
                    {form.title || (
                      <span className="text-gray-300 italic font-normal">
                        Untitled
                      </span>
                    )}
                  </h2>
                  <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-3">
                    {form.description || (
                      <span className="italic text-gray-300">
                        No description
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {form.category && (
                      <span
                        className="text-[11px] font-semibold px-3 py-1 rounded-full border"
                        style={{
                          background: "rgba(99,102,241,0.08)",
                          color: "#6366f1",
                          borderColor: "rgba(99,102,241,0.2)",
                        }}
                      >
                        {form.category}
                      </span>
                    )}
                    {form.genre && (
                      <span
                        className="text-[11px] font-semibold px-3 py-1 rounded-full border"
                        style={{
                          background: "rgba(245,158,11,0.08)",
                          color: "#b45309",
                          borderColor: "rgba(245,158,11,0.2)",
                        }}
                      >
                        {form.genre}
                      </span>
                    )}
                    {form.status && <StatusBadge status={form.status} />}
                    {form.isFeatured && (
                      <span
                        className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-full border"
                        style={{
                          background: "rgba(16,101,121,0.08)",
                          color: "#106579",
                          borderColor: "rgba(16,101,121,0.25)",
                        }}
                      >
                        <Star size={10} /> Featured
                      </span>
                    )}
                  </div>
                  {form.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {form.tags.map((t) => (
                        <ToggleChip key={t} label={t} active />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Event Info card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(16,101,121,0.09)" }}
                >
                  <Radio size={16} style={{ color: "#106579" }} />
                </div>
                <h3 className="text-[15px] font-bold text-gray-900">
                  Event Information
                </h3>
              </div>
              <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-5">
                {[
                  {
                    icon: Globe,
                    label: "Language",
                    value: form.languages || "—",
                  },
                  {
                    icon: Clock,
                    label: "Duration",
                    value: form.duration ? `${form.duration} min` : "—",
                  },
                  {
                    icon: ShieldCheck,
                    label: "Age Restriction",
                    value: form.ageRestriction || "—",
                  },
                  {
                    icon: form.bookingType === "seated" ? Armchair : Users2,
                    label: "Booking Type",
                    value: form.bookingType === "seated" ? "Seated" : "General",
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="space-y-1">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Icon size={10} /> {label}
                    </p>
                    <p className="text-[14px] font-semibold text-gray-900">
                      {value}
                    </p>
                  </div>
                ))}
                {form.eventRules.length > 0 && (
                  <div className="space-y-1.5 col-span-2 sm:col-span-4">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <ListChecks size={10} /> Event Rules
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.eventRules.map((r) => (
                        <ToggleChip key={r} label={r} active />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Artists + Organizer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(16,101,121,0.09)" }}
                    >
                      <Mic2 size={16} style={{ color: "#106579" }} />
                    </div>
                    <h3 className="text-[15px] font-bold text-gray-900">
                      Artists
                    </h3>
                  </div>
                  <span
                    className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: "rgba(16,101,121,0.08)",
                      color: "#106579",
                    }}
                  >
                    {selectedArtists.length}
                  </span>
                </div>
                <div className="p-4 space-y-2.5 max-h-64 overflow-y-auto">
                  {selectedArtists.length === 0 ? (
                    <p className="text-[13px] text-gray-400 text-center py-6">
                      No artists added
                    </p>
                  ) : (
                    selectedArtists.map((a) => (
                      <div
                        key={a._id}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50"
                      >
                        <div className="w-9 h-9 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0 bg-white flex items-center justify-center">
                          {a.image ? (
                            <img
                              src={a.image}
                              className="w-full h-full object-cover"
                              alt=""
                            />
                          ) : (
                            <span className="text-[11px] font-bold text-gray-400">
                              {a.name?.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] font-semibold text-gray-900 truncate">
                          {a.name}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(16,101,121,0.09)" }}
                  >
                    <Building2 size={16} style={{ color: "#106579" }} />
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Organizer
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  {form.organizer.name ||
                  form.organizer.email ||
                  form.organizer.phone ? (
                    <>
                      {form.organizer.name && (
                        <p className="flex items-center gap-2 text-[13px] text-gray-800">
                          <User size={13} className="text-gray-400" />{" "}
                          {form.organizer.name}
                        </p>
                      )}
                      {form.organizer.email && (
                        <p className="flex items-center gap-2 text-[13px] text-gray-800">
                          <Mail size={13} className="text-gray-400" />{" "}
                          {form.organizer.email}
                        </p>
                      )}
                      {form.organizer.phone && (
                        <p className="flex items-center gap-2 text-[13px] text-gray-800">
                          <Phone size={13} className="text-gray-400" />{" "}
                          {form.organizer.phone}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-[13px] text-gray-400 text-center py-6">
                      No organizer details
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Gallery */}
            {form.gallery.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(16,101,121,0.09)" }}
                  >
                    <Images size={16} style={{ color: "#106579" }} />
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Gallery
                  </h3>
                </div>
                <div className="p-4 grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {form.gallery.map((g, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg overflow-hidden border border-gray-200"
                    >
                      <img
                        src={g.preview}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trailer */}
            {form.trailerLink && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(16,101,121,0.09)" }}
                  >
                    <PartyPopper size={16} style={{ color: "#106579" }} />
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Trailer Preview
                  </h3>
                </div>
                <div className="p-4">
                  <div
                    className="relative w-full rounded-xl overflow-hidden cursor-pointer group"
                    onClick={() => setShowTrailer(true)}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${getYoutubeId(form.trailerLink)}/maxresdefault.jpg`}
                      className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                      alt="trailer"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                        <span className="text-xl ml-1 text-gray-900">▶</span>
                      </div>
                    </div>
                    <div
                      className="absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full text-white"
                      style={{ background: "#106579" }}
                    >
                      Trailer
                    </div>
                  </div>
                </div>
              </div>
            )}

            <NavButtons
              onBack={() => setStep(4)}
              isLast
              onSubmit={handleSubmit}
            />
          </div>
        )}

        {showTrailer && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowTrailer(false)}
          >
            <div
              className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3 bg-gray-900">
                <span className="text-[13px] font-semibold text-white">
                  Trailer
                </span>
                <button
                  onClick={() => setShowTrailer(false)}
                  className="text-gray-400 hover:text-white text-xl leading-none"
                >
                  ×
                </button>
              </div>
              <iframe
                className="w-full aspect-video"
                src={`https://www.youtube.com/embed/${getYoutubeId(form.trailerLink)}?autoplay=1`}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}