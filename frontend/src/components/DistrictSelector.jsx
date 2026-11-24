import { useEffect, useRef, useState } from "react";
import { MapPin, X, Search, Loader2, ChevronDown } from "lucide-react";
import Dialog from "./Dialog";
import api from "../api/axiosInstance";

export function getSelectedDistrict() {
  return {
    id:   localStorage.getItem("selectedDistrictId") || "",
    name: localStorage.getItem("selectedDistrict")   || "",
  };
}

export default function DistrictSelector({ compact = false }) {
  const [districtModal, setDistrictModal]   = useState(false);
  const [districts, setDistricts]           = useState([]);
  const [loading, setLoading]               = useState(false);
  const [search, setSearch]                 = useState("");
  const inputRef = useRef(null);

  const [selectedId,   setSelectedId]   = useState(() => localStorage.getItem("selectedDistrictId") || "");
  const [selectedName, setSelectedName] = useState(() => localStorage.getItem("selectedDistrict")   || "");

  useEffect(() => {
    if (!districtModal) return;
    setLoading(true);
    const cityId = localStorage.getItem("selectedCityId");
    const url    = cityId ? `/districts/city/${cityId}` : "/districts";
    api.get(url)
      .then((r) => setDistricts(r.data))
      .catch(() => setDistricts([]))
      .finally(() => setLoading(false));
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [districtModal]);

  const handleSelect = (district) => {
    setSelectedId(district._id);
    setSelectedName(district.name);
    localStorage.setItem("selectedDistrictId", district._id);
    localStorage.setItem("selectedDistrict", district.name);
    window.dispatchEvent(new Event("districtChanged"));
    setDistrictModal(false);
    setSearch("");
  };

  const clearDistrict = () => {
    setSelectedId("");
    setSelectedName("");
    localStorage.removeItem("selectedDistrictId");
    localStorage.removeItem("selectedDistrict");
    window.dispatchEvent(new Event("districtChanged"));
    setDistrictModal(false);
  };

  const filtered = districts.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <button
        onClick={() => setDistrictModal(true)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: compact ? "6px 10px" : "8px 14px",
          borderRadius: 20, border: "1.5px solid #e4e4e7",
          background: selectedName ? "rgba(16,101,121,0.06)" : "#fff",
          cursor: "pointer",
        }}
      >
        <MapPin size={14} color={selectedName ? "#106579" : "#9ca3af"} />
        <span style={{ fontSize: 13, fontWeight: 700, color: selectedName ? "#106579" : "#6b7280" }}>
          {selectedName || "Select District"}
        </span>
        <ChevronDown size={13} color={selectedName ? "#106579" : "#9ca3af"} />
      </button>

      {districtModal && (
        <Dialog label="Select your district" onDismiss={() => { setDistrictModal(false); setSearch(""); }}>
          <div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="text-[15px] font-bold text-gray-900">Select your district</p>
              <button aria-label="Close district selector" className="grid size-10 place-items-center rounded-lg hover:bg-gray-50" onClick={() => { setDistrictModal(false); setSearch(""); }}>
                <X size={18} className="text-gray-400 hover:text-gray-700 transition-colors" />
              </button>
            </div>

            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <Search size={13} className="text-gray-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  aria-label="Search districts"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search district…"
                  className="flex-1 min-w-0 bg-transparent text-[13px] text-gray-800 outline-none placeholder-gray-400"
                />
                {search && (
                  <button aria-label="Clear district search" onClick={() => setSearch("")}>
                    <X size={12} className="text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            <div className="px-4 pb-4 max-h-72 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
              {loading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                  <Loader2 size={16} className="animate-spin" style={{ color: "#106579" }} />
                  <span className="text-[13px]">Loading districts…</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[13px] text-gray-400">No districts found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {filtered.map((d) => {
                    const active = selectedId === d._id;
                    return (
                      <button
                        key={d._id}
                        onClick={() => handleSelect(d)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all border"
                        style={active
                          ? { background: "rgba(16,101,121,0.08)", color: "#106579", borderColor: "rgba(16,101,121,0.3)" }
                          : { background: "white", color: "#374151", borderColor: "#e4e4e7" }}
                      >
                        <MapPin size={12} />
                        {d.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedName && (
                <button
                  onClick={clearDistrict}
                  className="w-full mt-3 py-2 text-[12px] font-semibold text-gray-400 hover:text-gray-600"
                >
                  Clear selection
                </button>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}