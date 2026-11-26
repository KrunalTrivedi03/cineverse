import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useLocation } from "react-router-dom";
import EntertainmentSearch from "../components/EntertainmentSearch";
import { SearchContext } from "./globalSearchContext";

export function GlobalSearchProvider({ children }) {
  const [scope, setScope] = useState("all");
  const [activeSearch, setActiveSearch] = useState(null);
  const { key } = useLocation();
  const source = activeSearch?.key === key ? activeSearch.source : null;

  useEffect(() => {
    function onKeyDown(event) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k" || document.querySelector("dialog[open]")) return;
      event.preventDefault();
      const input = document.querySelector(".now-header-search input[type=search]");
      if (input) input.focus();
      setActiveSearch({ key, source: input ? "header" : "fallback" });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [key]);

  return (
    <SearchContext.Provider value={{
      scope,
      setScope,
      source,
      openSearch: (next) => setActiveSearch({ key, source: next }),
      closeSearch: () => setActiveSearch(null),
    }}>
      {children}
      <button type="button" className="now-global-search-fallback" aria-label="Open Search NOW" aria-expanded={source === "fallback"} onClick={() => setActiveSearch({ key, source: "fallback" })}>
        <Search size={19} aria-hidden="true" />
      </button>
      {source === "fallback" && <div className="now-global-search-fallback-panel"><EntertainmentSearch source="fallback" /></div>}
    </SearchContext.Provider>
  );
}
