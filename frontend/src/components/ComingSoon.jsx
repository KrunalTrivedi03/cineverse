import HomeMovieCard from "./HomeMovieCard";
import DiscoveryHeading from "./DiscoveryHeading";
import { useRef, useEffect, useState, useCallback } from "react";
import { ChevronRight, ChevronLeft, CalendarDays, AlertCircle } from "lucide-react";

export default function ComingSoon() {
  const sliderRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUpcoming = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("jwt") ||
        "";

      const res = await fetch(import.meta.env.VITE_API_URL + "/api/movies?status=upcoming", {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      setMovies(data.filter((m) => m.status === "upcoming"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpcoming();
  }, [fetchUpcoming]);

  // ── Scroll arrows ────────────────────────────────────────────────
  const check = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    // Small delay so DOM has rendered the cards
    const timer = setTimeout(check, 100);
    el.addEventListener("scroll", check);
    window.addEventListener("resize", check);
    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [movies, check]);

  const scroll = (dir) =>
    sliderRef.current?.scrollBy({
      left: dir === "left" ? -880 : 880,
      behavior: "smooth",
    });

  const SectionWrapper = ({ children, showSeeAll = false }) => (
    <section className="w-full px-6 md:px-14 py-10 bg-now-canvas border-t border-gray-100">
      <DiscoveryHeading title="Coming soon to cinemas"
        detail={movies.length ? movies.length + (movies.length === 1 ? " release on the way" : " releases on the way") : undefined}
        to={showSeeAll ? "/coming-soon" : undefined} />
      {children}
    </section>
  );

  if (loading) {
    return (
      <SectionWrapper>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[250px] animate-pulse">
              <div
                className="rounded-xl bg-gray-200"
                style={{ aspectRatio: "4/7" }}
              />
              <div className="mt-2.5 space-y-2">
                <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </SectionWrapper>
    );
  }

  // ── Error ────────────────────────────────────────────────────────
  if (error) {
    return (
      <SectionWrapper>
        <div className="flex flex-col items-center justify-center h-40 gap-3">
          <AlertCircle size={28} className="text-red-300" />
          <p className="text-[13px] text-gray-500">Something went wrong loading upcoming movies.</p>
          <button
            onClick={fetchUpcoming}
            className="text-[12px] font-semibold px-4 py-1.5 rounded-lg border transition-all"
            style={{
              borderColor: "rgba(16,101,121,0.3)",
              color: "#106579",
              background: "rgba(16,101,121,0.05)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(16,101,121,0.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(16,101,121,0.05)")}
          >
            Try Again
          </button>
        </div>
      </SectionWrapper>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────
  if (!movies.length) {
    return (
      <SectionWrapper>
        <div className="flex flex-col items-center justify-center h-40 gap-2 rounded-2xl border border-dashed border-gray-200 bg-white/60">
          <CalendarDays size={28} className="text-gray-300" />
          <p className="text-[13px] text-gray-400">No upcoming movies right now. Check back soon!</p>
        </div>
      </SectionWrapper>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────
  return (
    <SectionWrapper showSeeAll>
      <div className="relative">
        {canLeft && (
          <ArrowBtn dir="left" onClick={() => scroll("left")} style={{ left: -16, top: "42%" }} />
        )}

        <div
          ref={sliderRef}
          className="now-media-rail flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {movies.map((movie) => (
            <HomeMovieCard key={movie._id} movie={movie} upcoming />
          ))}
        </div>

        {canRight && (
          <ArrowBtn dir="right" onClick={() => scroll("right")} style={{ right: -16, top: "42%" }} />
        )}
      </div>
    </SectionWrapper>
  );
}

function ArrowBtn({ dir, onClick, style }) {
  return (
    <button
      aria-label={dir === "left" ? "Previous releases" : "Next releases"}
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      className="absolute z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:border-gray-400 hover:shadow-lg transition-all"
      style={{ ...style, transform: "translateY(-50%)" }}
    >
      {dir === "left" ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
    </button>
  );
}