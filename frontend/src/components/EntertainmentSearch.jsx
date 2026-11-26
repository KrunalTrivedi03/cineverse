import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, Compass, Film, Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/axiosInstance";
import { movieImage } from "../utils/movieImage";
import { IMG } from "../utils/eventHelpers";
import { useGlobalSearch } from "../context/globalSearchContext";
import SearchScope, { SEARCH_SCOPES } from "./SearchScope";

const FIELDS = {
  all: [["location", "City or district (local listings)"]],
  movies: [
    ["location", "City"], ["genre", "Genre"], ["language", "Language"],
    ["type", "Availability", ["released", "streaming", "upcoming"]],
  ],
  shows: [
    ["genre", "Genre"], ["artist", "Cast or performer"],
    ["type", "Show type", ["trending-series", "web-original"]],
  ],
  play: [
    ["location", "City or district"], ["sport", "Sport"], ["venue", "Venue"],
    ["team", "Team"], ["player", "Player"], ["competition", "League or tournament"],
    ["from", "From date", "date"], ["to", "To date", "date"],
  ],
  events: [
    ["location", "City or district"], ["category", "Category", ["Music", "Nightlife", "Comedy Shows", "Expos", "Performances", "Workshops", "Sports"]],
    ["venue", "Venue"], ["artist", "Artist or performer"], ["type", "Event type"],
    ["from", "From date", "date"], ["to", "To date", "date"],
  ],
};

const ROUTES = { movie: "/movie/", show: "/web-shows/", venue: "/play/venues/", event: "/events/", artist: "/artists/" };
const KINDS = { movie: "Movie", show: "Show", venue: "Play venue", sport: "Sport", event: "Event", artist: "Artist" };

function Result({ result, onClose }) {
  const target = result.kind === "sport"
    ? "/play/venues?" + new URLSearchParams({ activity: result._id, activityName: result.title })
    : ROUTES[result.kind] && ROUTES[result.kind] + result._id;
  if (!target) return null;
  const parsed = result.date && typeof result.date === "string" ? new Date(result.date) : null;
  const details = [KINDS[result.kind], result.subtitle, parsed && Number.isFinite(+parsed)
    ? parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }) : null].filter(Boolean);
  return (
    <li>
      <Link className="now-global-result" to={target} onClick={onClose}>
        <span className="now-search-poster">
          <Film size={17} aria-hidden="true" />
          {result.image && <img src={result.kind === "movie" ? movieImage(result.image) : IMG(result.image)} alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} />}
        </span>
        <span className="now-search-result-copy"><strong>{result.title}</strong><span>{details.join(" · ")}</span></span>
        <ArrowUpRight size={17} aria-hidden="true" />
      </Link>
    </li>
  );
}

function buildSearchParams(scope, sort, query, filters, coords) {
  const params = new URLSearchParams({ scope, sort, q: query.trim() });
  for (const [key, value] of Object.entries(filters)) {
    if (value.trim()) params.set(key, value.trim());
  }
  if (sort === "distance" && coords) {
    params.set("lat", coords.latitude);
    params.set("lng", coords.longitude);
  }
  return params.toString();
}

export default function EntertainmentSearch({ source }) {
  const { scope, setScope, source: activeSource, openSearch, closeSearch } = useGlobalSearch();
  const open = activeSource === source;
  const [scopeOpen, setScopeOpen] = useState(false);
  const root = useRef(null);
  const panelId = useId();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState("relevance");
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [response, setResponse] = useState(null);
  const [retry, setRetry] = useState(0);
  const input = useRef(null);
  const locationRequest = useRef(0);

  const request = buildSearchParams(scope, sort, query, filters, coords);
  const activeFilters = Object.values(filters).filter((value) => value.trim()).length;
  const loading = response?.key !== request || response?.retry !== retry;
  const sections = loading ? [] : response?.sections || [];

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api.get("/search?" + request, { signal: controller.signal })
        .then(({ data }) => {
          if (!controller.signal.aborted) setResponse({ key: request, retry, sections: data.sections });
        })
        .catch((error) => {
          if (!controller.signal.aborted) {
            setResponse({ key: request, retry, error: error.response?.status === 400
              ? error.response.data.message : "Search is temporarily unavailable." });
          }
        });
    }, 220);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [open, request, retry]);

  useEffect(() => {
    if (source === "fallback") input.current?.focus();
  }, [source]);

  useEffect(() => {
    if (!open && !scopeOpen) return;
    function outside(event) {
      if (root.current?.contains(event.target)) return;
      setScopeOpen(false);
      if (open && source !== "mobile") closeSearch();
    }
    function escape(event) {
      if (event.key !== "Escape" || document.querySelector("dialog[open]")) return;
      event.preventDefault();
      if (source === "header" && root.current?.contains(document.activeElement)) input.current?.focus();
      setScopeOpen(false);
      if (open) closeSearch();
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open, scopeOpen, closeSearch, source]);

  function dismiss() {
    setScopeOpen(false);
    closeSearch();
  }

  function resetFilters() {
    locationRequest.current += 1;
    setFilters({});
    setSort("relevance");
    setLocating(false);
    setLocationError("");
  }

  function changeScope(next) {
    resetFilters();
    setFiltersOpen(false);
    setScope(next);
    setScopeOpen(false);
    openSearch(source);
  }

  function changeSort(next) {
    locationRequest.current += 1;
    setLocationError("");
    setLocating(false);
    if (next !== "distance" || coords) {
      setSort(next);
      return;
    }
    if (!navigator.geolocation) {
      setLocationError("Your browser does not support location.");
      return;
    }
    const attempt = locationRequest.current;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(({ coords: position }) => {
      if (attempt !== locationRequest.current) return;
      setCoords(position);
      setSort("distance");
      setLocating(false);
    }, () => {
      if (attempt !== locationRequest.current) return;
      setLocationError("Allow location access to sort venues by distance.");
      setLocating(false);
    }, { timeout: 8000, maximumAge: 60000 });
  }

  return (
    <div className="now-global-search" ref={root} role="search" aria-label="Global search">
      <div className="now-global-search-bar" data-open={open}>
        <SearchScope scope={scope} open={scopeOpen} onToggle={setScopeOpen} onChange={changeScope} />
        <div className="now-global-search-input">
          <Search size={18} aria-hidden="true" />
          <input ref={input} type="search" aria-label="Search NOW" aria-expanded={open} aria-controls={panelId}
            placeholder={source === "mobile" ? "Titles, people and venues" : "Search titles, people and venues"} value={query} maxLength={100}
            onFocus={() => { setScopeOpen(false); openSearch(source); }}
            onClick={() => openSearch(source)}
            onChange={(event) => { setQuery(event.target.value); openSearch(source); }} />
          {query && <button type="button" className="now-icon-control" aria-label="Clear search query" onClick={() => { setQuery(""); input.current?.focus(); }}><X size={16} /></button>}
        </div>
      </div>
      <div id={panelId} className="now-global-search-panel" data-open={open} inert={!open}>
        <div className="now-global-search-panel-inner" tabIndex={0} role="region" aria-label="Search results">
          <div className="now-global-search-header">
            <div className="now-global-search-toolbar">
              {FIELDS[scope].length > 0 && (
                <button type="button" aria-expanded={filtersOpen} className="now-secondary" onClick={() => setFiltersOpen((open) => !open)}>
                  <SlidersHorizontal size={16} /> Filters{activeFilters ? ` (${activeFilters})` : ""}
                </button>
              )}
              <label className="now-search-sort">Sort
                <select value={sort} onChange={(event) => changeSort(event.target.value)} disabled={locating}>
                  <option value="relevance">Relevance</option>
                  <option value="date">Date</option>
                  {scope !== "play" && <option value="popular">Popularity</option>}
                  {scope === "play" && <option value="distance">Nearest venues</option>}
                </select>
              </label>
              {(activeFilters > 0 || sort !== "relevance") && <button type="button" className="now-search-reset" onClick={resetFilters}>Clear filters</button>}
            </div>
            {locating && <p role="status" className="now-search-notice"><Compass size={15} /> Getting your location…</p>}
            {locationError && <p role="status" className="now-search-notice">{locationError}</p>}
          </div>
          <div className="now-picker-body now-global-search-body">
            {filtersOpen && (
              <div className="now-search-filter-grid" aria-label="Search filters">
                {FIELDS[scope].map(([key, label, type]) => (
                  <label key={key}>{label}
                    {Array.isArray(type) ? (
                      <select value={filters[key] || ""} onChange={(event) => setFilters({ ...filters, [key]: event.target.value })}>
                        <option value="">Any</option>
                        {type.map((value) => <option key={value} value={value}>{value.replaceAll("-", " ")}</option>)}
                      </select>
                    ) : <input type={type || "text"} maxLength={100} value={filters[key] || ""} onChange={(event) => setFilters({ ...filters, [key]: event.target.value })} />}
                  </label>
                ))}
                {scope === "play" && <p className="now-search-notice">Team, player and competition filters match sports event listings.</p>}
              </div>
            )}
            {loading ? <p className="now-picker-state" role="status"><Loader2 size={21} className="animate-spin" /> Searching…</p>
              : response?.error ? <div className="now-picker-state" role="status"><p>{response.error}</p><button className="now-secondary" type="button" onClick={() => setRetry((value) => value + 1)}>Try again</button></div>
              : !sections.some(({ results }) => results.length) ? <div className="now-picker-state" role="status"><Search size={25} /><p>No matching results.</p><p>Try another search or clear your filters.</p></div>
              : sections.filter(({ results }) => results.length).map(({ scope: group, results }) => (
                <section key={group} className="now-global-results-section">
                  <h3>{SEARCH_SCOPES[group]}</h3>
                  <ul className="now-search-results">{results.map((result) => <Result key={result.kind + result._id} result={result} onClose={dismiss} />)}</ul>
                </section>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
