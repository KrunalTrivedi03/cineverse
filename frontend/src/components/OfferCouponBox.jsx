import { useEffect, useState } from "react";
import { Tag, Check, Loader2, ChevronRight, Sparkles } from "lucide-react";
import { fetchApplicableOffers, validateOffer, formatDiscountLabel } from "../utils/offers";

/**
 * Drop-in coupon/offer box for any checkout summary screen.
 *
 * - Auto-suggests the best live offer for the given movie/event (if any) as a
 *   one-tap "apply" pill.
 * - Lets the user type in a coupon code manually.
 * - Delegates all validation to the backend (/offers/validate) — this
 *   component never computes or trusts a discount amount on its own.
 *
 * Props:
 *  - type: "movies" | "events"
 *  - id: movie/event id
 *  - genre: optional genre/category, used for genre-targeted offers
 *  - amount: current pre-discount subtotal (re-checked whenever it changes)
 *  - appliedOffer: { offerId, code, title, discountAmount } | null
 *  - onApply(offerData), onRemove()
 */
export default function OfferCouponBox({ type, id, genre, amount, appliedOffer, onApply, onRemove }) {
  const [suggested, setSuggested] = useState(null);
  const [showInput, setShowInput] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!type || !id || appliedOffer) {
      setSuggested(null);
      return;
    }
    let cancelled = false;
    fetchApplicableOffers({ type, id, genre, price: amount })
      .then((data) => !cancelled && setSuggested(data.bestOffer || null))
      .catch(() => !cancelled && setSuggested(null));
    return () => {
      cancelled = true;
    };
  }, [type, id, genre, amount, appliedOffer]);

  const applyCode = async (rawCode, offerId) => {
    setLoading(true);
    setError("");
    try {
      const data = await validateOffer({ code: rawCode || undefined, offerId, type, id, genre, amount });
      onApply({
        offerId: data.offer._id,
        code: data.offer.code || "",
        title: data.offer.title,
        discountAmount: data.discountAmount,
      });
      setShowInput(false);
      setCode("");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't apply this offer");
    } finally {
      setLoading(false);
    }
  };

  if (appliedOffer) {
    return (
      <div
        className="flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl"
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
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #f3f4f6" }}>
      {suggested && !showInput && (
        <button
          type="button"
          onClick={() => applyCode(suggested.code, suggested._id)}
          disabled={loading}
          className="w-full flex items-center justify-between gap-2 px-3.5 py-3 text-left disabled:opacity-70"
          style={{ background: "#fff5f5" }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Tag size={13} style={{ color: "#106579" }} className="flex-shrink-0" />
            <span className="text-[12.5px] font-semibold text-gray-800 truncate">
              {formatDiscountLabel(suggested)} · {suggested.title}
            </span>
          </div>
          {loading ? (
            <Loader2 size={13} className="animate-spin flex-shrink-0" style={{ color: "#106579" }} />
          ) : (
            <span className="text-[11px] font-bold flex-shrink-0" style={{ color: "#106579" }}>
              APPLY
            </span>
          )}
        </button>
      )}

      <button
        type="button"
        onClick={() => setShowInput((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-3 text-left"
        style={{ borderTop: suggested && !showInput ? "1px solid #f3f4f6" : "none" }}
      >
        <span className="text-[12.5px] font-semibold text-gray-600 flex items-center gap-2">
          <Sparkles size={13} className="text-gray-400" /> Have a coupon code?
        </span>
        <ChevronRight size={13} className={`text-gray-400 transition-transform ${showInput ? "rotate-90" : ""}`} />
      </button>

      {showInput && (
        <div className="px-3.5 pb-3.5 pt-1 flex gap-2">
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError("");
            }}
            placeholder="Enter code"
            className="flex-1 px-3 py-2 rounded-lg border text-[12.5px] outline-none"
            style={{ borderColor: error ? "#106579" : "#e4e4e7" }}
          />
          <button
            type="button"
            onClick={() => code.trim() && applyCode(code.trim())}
            disabled={loading || !code.trim()}
            className="px-4 py-2 rounded-lg text-[12px] font-bold text-white disabled:opacity-50 flex items-center justify-center min-w-[64px]"
            style={{ background: "#106579" }}
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : "Apply"}
          </button>
        </div>
      )}
      {error && (
        <p className="px-3.5 pb-3 text-[11px] font-medium" style={{ color: "#106579" }}>
          {error}
        </p>
      )}
    </div>
  );
}