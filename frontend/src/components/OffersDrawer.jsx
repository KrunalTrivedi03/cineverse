import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft, ChevronDown, ChevronRight, Tag, Percent, IndianRupee,
  Sparkles, Check, Loader2, SlidersHorizontal,
} from "lucide-react";
import Dialog from "./Dialog";
import { fetchApplicableOffers, validateOffer, formatDiscountLabel, formatValidity, IMG } from "../utils/offers";

const ACCENT = "#106579";

const FILTERS = [
  { key: "all", label: "All offers" },
  { key: "percentage", label: "% Off" },
  { key: "flat", label: "Flat Off" },
  { key: "code", label: "Code required" },
  { key: "auto", label: "Auto-applied" },
];

function matchesFilter(offer, filter) {
  if (filter === "all") return true;
  if (filter === "percentage") return offer.discountType === "percentage";
  if (filter === "flat") return offer.discountType === "flat";
  if (filter === "code") return !!offer.code;
  if (filter === "auto") return !offer.code;
  return true;
}

/**
 * Offers section for the booking review page: a compact "top offer" row
 * (icon + title + subtitle + Apply) plus a "See all" pill that opens a
 * full, filterable, right-sliding drawer — complete with a manual coupon
 * field, matching the reference checkout-offers UI.
 *
 * Props mirror OfferCouponBox so both can share the same apply/remove
 * handlers on the parent page.
 */
export default function OffersDrawer({ type, id, genre, amount, appliedOffer, onApply, onRemove }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [applyingId, setApplyingId] = useState(null);
  const [error, setError] = useState("");
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [manualCode, setManualCode] = useState("");
  const [manualApplying, setManualApplying] = useState(false);
  const [manualError, setManualError] = useState("");

  useEffect(() => {
    if (!type || !id) return;
    let cancelled = false;
    setLoading(true);
    fetchApplicableOffers({ type, id, genre, price: amount })
      .then((data) => !cancelled && setOffers(data.offers || []))
      .catch(() => !cancelled && setOffers([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [type, id, genre, amount]);

  const filtered = useMemo(() => offers.filter((o) => matchesFilter(o, filter)), [offers, filter]);
  const topOffer = offers[0];

  const toggleExpanded = (offerId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(offerId) ? next.delete(offerId) : next.add(offerId);
      return next;
    });
  };

  const applyOffer = async (offer) => {
    setApplyingId(offer._id);
    setError("");
    try {
      const data = await validateOffer({ offerId: offer._id, code: offer.code || undefined, type, id, genre, amount });
      onApply({
        offerId: data.offer._id,
        code: data.offer.code || "",
        title: data.offer.title,
        discountAmount: data.discountAmount,
      });
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't apply this offer");
    } finally {
      setApplyingId(null);
    }
  };

  const applyManualCode = async () => {
    const code = manualCode.trim();
    if (!code) return;
    setManualApplying(true);
    setManualError("");
    try {
      const data = await validateOffer({ code, type, id, genre, amount });
      onApply({
        offerId: data.offer._id,
        code: data.offer.code || code,
        title: data.offer.title,
        discountAmount: data.discountAmount,
      });
      setManualCode("");
      setOpen(false);
    } catch (err) {
      setManualError(err.response?.data?.message || "Couldn't apply this coupon");
    } finally {
      setManualApplying(false);
    }
  };

  if (!loading && offers.length === 0 && !appliedOffer) return null;

  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-4 md:p-5">
      <p className="text-[13px] font-extrabold text-gray-900 flex items-center gap-1.5 mb-3">
        <Sparkles size={14} style={{ color: ACCENT }} /> Offers for you
      </p>

      {appliedOffer && (
        <div
          className="flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl mb-3"
          style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#dcfce7" }}>
              <Check size={13} style={{ color: "#16a34a" }} />
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] font-bold text-gray-900 truncate">{appliedOffer.title}</p>
              <p className="text-[11px] font-semibold" style={{ color: "#16a34a" }}>
                You saved ₹{appliedOffer.discountAmount}
              </p>
            </div>
          </div>
          <button onClick={onRemove} className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 flex-shrink-0">
            Remove
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-[12.5px] py-1">
          <Loader2 size={13} className="animate-spin" /> Loading offers…
        </div>
      ) : (
        offers.length > 0 && (
          <>
            {/* Top offer, shown inline — same row style the drawer uses,
                so the "Apply" here works without needing to open anything. */}
            {topOffer && !appliedOffer && (
              <div className="flex items-center gap-3 p-3 rounded-xl mb-2.5" style={{ background: "#fafafa" }}>
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ background: topOffer.image ? "#f3f4f6" : "rgba(16,101,121,0.08)" }}
                >
                  {topOffer.image ? (
                    <img src={IMG(topOffer.image)} alt="" className="w-full h-full object-cover" />
                  ) : topOffer.discountType === "percentage" ? (
                    <Percent size={15} style={{ color: ACCENT }} />
                  ) : (
                    <IndianRupee size={15} style={{ color: ACCENT }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-gray-900 truncate">
                    Get {formatDiscountLabel(topOffer)} on your booking
                  </p>
                  <p className="text-[11.5px] text-gray-400 truncate">{topOffer.title}</p>
                </div>
                <button
                  onClick={() => applyOffer(topOffer)}
                  disabled={applyingId === topOffer._id}
                  className="text-[12px] font-bold px-3 py-1.5 rounded-lg flex-shrink-0 disabled:opacity-60"
                  style={{ color: ACCENT }}
                >
                  {applyingId === topOffer._id ? <Loader2 size={13} className="animate-spin" /> : "Apply"}
                </button>
              </div>
            )}

            <button
              onClick={() => setOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-full border"
              style={{ borderColor: "#f0f0f0" }}
            >
              <span className="text-[12.5px] font-semibold text-gray-600">
                See all {offers.length} offer{offers.length !== 1 ? "s" : ""}
              </span>
              <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
            </button>
          </>
        )
      )}

      {error && (
        <p className="text-[11.5px] font-medium text-center mt-2" style={{ color: ACCENT }}>{error}</p>
      )}

      {open && (
        <Dialog variant="drawer" label="Booking offers" onDismiss={() => setOpen(false)}>
          <div className="bg-white h-dvh overflow-hidden flex flex-col">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <button aria-label="Close offers" onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-50 flex-shrink-0">
                <ChevronLeft size={17} className="text-gray-700" />
              </button>
              <p className="text-[16px] font-extrabold text-gray-900">Offers</p>
            </div>

            {/* Manual coupon entry */}
            <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <input
                  value={manualCode} aria-label="Coupon code"
                  onChange={(e) => { setManualCode(e.target.value); setManualError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && applyManualCode()}
                  placeholder="Have a coupon? Type here"
                  className="flex-1 text-[13px] px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-gray-300"
                />
                <button
                  onClick={applyManualCode}
                  disabled={!manualCode.trim() || manualApplying}
                  className="text-[12.5px] font-bold px-4 py-2.5 rounded-xl flex-shrink-0 disabled:opacity-50"
                  style={{
                    background: manualCode.trim() ? ACCENT : "#f3f4f6",
                    color: manualCode.trim() ? "#fff" : "#9ca3af",
                  }}
                >
                  {manualApplying ? <Loader2 size={13} className="animate-spin" /> : "Apply"}
                </button>
              </div>
              {manualError && <p className="text-[11px] font-medium mt-1.5" style={{ color: ACCENT }}>{manualError}</p>}
            </div>

            {/* Filter chips — same filter state/behaviour as before, just restyled into the drawer */}
            <div className="px-5 py-3 border-b border-gray-100 flex-shrink-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              <div className="flex items-center gap-2 w-max">
                <SlidersHorizontal size={13} className="text-gray-300 flex-shrink-0" />
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)} aria-pressed={filter === f.key}
                    className="px-3 py-1.5 rounded-full text-[11.5px] font-semibold flex-shrink-0 transition-all"
                    style={
                      filter === f.key
                        ? { background: ACCENT, color: "#fff" }
                        : { background: "#f3f4f6", color: "#6b7280" }
                    }
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4" style={{ scrollbarWidth: "thin" }}>
              <p className="text-[12.5px] font-extrabold text-gray-900 mb-3">Best offers for you</p>

              {filtered.length === 0 ? (
                <p className="text-center text-[12.5px] text-gray-400 py-8">No offers match this filter</p>
              ) : (
                <div className="space-y-3">
                  {filtered.map((offer) => {
                    const isApplied = appliedOffer?.offerId === offer._id;
                    const isExpanded = expandedIds.has(offer._id);
                    return (
                      <div
                        key={offer._id}
                        className="rounded-xl border overflow-hidden"
                        style={{ borderColor: isApplied ? ACCENT : "#f0f0f0" }}
                      >
                        <div className="p-3.5 flex gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: "rgba(16,101,121,0.08)" }}>
                            {offer.image ? (
                              <img src={IMG(offer.image)} alt="" className="w-full h-full object-cover" />
                            ) : offer.discountType === "percentage" ? (
                              <Percent size={16} style={{ color: ACCENT }} />
                            ) : (
                              <IndianRupee size={16} style={{ color: ACCENT }} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-gray-900">{formatDiscountLabel(offer)}</p>
                            <p className="text-[12px] text-gray-600 mt-0.5">{offer.title}</p>
                            {offer.code && (
                              <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-1.5" style={{ background: "#f3f4f6", color: "#6b7280" }}>
                                {offer.code}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => toggleExpanded(offer._id)}
                            className="flex items-center gap-1 text-[11px] font-bold text-gray-400 flex-shrink-0 self-start pt-0.5"
                          >
                            Learn more
                            <ChevronDown
                              size={12}
                              className="transition-transform"
                              style={{ transform: isExpanded ? "rotate(180deg)" : "none" }}
                            />
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="px-3.5 pb-3 -mt-1">
                            {offer.description && (
                              <p className="text-[11.5px] text-gray-400 mb-1">{offer.description}</p>
                            )}
                            <p className="text-[10.5px] text-gray-300">{formatValidity(offer)}</p>
                          </div>
                        )}

                        <div className="border-t border-gray-100 py-2.5 flex items-center justify-center">
                          {isApplied ? (
                            <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: "#16a34a" }}>
                              <Check size={12} /> Applied
                            </span>
                          ) : (
                            <button
                              onClick={() => applyOffer(offer)}
                              disabled={applyingId === offer._id}
                              className="text-[12px] font-bold disabled:opacity-60"
                              style={{ color: ACCENT }}
                            >
                              {applyingId === offer._id ? <Loader2 size={13} className="animate-spin mx-auto" /> : "Apply"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {error && <p className="text-[11.5px] font-medium text-center mt-3" style={{ color: ACCENT }}>{error}</p>}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}