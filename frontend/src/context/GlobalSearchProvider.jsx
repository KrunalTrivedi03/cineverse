import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { matchPath, useLocation } from "react-router-dom";
import EntertainmentSearch from "../components/EntertainmentSearch";
import Dialog from "../components/Dialog";
import { SearchContext } from "./globalSearchContext";

export function GlobalSearchProvider({ children }) {
  const [scope, setScope] = useState("all");
  const [activeSearch, setActiveSearch] = useState(null);
  const { key, pathname } = useLocation();
  const isAdminRoute = Boolean(matchPath("/admin/*", pathname));
  const source = !isAdminRoute && activeSearch?.key === key ? activeSearch.source : null;

  useEffect(() => {
    if (isAdminRoute) return;
    const mobileViewport = window.matchMedia("(max-width: 639px)");
    function closeMobileSearch(event) {
      if (!event.matches) setActiveSearch((current) => current?.source === "mobile" ? null : current);
    }
    function onKeyDown(event) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k" || document.querySelector("dialog[open]")) return;
      event.preventDefault();
      const mobileTrigger = document.querySelector(".now-nav-search-mobile");
      if (mobileViewport.matches && mobileTrigger) {
        mobileTrigger.focus();
        setActiveSearch({ key, source: "mobile" });
        return;
      }
      const input = document.querySelector(".now-header-search input[type=search]");
      if (input) input.focus();
      setActiveSearch({ key, source: input ? "header" : "fallback" });
    }
    window.addEventListener("keydown", onKeyDown);
    mobileViewport.addEventListener("change", closeMobileSearch);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      mobileViewport.removeEventListener("change", closeMobileSearch);
    };
  }, [key, isAdminRoute]);

  const closeSearch = () => setActiveSearch(null);

  return (
    <SearchContext.Provider value={{
      scope,
      setScope,
      source,
      openSearch: (next) => setActiveSearch({ key, source: next }),
      closeSearch,
    }}>
      {children}
      {!isAdminRoute && (
        <button type="button" className="now-global-search-fallback" aria-label="Open Search NOW" aria-expanded={source === "fallback"} onClick={() => setActiveSearch({ key, source: "fallback" })}>
          <Search size={19} aria-hidden="true" />
        </button>
      )}
      {source === "fallback" && <div className="now-global-search-fallback-panel"><EntertainmentSearch source="fallback" /></div>}
      {source === "mobile" && (
        <Dialog label="Search NOW" variant="search" onDismiss={closeSearch}>
          <div className="now-mobile-search-heading">
            <h2>Search NOW</h2>
            <button type="button" className="now-icon-control" aria-label="Close search" onClick={closeSearch}>
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <EntertainmentSearch source="mobile" />
        </Dialog>
      )}
    </SearchContext.Provider>
  );
}
