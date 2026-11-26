import { useEffect, useState } from "react";
import axiosAdmin from "../../api/axiosAdmin";

export default function MovieCitySelect({ value, onChange }) {
  const [cities, setCities] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    axiosAdmin.get("/cities", { signal: controller.signal })
      .then(({ data }) => setCities([...new Set(data.map((city) => city.name))]))
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [attempt]);

  return (
    <div className="space-y-2">
      <select aria-label="Add a city" value="" disabled={!cities?.length}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus-visible:outline-2 focus-visible:outline-[#106579]"
        onChange={(event) => onChange([...value, event.target.value])}>
        <option value="" disabled>{failed ? "Cities unavailable" : !cities ? "Loading cities…" : cities.length ? "Add a city" : "No cities available"}</option>
        {cities?.map((city) => <option key={city} value={city} disabled={value.includes(city)}>{city}</option>)}
      </select>
      {failed && <button type="button" className="text-sm font-semibold text-[#106579] underline" onClick={() => { setFailed(false); setAttempt(attempt + 1); }}>Retry loading cities</button>}
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((city) => (
            <li key={city} className="flex items-center gap-2 rounded-full bg-cyan-50 ps-3 text-sm text-[#125467]">
              {city}
              <button type="button" aria-label={`Remove ${city}`} onClick={() => onChange(value.filter((name) => name !== city))}
                className="min-h-9 min-w-9 rounded-full hover:bg-cyan-100">×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
