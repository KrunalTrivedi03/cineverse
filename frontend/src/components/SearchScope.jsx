import { useEffect, useId, useRef } from "react";
import { Check, ChevronDown } from "lucide-react";

export const SEARCH_SCOPES = {
  all: "All",
  movies: "Movies",
  shows: "Shows",
  play: "Play",
  events: "Events",
};

const entries = Object.entries(SEARCH_SCOPES);

export default function SearchScope({ scope, open, onToggle, onChange }) {
  const id = useId();
  const trigger = useRef(null);
  const options = useRef(null);

  useEffect(() => {
    if (open) options.current?.querySelector('[aria-selected="true"]')?.focus();
  }, [open]);

  function onMenuKeyDown(event) {
    const buttons = [...options.current.querySelectorAll('[role="option"]')];
    const index = buttons.indexOf(document.activeElement);
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onToggle(false);
      trigger.current?.focus();
      return;
    }
    if (event.key === "Home" || event.key === "End" || event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
        : (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next]?.focus();
    }
  }

  return (
    <div className="now-search-scope">
      <button ref={trigger} type="button" className="now-search-scope-trigger" aria-label={`Search category: ${SEARCH_SCOPES[scope]}`}
        aria-haspopup="listbox" aria-expanded={open} aria-controls={id} onClick={() => onToggle(!open)}
        onKeyDown={(event) => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); onToggle(true); } }}>
        <span>{SEARCH_SCOPES[scope]}</span><ChevronDown size={15} aria-hidden="true" />
      </button>
      <div id={id} ref={options} className="now-search-scope-menu" role="listbox" aria-label="Search category"
        data-open={open} inert={!open} onKeyDown={onMenuKeyDown}
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== trigger.current) onToggle(false); }}>
        {entries.map(([value, label]) => (
          <button key={value} type="button" role="option" aria-selected={value === scope} tabIndex={value === scope ? 0 : -1}
            onClick={() => { onChange(value); trigger.current?.focus(); }}>
            {label}{value === scope && <Check size={15} aria-hidden="true" />}
          </button>
        ))}
      </div>
    </div>
  );
}
