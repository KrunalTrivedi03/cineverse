const pad = (n) => n.toString().padStart(2, "0");
const minutesToTime = (mins) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;

/**
 * Resolves the price for one [startMin, endMin) window from a court's
 * pricingRules, given whether the date is a weekend. A rule matches if the
 * slot's start time falls inside the rule's [startMin, endMin) band.
 * Falls back to the first rule of the matching dayType if nothing matches
 * exactly (keeps generation resilient to slightly misconfigured rules
 * rather than throwing and blocking the whole day).
 */
function resolvePrice(pricingRules, dayType, slotStartMin) {
  const sameDay = pricingRules.filter((r) => r.dayType === dayType);
  const exact = sameDay.find((r) => slotStartMin >= r.startMin && slotStartMin < r.endMin);
  if (exact) return exact.price;
  return sameDay[0]?.price ?? pricingRules[0]?.price ?? 0;
}

/**
 * Generates the full day's slots for one court — every slotDurationMinutes
 * step between operatingHours.startMin and endMin, each priced from the
 * court's pricingRules. Pure function; does not touch the database.
 */
function generateDailySlotsForCourt(court, dateObj) {
  const day = dateObj.getDay(); // 0 = Sun, 6 = Sat
  const dayType = day === 0 || day === 6 ? "weekend" : "weekday";

  const { startMin, endMin } = court.operatingHours;
  const step = court.slotDurationMinutes;

  const slots = [];
  for (let start = startMin; start + step <= endMin; start += step) {
    const end = start + step;
    slots.push({
      startMin: start,
      endMin: end,
      startTime: minutesToTime(start),
      endTime: minutesToTime(end),
      price: resolvePrice(court.pricingRules, dayType, start),
    });
  }
  return slots;
}

module.exports = { generateDailySlotsForCourt, resolvePrice, minutesToTime };
