const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pad = (n) => n.toString().padStart(2, "0");
const minutesToTime = (mins) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;

const TIME_BANDS = [
  { name: "morning",   start: 9 * 60,  end: 12 * 60,      base: [110, 160] },
  { name: "afternoon", start: 12 * 60, end: 16 * 60,      base: [140, 200] },
  { name: "evening",   start: 16 * 60, end: 20 * 60,      base: [190, 260] },
  { name: "night",     start: 20 * 60, end: 23 * 60 + 30, base: [200, 280] },
];

const MIN_GAP_MINUTES = 150;

function generateDailyShowTimes(theatreId, dateObj) {
  const day = dateObj.getDay(); // 0 = Sun, 6 = Sat
  const isWeekend = day === 0 || day === 6;
  const weekendMultiplier = isWeekend ? 1.1 + Math.random() * 0.25 : 1;

  const slotCount = randInt(4, 10);

  const weightedBands = [
    ...TIME_BANDS,
    TIME_BANDS[2], TIME_BANDS[3],
    TIME_BANDS[1],
  ];

  const chosenTimes = [];
  const results = [];
  let attempts = 0;
  const maxAttempts = slotCount * 20;

  while (results.length < slotCount && attempts < maxAttempts) {
    attempts++;
    const band = weightedBands[randInt(0, weightedBands.length - 1)];
    const rawMinutes = randInt(band.start, band.end - 15);
    const minutes = Math.round(rawMinutes / 5) * 5;

    const tooClose = chosenTimes.some((t) => Math.abs(t - minutes) < MIN_GAP_MINUTES);
    if (tooClose) continue;

    chosenTimes.push(minutes);
    const basePrice = randInt(band.base[0], band.base[1]);
    const price = Math.round((basePrice * weekendMultiplier) / 10) * 10;
    results.push({ time: minutesToTime(minutes), price });
  }

  results.sort((a, b) => a.time.localeCompare(b.time));
  return results;
}

module.exports = { generateDailyShowTimes };