import { useEffect, useState } from "react";
import { Tag } from "lucide-react";
import { fetchApplicableOffers, formatDiscountLabel } from "../utils/offers";

/**
 * Fetches the best live offer for a given movie/event and, if one exists,
 * renders a small coral "X% OFF" pill. Renders nothing while loading or
 * when no offer applies — safe to drop into any card or detail page.
 *
 * Props:
 *  - type: "movies" | "events"
 *  - id: the movie/event id
 *  - genre: optional genre/category string for genre-targeted offers
 *  - price: optional numeric price, to compute an exact discount amount
 *  - size: "sm" | "md"
 */
export default function OfferBadge({ type, id, genre, price, size = "sm", className = "" }) {
  const [offer, setOffer] = useState(null);

  useEffect(() => {
    if (!type || !id) return;
    let cancelled = false;
    fetchApplicableOffers({ type, id, genre, price })
      .then((data) => {
        if (!cancelled) setOffer(data.bestOffer || null);
      })
      .catch(() => {
        if (!cancelled) setOffer(null);
      });
    return () => {
      cancelled = true;
    };
  }, [type, id, genre, price]);

  if (!offer) return null;

  const pad = size === "md" ? "px-2.5 py-1 text-[11px]" : "px-2 py-0.5 text-[10px]";

  return (
    <span
      className={`inline-flex items-center gap-1 font-extrabold rounded-full text-white shadow-sm ${pad} ${className}`}
      style={{ background: "#f0545c" }}
      title={offer.title}
    >
      <Tag size={size === "md" ? 11 : 9} />
      {formatDiscountLabel(offer)}
    </span>
  );
}