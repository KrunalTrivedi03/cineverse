import { useEffect, useState } from "react";
import { Check, Clapperboard, Loader2, Plus, Search, TrendingUp, X } from "lucide-react";
import Dialog from "./Dialog";

const KEYWORDS = ["Action", "Comedy", "Horror", "Romance", "Sci-Fi", "Thriller", "Drama"];
const TRENDING = ["Dhurandhar", "Pushpa 2", "Singham Again", "Devara"];
const INITIAL = { term: "", items: [], error: "" };

export default function EntertainmentSearch({ canSave, onClose }) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState(INITIAL);
  const [retry, setRetry] = useState(0);
  const [added, setAdded] = useState(() => {
    try {
      return new Set((JSON.parse(localStorage.getItem("watchlist") || "[]") || []).map((item) => item.imdbID));
    } catch {
      return new Set();
    }
  });
  const [saveError, setSaveError] = useState("");
  const term = query.trim();

  useEffect(() => {
    if (!term) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ apikey: import.meta.env.VITE_OMDB_API_KEY || "", s: term });
        const result = await fetch(`https://www.omdbapi.com/?${params}`, { signal: controller.signal });
        if (!result.ok) throw new Error("Search request failed");
        const data = await result.json();
        if (controller.signal.aborted) return;
        const noResults = data.Error === "Movie not found!" || data.Error === "Too many results.";
        setResponse({
          term,
          items: data.Search || [],
          error: data.Response === "False" && !noResults ? "Search is unavailable. Try again." : "",
        });
      } catch {
        if (!controller.signal.aborted) setResponse({ term, items: [], error: "Couldn’t complete the search. Try again." });
      }
    }, 260);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, retry]);

  function save(movie) {
    try {
      const list = JSON.parse(localStorage.getItem("watchlist") || "[]");
      if (!list.some((entry) => entry.imdbID === movie.imdbID)) {
        localStorage.setItem("watchlist", JSON.stringify([...list, movie]));
      }
      setAdded((current) => new Set(current).add(movie.imdbID));
      setSaveError("");
    } catch {
      setSaveError("Couldn’t save to your watchlist.");
    }
  }

  const searching = !!term && response.term !== term;
  return (
    <Dialog variant="search" label="Search entertainment" onDismiss={onClose}>
      <header className="now-picker-header">
        <div className="now-picker-title">
          <span className="now-picker-symbol"><Search size={22} aria-hidden="true" /></span>
          <div><h2>Search NOW</h2><p>Find a movie or series by title.</p></div>
        </div>
        <button type="button" className="now-icon-control" onClick={onClose} aria-label="Close search"><X size={19} /></button>
        <div className="now-picker-input">
          <Search size={19} aria-hidden="true" />
          <input data-dialog-autofocus type="search" aria-label="Search movies and shows" placeholder="Search movies and shows" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); onClose(); } }} />
          {query && <button type="button" className="now-icon-control" onClick={(event) => { event.currentTarget.previousElementSibling.focus(); setQuery(""); }} aria-label="Clear search"><X size={16} /></button>}
        </div>
      </header>
      <div className="now-picker-body">
        {!term ? (
          <div className="now-search-start">
            <section>
              <h3>Trending searches</h3>
              <ul className="now-search-trends">
                {TRENDING.map((title) => <li key={title}><button type="button" onClick={() => setQuery(title)}><TrendingUp size={16} aria-hidden="true" />{title}</button></li>)}
              </ul>
            </section>
            <section>
              <h3>Try a keyword</h3>
              <div className="now-search-keywords">
                {KEYWORDS.map((word) => <button type="button" key={word} onClick={() => setQuery(word)}>{word}</button>)}
              </div>
            </section>
          </div>
        ) : searching ? <p className="now-picker-state" role="status"><Loader2 size={21} className="animate-spin" /> Searching…</p>
          : response.error ? <div className="now-picker-state" role="status"><p>{response.error}</p><button className="now-secondary" type="button" onClick={() => { setResponse(INITIAL); setRetry((value) => value + 1); }}>Try again</button></div>
          : !response.items.length ? <div className="now-picker-state" role="status"><Clapperboard size={27} /><p>No results for “{term}”</p><p>Try a different title or keyword.</p></div>
          : (
            <>
              <p className="now-search-count" role="status">{response.items.length} {response.items.length === 1 ? "result" : "results"}</p>
              {saveError && <p role="alert" className="mb-3 text-sm text-red-700">{saveError}</p>}
              <ul className="now-search-results">
                {response.items.map((movie) => {
                  const saved = added.has(movie.imdbID);
                  return (
                    <li key={movie.imdbID}>
                      <div className="now-search-poster">
                        {movie.Poster && movie.Poster !== "N/A"
                          ? <img src={movie.Poster} alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} />
                          : null}
                        <Clapperboard size={18} aria-hidden="true" />
                      </div>
                      <div className="now-search-result-copy">
                        <p>{movie.Title}</p><span>{[movie.Year, movie.Type].filter(Boolean).join(" · ")}</span>
                      </div>
                      {canSave && (
                        <button type="button" className="now-search-save" onClick={() => save(movie)} disabled={saved} aria-label={saved ? `${movie.Title} is on your watchlist` : `Add ${movie.Title} to watchlist`}>
                          {saved ? <Check size={17} /> : <Plus size={17} />}<span>{saved ? "Saved" : "Watchlist"}</span>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
      </div>
    </Dialog>
  );
}
