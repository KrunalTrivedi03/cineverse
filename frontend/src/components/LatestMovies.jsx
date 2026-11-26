import HomeMovieCard from "./HomeMovieCard";
import DiscoveryHeading from "./DiscoveryHeading";
import { useEffect, useState, useRef } from "react";
import api from "../api/axiosInstance";
import { ChevronRight, ChevronLeft, Tv } from "lucide-react";


export default function LatestMovies() {
  const [movies,   setMovies]   = useState([]);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(false);
  const sliderRef = useRef(null);

  const [city, setCity] = useState(
  () => localStorage.getItem("selectedCity") || "Mumbai"
);

useEffect(() => {
  const handler = () => {
    const newCity = localStorage.getItem("selectedCity") || "Mumbai";
    setCity(newCity);
  };
  window.addEventListener("cityChanged", handler);
  return () => window.removeEventListener("cityChanged", handler);
}, []);

useEffect(() => {
  api.get("/movies", { params: { city } })
    .then((res) => {
      const latest = res.data.filter((m) => m.status === "streaming" || (m.status === "released" && m.isInCinemas)).slice(0, 10);
      setMovies(latest);
    })
    .catch(console.error);
}, [city]);

  const checkScroll = () => {
    const el = sliderRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [movies]);

  const scroll = (dir) =>
    sliderRef.current?.scrollBy({
      left: dir === "left" ? -880 : 880,
      behavior: "smooth",
    });

  return (
    <section className="w-full px-6 md:px-14 py-10 bg-white">
      <DiscoveryHeading title="Movies for you" detail={`Playing and streaming in ${city}`} to="/now-showing" />

      {movies.length === 0 && (
        <div className="now-rail-empty">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: "rgba(16,101,121,0.07)" }}>
            <Tv size={26} style={{ color: "#106579", opacity: 0.4 }} />
          </div>
          <p className="text-[15px] font-bold text-gray-900">No movies in {city}</p>
          <p className="text-[12px] text-gray-500 mt-1">Try selecting a different city from the navbar</p>
        </div>
      )}

      {movies.length > 0 && (
        <div className="relative">
          {canLeft && (
            <ArrowBtn dir="left" onClick={() => scroll("left")} style={{ left: -16, top: "45%" }} />
          )}
          <div
            ref={sliderRef}
            className="now-media-rail flex gap-4 overflow-x-auto px-1 pt-1 pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {movies.map((movie) => (
              <HomeMovieCard key={movie._id} movie={movie} />
            ))}
          </div>
          {canRight && (
            <ArrowBtn dir="right" onClick={() => scroll("right")} style={{ right: -16, top: "45%" }} />
          )}
        </div>
      )}
    </section>
  );
}

function ArrowBtn({ dir, onClick, style }) {
  return (
    <button
      aria-label={dir === "left" ? "Previous movies" : "Next movies"}
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      className="absolute z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:border-gray-400 hover:shadow-lg transition-all"
      style={{ ...style, transform: "translateY(-50%)" }}
    >
      {dir === "left" ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
    </button>
  );
}


