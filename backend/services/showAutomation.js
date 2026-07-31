const Movie   = require("../models/Movie");
const Theatre = require("../models/Theatre");
const Show    = require("../models/Show");
const { generateDailyShowTimes } = require("../utils/showGenerator");

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays    = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

/** Helper to select a random language strictly from the movie's available languages */
const getRandomLanguage = (movie) => {
  let availableLanguages = [];

  if (Array.isArray(movie.languages) && movie.languages.length > 0) {
    availableLanguages = movie.languages;
  } else if (movie.language) {
    availableLanguages = [movie.language];
  }

  if (availableLanguages.length === 0) return "";

  const randomIndex = Math.floor(Math.random() * availableLanguages.length);
  return availableLanguages[randomIndex];
};

/** Self-healing: Finds existing shows without a valid language and updates them */
const fixMissingLanguages = async () => {
  const showsToFix = await Show.find({
    $or: [
      { language: { $exists: false } },
      { language: "" },
      { language: "Not Specified" },
    ],
  }).populate("movie");

  for (const show of showsToFix) {
    if (!show.movie) continue;

    const selectedLanguage = getRandomLanguage(show.movie);
    if (selectedLanguage) {
      show.language = selectedLanguage;
      await show.save();
    }
  }
};

/** Deletes any show whose date has fully passed. */
const cleanupCompletedShows = async () => {
  const today = startOfDay(new Date());
  await Show.deleteMany({ showDate: { $lt: today } });
};

/** Creates missing shows for every active movie/theatre/screen on one date. Idempotent. */
const generateShowsForDate = async (dateObj) => {
  const targetDate = startOfDay(dateObj);

  const movies = await Movie.find({ isInCinemas: true });
  if (!movies.length) return;

  const theatres = await Theatre.find().populate("city");

  for (const movie of movies) {
    const movieCities = (movie.cities || []).map((c) => c.toLowerCase());
    const eligibleTheatres = theatres.filter(
      (t) => t.city && movieCities.includes(t.city.name.toLowerCase())
    );

    for (const theatre of eligibleTheatres) {
      for (const screen of theatre.screens || []) {
        if (!screen.seatLayout || screen.seatLayout.length === 0) continue; // skip unconfigured screens

        const exists = await Show.findOne({
          movie: movie._id, theatre: theatre._id, screen: screen.name, showDate: targetDate,
        });
        if (exists) continue;

        const selectedLanguage = getRandomLanguage(movie);
        const showTimes = generateDailyShowTimes(theatre._id.toString(), targetDate);
        
        try {
          await Show.create({
            movie: movie._id,
            theatre: theatre._id,
            screen: screen.name,
            showDate: targetDate,
            language: selectedLanguage,
            showTimes,
          });
        } catch (e) {
          if (e.code !== 11000) console.error("Show generation error:", e.message);
        }
      }
    }
  }
};

/** Fills every day in the rolling window (cheap — existing shows are skipped). */
const backfillWindow = async (days = 30) => {
  const today = startOfDay(new Date());
  for (let i = 0; i < days; i++) {
    await generateShowsForDate(addDays(today, i));
  }
};

/** Runs every night: fixes missing language records, cleans up finished shows, then extends the window. */
const runNightlyAutomation = async () => {
  await fixMissingLanguages(); // Automatically heals old/scheduled shows without languages
  await cleanupCompletedShows();
  const today = startOfDay(new Date());
  await generateShowsForDate(addDays(today, 29)); // the day newly entering the 30-day window
  await backfillWindow(30);                        // safety net for any gaps
};

module.exports = {
  generateDailyShowTimes,
  generateShowsForDate,
  cleanupCompletedShows,
  runNightlyAutomation,
  backfillWindow,
  fixMissingLanguages, // Exported so you can call it independently if needed
};