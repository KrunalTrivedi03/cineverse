import { useState } from "react";
import { Check, Loader2, MapPin, Search, X } from "lucide-react";
import CityLogo from "./CityLogo";
import Dialog from "./Dialog";

export default function CityPicker({ cities, selectedCity, loading, error, onRetry, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const filtered = cities.filter((city) => city.name.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <Dialog variant="city" label="Select your city" onDismiss={onClose}>
      <header className="now-picker-header">
        <div className="now-picker-title">
          <span className="now-picker-symbol"><MapPin size={22} aria-hidden="true" /></span>
          <div>
            <h2>Choose your city</h2>
            <p>Find movies and experiences near you.</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="now-icon-control" aria-label="Close city picker"><X size={19} /></button>
        <div className="now-picker-input">
          <Search size={19} aria-hidden="true" />
          <input type="search" aria-label="Search cities" placeholder="Search cities" value={query} onChange={(event) => setQuery(event.target.value)} data-dialog-autofocus onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); onClose(); } }} />
          {query && <button type="button" className="now-icon-control" aria-label="Clear city search" onClick={() => setQuery("")}><X size={16} /></button>}
        </div>
      </header>
      <div className="now-picker-body">
        {loading ? <p className="now-picker-state" role="status"><Loader2 size={20} className="animate-spin" /> Loading cities…</p>
          : error ? <div className="now-picker-state" role="status"><p>Couldn’t load cities.</p><button type="button" className="now-secondary" onClick={onRetry}>Try again</button></div>
          : !filtered.length ? <p className="now-picker-state" role="status">{query.trim() ? "No matching cities." : "No cities are available yet."}</p>
          : (
            <ul className="now-city-grid">
              {filtered.map((city) => {
                const active = selectedCity === city.name;
                return (
                  <li key={city._id}>
                    <button type="button" className="now-city-tile" aria-pressed={active} onClick={() => onSelect(city)}>
                      <CityLogo src={city.logoUrl} />
                      <span>{city.name}</span>
                      {active && <Check size={15} className="now-city-check" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
      </div>
    </Dialog>
  );
}
