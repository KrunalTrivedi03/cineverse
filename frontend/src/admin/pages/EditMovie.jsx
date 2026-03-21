import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosAdmin from "../../api/axiosAdmin";
import AdminLayout from "../layout/AdminLayout";
import {
  Image,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Clapperboard,
  Star,
  Users,
  UserCog,
  Film,
  Calendar,
  Link2,
  Type,
  AlignLeft,
  Tag,
  CheckCircle2,
  Upload,
  Pencil,
  Globe,
  Clock,
  Shield,
  Radio,
  Tv,
  MonitorPlay,
  LayoutGrid,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

/* ── Step config ─────────────────────────────────────── */
const STEPS = [
  { id: 1, label: "Details",  icon: Film },
  { id: 2, label: "Release",  icon: Radio },
  { id: 3, label: "Cast",     icon: Users },
  { id: 4, label: "Crew",     icon: UserCog },
  { id: 5, label: "Review",   icon: CheckCircle2 },
];

const FORMAT_OPTIONS    = ["2D", "3D", "IMAX", "4DX", "MX4D", "Dolby"];
const STATUS_OPTIONS    = ["upcoming", "released", "streaming"];
const CERTIFICATE_OPTIONS = ["U", "UA", "A", "S", "G", "PG", "PG-13", "R"];

/* ── Reusable components ─────────────────────────────── */
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
        placeholder-gray-400 outline-none focus:border-[#f0545c] focus:ring-2 focus:ring-[#f0545c]/10
        transition-all ${className}`}
      {...props}
    />
  );
}

function StyledSelect({ className = "", children, ...props }) {
  return (
    <select
      className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[14px] text-gray-900
        outline-none focus:border-[#f0545c] focus:ring-2 focus:ring-[#f0545c]/10
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
        placeholder-gray-400 outline-none focus:border-[#f0545c] focus:ring-2 focus:ring-[#f0545c]/10
        transition-all resize-none ${className}`}
      {...props}
    />
  );
}

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(240,84,92,0.09)" }}>
          <Icon size={16} style={{ color: "#f0545c" }} />
        </div>
        <h3 className="text-[15px] font-bold text-gray-900">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function NavButtons({ onBack, onNext, nextLabel = "Next", isFirst = false, isLast = false, onSubmit, submitLabel = "Update Movie" }) {
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
          style={{ background: "#f0545c" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#d94040")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#f0545c")}
        >
          <Pencil size={15} /> {submitLabel}
        </button>
      ) : (
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all shadow-sm hover:shadow-md"
          style={{ background: "#f0545c" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#d94040")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#f0545c")}
        >
          {nextLabel} <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}

/* ── Toggle Chip ─────────────────────────────────────── */
function ToggleChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3.5 py-1.5 rounded-lg text-[12px] font-semibold border transition-all"
      style={
        active
          ? { background: "rgba(240,84,92,0.1)", color: "#f0545c", borderColor: "rgba(240,84,92,0.35)" }
          : { background: "#f9fafb", color: "#6b7280", borderColor: "#e5e7eb" }
      }
    >
      {label}
    </button>
  );
}

/* ── Person card (cast / crew) ───────────────────────── */
function PersonCard({ person, index, onUpdate, onRemove, onImage, roleLabel }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-gray-50 transition-colors group">
      <label className="relative cursor-pointer flex-shrink-0">
        <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-white flex items-center justify-center">
          {person.preview ? (
            <img src={person.preview} className="w-full h-full object-cover" alt="" />
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <Upload size={16} className="text-gray-300" />
              <span className="text-[9px] text-gray-300 font-medium">Photo</span>
            </div>
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
          style={{ background: "#f0545c" }}>
          <Plus size={10} className="text-white" />
        </div>
        <input type="file" hidden accept="image/*" onChange={(e) => onImage(index, e)} />
      </label>

      <div className="flex-1 grid grid-cols-2 gap-3 min-w-0">
        <StyledInput
          placeholder="Full name"
          value={person.name}
          onChange={(e) => onUpdate(index, "name", e.target.value)}
        />
        <StyledInput
          placeholder={roleLabel}
          value={roleLabel === "Role" ? person.role : person.position}
          onChange={(e) => onUpdate(index, roleLabel === "Role" ? "role" : "position", e.target.value)}
        />
      </div>

      <button
        onClick={() => onRemove(index)}
        className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220,38,38,0.15)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(220,38,38,0.08)")}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

/* ── Status Badge ────────────────────────────────────── */
const STATUS_STYLES = {
  upcoming:  { bg: "rgba(99,102,241,0.08)",  color: "#6366f1", border: "rgba(99,102,241,0.2)"  },
  released:  { bg: "rgba(16,185,129,0.08)",  color: "#059669", border: "rgba(16,185,129,0.2)"  },
  streaming: { bg: "rgba(245,158,11,0.08)",  color: "#b45309", border: "rgba(245,158,11,0.2)"  },
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
export default function EditMovie() {
  const { id } = useParams();
  const [step, setStep] = useState(1);
  const [showTrailer, setShowTrailer] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    // Step 1 — core details
    title: "",
    description: "",
    genre: "",
    rating: "",
    releaseDate: "",
    trailerLink: "",
    poster: null,
    // Step 2 — release info
    language: "",
    duration: "",
    certificate: "",
    status: "upcoming",
    ottPlatform: "",
    isInCinemas: false,
    formats: [],
    cities: [],
    // Step 3 & 4
    cast: [],
    crew: [],
  });

  const [posterPreview, setPosterPreview] = useState(null);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const toggleFormat = (fmt) =>
    set("formats", form.formats.includes(fmt)
      ? form.formats.filter((f) => f !== fmt)
      : [...form.formats, fmt]);

  const getYoutubeId = (url) => {
    if (!url) return "";
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : "";
  };

  /* ── Load existing movie data ── */
  useEffect(() => {
    const loadMovie = async () => {
      try {
        setLoading(true);
        const res = await axiosAdmin.get(`/admin/movies/${id}`);
        const movie = res.data;

        setForm({
          title:       movie.title        || "",
          description: movie.description  || "",
          genre:       movie.genre        || "",
          rating:      movie.rating       ?? "",
          releaseDate: movie.releaseDate  ? movie.releaseDate.slice(0, 10) : "",
          trailerLink: movie.trailerLink  || "",
          poster:      null,
          // new fields
          language:    movie.language     || "",
          duration:    movie.duration     ?? "",
          certificate: movie.certificate  || "",
          status:      movie.status       || "upcoming",
          ottPlatform: movie.ottPlatform  || "",
          isInCinemas: movie.isInCinemas  ?? false,
          formats:     movie.formats      || [],
          cities:      movie.cities       || [],
          // people
          cast: (movie.cast || []).map((c) => ({
            name: c.name || "",
            role: c.role || "",
            image: null,
            existingImage: c.image || null,
            preview: c.image ? `${import.meta.env.VITE_API_URL}${c.image}` : null,
          })),
          crew: (movie.crew || []).map((c) => ({
            name: c.name || "",
            position: c.position || "",
            image: null,
            existingImage: c.image || null,
            preview: c.image ? `${import.meta.env.VITE_API_URL}${c.image}` : null,
          })),
        });

        setPosterPreview(movie.poster ? `${import.meta.env.VITE_API_URL}${movie.poster}` : null);
      } catch (err) {
        console.error("Failed to load movie", err);
        toast.error("Failed to load movie data");
      } finally {
        setLoading(false);
      }
    };

    loadMovie();
  }, [id]);

  /* ── Handlers ── */
  const handlePoster = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set("poster", file);
    setPosterPreview(URL.createObjectURL(file));
  };

  const addCast    = () => set("cast", [...form.cast, { name: "", role: "", image: null, preview: null, existingImage: null }]);
  const removeCast = (i) => set("cast", form.cast.filter((_, idx) => idx !== i));
  const updateCast = (i, f, v) => { const u = [...form.cast]; u[i][f] = v; set("cast", u); };
  const handleCastImage = (i, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const u = [...form.cast];
    u[i].image = file; u[i].preview = URL.createObjectURL(file);
    set("cast", u);
  };

  const addCrew    = () => set("crew", [...form.crew, { name: "", position: "", image: null, preview: null, existingImage: null }]);
  const removeCrew = (i) => set("crew", form.crew.filter((_, idx) => idx !== i));
  const updateCrew = (i, f, v) => { const u = [...form.crew]; u[i][f] = v; set("crew", u); };
  const handleCrewImage = (i, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const u = [...form.crew];
    u[i].image = file; u[i].preview = URL.createObjectURL(file);
    set("crew", u);
  };

  const handleSubmit = async () => {
    try {
      const data = new FormData();
      data.append("title",       form.title);
      data.append("description", form.description);
      data.append("genre",       form.genre);
      data.append("rating",      form.rating);
      data.append("releaseDate", form.releaseDate);
      data.append("trailerLink", form.trailerLink);
      data.append("language",    form.language);
      data.append("duration",    form.duration);
      data.append("certificate", form.certificate);
      data.append("status",      form.status);
      data.append("ottPlatform", form.ottPlatform);
      data.append("isInCinemas", form.isInCinemas);
      data.append("formats",     JSON.stringify(form.formats));
      data.append("cities",      JSON.stringify(form.cities));
      if (form.poster) data.append("poster", form.poster);

      data.append("cast",  JSON.stringify(form.cast.map((c) => ({ name: c.name, role: c.role, image: c.existingImage || null }))));
      form.cast.forEach((c) => { if (c.image) data.append("castImages", c.image); });

      data.append("crew",  JSON.stringify(form.crew.map((c) => ({ name: c.name, position: c.position, image: c.existingImage || null }))));
      form.crew.forEach((c) => { if (c.image) data.append("crewImages", c.image); });

      await axiosAdmin.put(`/admin/movies/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Movie updated!");
      window.location.href = "/admin/movies";
    } catch (err) {
      console.error("Update failed", err);
      toast.error("Failed to update movie");
    }
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 p-6 md:p-8" style={{ fontFamily: "'Outfit', sans-serif" }}>
          <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>
          <div className="h-7 w-52 bg-gray-200 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-36 bg-gray-100 rounded-lg animate-pulse mb-8" />
          <div className="h-12 w-full max-w-lg bg-gray-100 rounded-2xl animate-pulse mb-8" />
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-11 w-full bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div
        className="min-h-screen bg-gray-50 p-6 md:p-8"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

        {/* ── Page Header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(240,84,92,0.09)" }}
            >
              <Pencil size={15} style={{ color: "#f0545c" }} />
            </div>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight truncate">
              Edit:{" "}
              <span className="text-gray-500 font-semibold">
                {form.title || "Movie"}
              </span>
            </h1>
          </div>
          <p className="text-[13px] text-gray-400 mt-1 ml-[42px]">
            Update the details and save changes
          </p>
        </div>

        {/* ── Step Indicator ── */}
        <div className="flex items-center gap-0 mb-8 bg-white border border-gray-100 rounded-2xl shadow-sm p-2 w-fit">
          {STEPS.map((s, idx) => {
            const isActive = step === s.id;
            const isCompleted = step > s.id;
            return (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => isCompleted && setStep(s.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all"
                  style={
                    isActive
                      ? { background: "rgba(240,84,92,0.09)", color: "#f0545c" }
                      : isCompleted
                        ? {
                            background: "transparent",
                            color: "#10b981",
                            cursor: "pointer",
                          }
                        : {
                            background: "transparent",
                            color: "#9ca3af",
                            cursor: "default",
                          }
                  }
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border flex-shrink-0"
                    style={
                      isActive
                        ? {
                            background: "#f0545c",
                            color: "#fff",
                            borderColor: "#f0545c",
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
                              borderColor: "#e5e7eb",
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
                    style={{ background: "#e5e7eb" }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ══════════════ STEP 1 — Core Details ══════════════ */}
        {step === 1 && (
          <SectionCard title="Movie Details" icon={Film}>
            <div className="space-y-5">
              <InputField icon={Type} label="Title">
                <StyledInput
                  placeholder="e.g. Inception"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                />
              </InputField>

              <InputField icon={AlignLeft} label="Description">
                <StyledTextarea
                  placeholder="Brief synopsis of the movie..."
                  rows={4}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </InputField>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputField icon={Tag} label="Genre">
                  <StyledInput
                    placeholder="Action, Drama..."
                    value={form.genre}
                    onChange={(e) => set("genre", e.target.value)}
                  />
                </InputField>
                <InputField icon={Star} label="Rating (0–10)">
                  <StyledInput
                    type="number"
                    placeholder="8.5"
                    min="0"
                    max="10"
                    step="0.1"
                    value={form.rating}
                    onChange={(e) => set("rating", e.target.value)}
                  />
                </InputField>
                <InputField icon={Calendar} label="Release Date">
                  <StyledInput
                    type="date"
                    value={form.releaseDate}
                    onChange={(e) => set("releaseDate", e.target.value)}
                  />
                </InputField>
              </div>

              <InputField icon={Link2} label="Trailer URL">
                <StyledInput
                  placeholder="https://youtube.com/watch?v=..."
                  value={form.trailerLink}
                  onChange={(e) => set("trailerLink", e.target.value)}
                />
              </InputField>

              <InputField icon={Image} label="Movie Poster">
                <div className="flex items-start gap-4">
                  <label className="flex-1 flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer hover:border-[#f0545c] hover:bg-[rgba(240,84,92,0.03)] transition-all group">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                      style={{ background: "rgba(240,84,92,0.09)" }}
                    >
                      <Upload size={18} style={{ color: "#f0545c" }} />
                    </div>
                    <div className="text-center">
                      <p className="text-[13px] font-semibold text-gray-700">
                        {posterPreview
                          ? "Replace poster"
                          : "Click to upload poster"}
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
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors text-sm"
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
                nextLabel="Release Info"
              />
            </div>
          </SectionCard>
        )}

        {/* ══════════════ STEP 2 — Release Info ══════════════ */}
        {step === 2 && (
          <SectionCard title="Release Information" icon={Radio}>
            <div className="space-y-6">
              {/* Row 1: Language + Duration + Certificate */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputField icon={Globe} label="Language">
                  <StyledInput
                    placeholder="e.g. English, Hindi"
                    value={form.language}
                    onChange={(e) => set("language", e.target.value)}
                  />
                </InputField>
                <InputField icon={Clock} label="Duration (minutes)">
                  <StyledInput
                    type="number"
                    placeholder="e.g. 148"
                    min="1"
                    value={form.duration}
                    onChange={(e) => set("duration", e.target.value)}
                  />
                </InputField>
                <InputField icon={Shield} label="Certificate">
                  <StyledSelect
                    value={form.certificate}
                    onChange={(e) => set("certificate", e.target.value)}
                  >
                    <option value="">Select certificate</option>
                    {CERTIFICATE_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </StyledSelect>
                </InputField>
              </div>

              {/* Row 2: Status + OTT Platform */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField icon={Radio} label="Status">
                  <StyledSelect
                    value={form.status}
                    onChange={(e) => set("status", e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </StyledSelect>
                </InputField>
                <InputField icon={MonitorPlay} label="OTT Platform">
                  <StyledInput
                    placeholder="e.g. Netflix, Prime Video"
                    value={form.ottPlatform}
                    onChange={(e) => set("ottPlatform", e.target.value)}
                    disabled={form.status !== "streaming"}
                    className={
                      form.status !== "streaming"
                        ? "opacity-40 cursor-not-allowed"
                        : ""
                    }
                  />
                </InputField>
              </div>

              {form.status !== "streaming" && (
                <p className="text-[12px] text-gray-400 -mt-3 flex items-center gap-1.5">
                  <MonitorPlay size={11} />
                  OTT Platform is only applicable when status is{" "}
                  <strong>Streaming</strong>
                </p>
              )}

              {/* In Cinemas Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/60">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(240,84,92,0.09)" }}
                  >
                    <Tv size={15} style={{ color: "#f0545c" }} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">
                      Currently in Cinemas
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Mark if the movie is playing in theatres right now
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => set("isInCinemas", !form.isInCinemas)}
                  className="relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0"
                  style={{
                    background: form.isInCinemas ? "#f0545c" : "#d1d5db",
                  }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
                    style={{
                      transform: form.isInCinemas
                        ? "translateX(20px)"
                        : "translateX(0)",
                    }}
                  />
                </button>
              </div>

              {/* Formats */}
              <InputField icon={LayoutGrid} label="Available Formats">
                <div className="flex flex-wrap gap-2 mt-1">
                  {FORMAT_OPTIONS.map((fmt) => (
                    <ToggleChip
                      key={fmt}
                      label={fmt}
                      active={form.formats.includes(fmt)}
                      onClick={() => toggleFormat(fmt)}
                    />
                  ))}
                </div>
                {form.formats.length === 0 && (
                  <p className="text-[11px] text-gray-400 mt-2">
                    Select one or more formats available for this movie
                  </p>
                )}
              </InputField>

              <InputField icon={MapPin} label="Available Cities">
                {form.cities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.cities.map((city, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1 rounded-lg border"
                        style={{
                          background: "rgba(240,84,92,0.08)",
                          color: "#f0545c",
                          borderColor: "rgba(240,84,92,0.25)",
                        }}
                      >
                        {city}
                        <button
                          type="button"
                          onClick={() =>
                            set(
                              "cities",
                              form.cities.filter((_, idx) => idx !== i),
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
                  placeholder='Type a city and press Enter or ","'
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      const val = e.target.value.trim().replace(/,$/, "");
                      if (val && !form.cities.includes(val)) {
                        set("cities", [...form.cities, val]);
                      }
                      e.target.value = "";
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim().replace(/,$/, "");
                    if (val && !form.cities.includes(val)) {
                      set("cities", [...form.cities, val]);
                      e.target.value = "";
                    }
                  }}
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Press{" "}
                  <kbd className="px-1 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px]">
                    Enter
                  </kbd>{" "}
                  or{" "}
                  <kbd className="px-1 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px]">
                    ,
                  </kbd>{" "}
                  after each city
                </p>
              </InputField>

              <NavButtons
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
                nextLabel="Cast Members"
              />
            </div>
          </SectionCard>
        )}

        {/* ══════════════ STEP 3 — Cast ══════════════ */}
        {step === 3 && (
          <SectionCard title="Cast Members" icon={Users}>
            <div className="space-y-3">
              {form.cast.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <Users size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-[14px] font-semibold">No cast members</p>
                  <p className="text-[12px] mt-0.5">
                    Click "Add Cast Member" to add one
                  </p>
                </div>
              )}
              {form.cast.map((c, i) => (
                <PersonCard
                  key={i}
                  person={c}
                  index={i}
                  onUpdate={updateCast}
                  onRemove={removeCast}
                  onImage={handleCastImage}
                  roleLabel="Role"
                />
              ))}
              <button
                onClick={addCast}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold border-2 border-dashed border-gray-200 text-gray-500 hover:border-[#f0545c] hover:text-[#f0545c] hover:bg-[rgba(240,84,92,0.03)] transition-all w-full justify-center mt-2"
              >
                <Plus size={15} /> Add Cast Member
              </button>
              <NavButtons
                onBack={() => setStep(2)}
                onNext={() => setStep(4)}
                nextLabel="Crew Members"
              />
            </div>
          </SectionCard>
        )}

        {/* ══════════════ STEP 4 — Crew ══════════════ */}
        {step === 4 && (
          <SectionCard title="Crew Members" icon={UserCog}>
            <div className="space-y-3">
              {form.crew.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <UserCog size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-[14px] font-semibold">No crew members</p>
                  <p className="text-[12px] mt-0.5">
                    Click "Add Crew Member" to add one
                  </p>
                </div>
              )}
              {form.crew.map((c, i) => (
                <PersonCard
                  key={i}
                  person={c}
                  index={i}
                  onUpdate={updateCrew}
                  onRemove={removeCrew}
                  onImage={handleCrewImage}
                  roleLabel="Position"
                />
              ))}
              <button
                onClick={addCrew}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold border-2 border-dashed border-gray-200 text-gray-500 hover:border-[#f0545c] hover:text-[#f0545c] hover:bg-[rgba(240,84,92,0.03)] transition-all w-full justify-center mt-2"
              >
                <Plus size={15} /> Add Crew Member
              </button>
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
            {/* Movie Details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(240,84,92,0.09)" }}
                >
                  <Clapperboard size={16} style={{ color: "#f0545c" }} />
                </div>
                <h3 className="text-[15px] font-bold text-gray-900">
                  Movie Details
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
                    {form.genre && (
                      <span
                        className="text-[11px] font-semibold px-3 py-1 rounded-full border"
                        style={{
                          background: "rgba(99,102,241,0.08)",
                          color: "#6366f1",
                          borderColor: "rgba(99,102,241,0.2)",
                        }}
                      >
                        {form.genre}
                      </span>
                    )}
                    {form.rating && (
                      <span
                        className="text-[11px] font-semibold px-3 py-1 rounded-full border flex items-center gap-1"
                        style={{
                          background: "rgba(245,158,11,0.08)",
                          color: "#b45309",
                          borderColor: "rgba(245,158,11,0.2)",
                        }}
                      >
                        <Star size={10} /> {form.rating}/10
                      </span>
                    )}
                    {form.releaseDate && (
                      <span
                        className="text-[11px] font-semibold px-3 py-1 rounded-full border flex items-center gap-1"
                        style={{
                          background: "rgba(16,185,129,0.08)",
                          color: "#059669",
                          borderColor: "rgba(16,185,129,0.2)",
                        }}
                      >
                        <Calendar size={10} /> {form.releaseDate}
                      </span>
                    )}
                    {form.status && <StatusBadge status={form.status} />}
                  </div>
                </div>
              </div>
            </div>

            {/* Release Info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(240,84,92,0.09)" }}
                >
                  <Radio size={16} style={{ color: "#f0545c" }} />
                </div>
                <h3 className="text-[15px] font-bold text-gray-900">
                  Release Information
                </h3>
              </div>
              <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-5">
                {[
                  {
                    icon: Globe,
                    label: "Language",
                    value: form.language || "—",
                  },
                  {
                    icon: Clock,
                    label: "Duration",
                    value: form.duration ? `${form.duration} min` : "—",
                  },
                  {
                    icon: Shield,
                    label: "Certificate",
                    value: form.certificate || "—",
                  },
                  {
                    icon: Tv,
                    label: "In Cinemas",
                    value: form.isInCinemas ? "Yes" : "No",
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
                {form.status === "streaming" && form.ottPlatform && (
                  <div className="space-y-1 col-span-2">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <MonitorPlay size={10} /> OTT Platform
                    </p>
                    <p className="text-[14px] font-semibold text-gray-900">
                      {form.ottPlatform}
                    </p>
                  </div>
                )}
                {form.formats.length > 0 && (
                  <div className="space-y-1.5 col-span-2 sm:col-span-4">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <LayoutGrid size={10} /> Formats
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.formats.map((f) => (
                        <ToggleChip key={f} label={f} active />
                      ))}
                    </div>
                  </div>
                )}
                {form.cities.length > 0 && (
                  <div className="space-y-1.5 col-span-2 sm:col-span-4">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <MapPin size={10} /> Cities
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.cities.map((c) => (
                        <ToggleChip key={c} label={c} active />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cast + Crew */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { label: "Cast", icon: Users, list: form.cast, sub: "role" },
                {
                  label: "Crew",
                  icon: UserCog,
                  list: form.crew,
                  sub: "position",
                },
              ].map(({ label, icon: Icon, list, sub }) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(240,84,92,0.09)" }}
                      >
                        <Icon size={16} style={{ color: "#f0545c" }} />
                      </div>
                      <h3 className="text-[15px] font-bold text-gray-900">
                        {label}
                      </h3>
                    </div>
                    <span
                      className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        background: "rgba(240,84,92,0.08)",
                        color: "#f0545c",
                      }}
                    >
                      {list.length}
                    </span>
                  </div>
                  <div className="p-4 space-y-2.5 max-h-64 overflow-y-auto">
                    {list.length === 0 ? (
                      <p className="text-[13px] text-gray-400 text-center py-6">
                        No {label.toLowerCase()} added
                      </p>
                    ) : (
                      list.map((c, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50"
                        >
                          <div className="w-9 h-9 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0 bg-white flex items-center justify-center">
                            {c.preview ? (
                              <img
                                src={c.preview}
                                className="w-full h-full object-cover"
                                alt=""
                              />
                            ) : (
                              <span className="text-[11px] font-bold text-gray-400">
                                {c.name?.slice(0, 2).toUpperCase() || "?"}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-gray-900 truncate">
                              {c.name || "—"}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">
                              {c[sub] || "—"}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Trailer */}
            {form.trailerLink && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(240,84,92,0.09)" }}
                  >
                    <Clapperboard size={16} style={{ color: "#f0545c" }} />
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
                      style={{ background: "#f0545c" }}
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
              submitLabel="Update Movie"
            />
          </div>
        )}

        {/* ── Trailer Modal ── */}
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
