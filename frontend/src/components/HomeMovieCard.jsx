import { useState } from "react";
import { Film } from "lucide-react";
import { Link } from "react-router-dom";
import { movieImage } from "../utils/movieImage";

export default function HomeMovieCard({ movie, upcoming = false }) {
  const poster = movieImage(movie.poster);
  const [failedPoster, setFailedPoster] = useState(null);
  const languages = movie.languages?.length ? movie.languages.join(", ") : movie.language;
  const genre = Array.isArray(movie.genre) ? movie.genre.join(", ") : movie.genre;

  return (
    <Link to={`/movie/${movie._id}`} aria-label={movie.title}
      className="now-catalog-card now-media-card shrink-0 rounded-xl group focus-visible:outline-2 focus-visible:outline-[#106579]">
      <div className={`relative grid place-items-center overflow-hidden rounded-xl bg-gray-100 text-gray-400 ${upcoming ? "aspect-[4/7]" : "aspect-[2/3]"}`}>
        {poster && failedPoster !== poster ? (
          <img src={poster} alt="" loading="lazy" onError={() => setFailedPoster(poster)}
            className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none" />
        ) : <Film size={24} aria-hidden="true" />}
        {movie.certificate && (
          <span className="absolute left-2 top-2 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-bold text-white">
            {movie.certificate}
          </span>
        )}
      </div>
      <div className="px-0.5 pt-2">
        <h3 className="text-sm font-bold leading-tight text-gray-900 group-hover:text-now-accent">{movie.title}</h3>
        {(genre || languages) && <p className="mt-1 text-xs leading-snug text-gray-600">{[genre, languages].filter(Boolean).join(" · ")}</p>}
      </div>
    </Link>
  );
}
