const Movie = require("../models/Movie");
const WebShow = require("../models/WebShow");
const Event = require("../models/Event");
const EventSchedule = require("../models/EventSchedule");
const Artist = require("../models/Artist");
const Tour = require("../models/Tour");
const Venue = require("../models/Venue");
const City = require("../models/City");
const District = require("../models/District");
const PlayVenue = require("../models/PlayVenue");
const PlayActivity = require("../models/PlayActivity");
const PlaySlot = require("../models/PlaySlot");
const Court = require("../models/Court");

const LIMIT = 16;
const SCOPES = ["movies", "shows", "play", "events"];
const activeEvents = ["upcoming", "live"];
const literal = (text) => new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
const matches = (fields, pattern) => ({ $or: fields.map((field) => ({ [field]: pattern })) });
const match = (condition) => ({ $match: condition });
const join = (model, field, as) => ({
  $lookup: { from: model.collection.name, localField: field, foreignField: "_id", as },
});

function readOptions(query) {
  const text = (key) => typeof query[key] === "string" ? query[key].trim().slice(0, 100) : "";
  const scope = text("scope") || "all";
  const sort = text("sort") || "relevance";
  if (![...SCOPES, "all"].includes(scope)) throw new Error("Unknown search category.");
  if (!["relevance", "date", "popular", "distance"].includes(sort)) throw new Error("Unknown sort option.");
  const pattern = (key) => text(key) ? literal(text(key)) : null;
  const date = (key) => {
    const value = text(key);
    if (!value) return null;
    const parsed = new Date(value + "T00:00:00Z");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(+parsed) || parsed.toISOString().slice(0, 10) !== value) {
      throw new Error("Enter a valid date.");
    }
    return parsed;
  };
  const from = date("from");
  const to = date("to");
  if (from && to && from > to) throw new Error("The end date must be on or after the start date.");
  const dateRange = from || to ? {
    ...(from ? { $gte: from } : {}),
    ...(to ? { $lt: new Date(+to + 86400000) } : {}),
  } : null;
  let coords = null;
  if (sort === "distance") {
    const lat = Number(text("lat"));
    const lng = Number(text("lng"));
    if (!text("lat") || !text("lng") || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      throw new Error("Location is required to sort by distance.");
    }
    coords = { lat, lng };
  }
  const phrase = text("q");
  return {
    scope, sort, coords, dateRange, phrase,
    terms: phrase.split(/\s+/).filter(Boolean).slice(0, 10).map(literal),
    ...Object.fromEntries(["location", "genre", "language", "category", "type", "artist", "venue", "sport", "team", "player", "competition"].map((key) => [key, pattern(key)])),
  };
}

function filter(filters, fields, pattern) {
  if (pattern) filters.push(matches(fields, pattern));
}

function resultStages(options, fields, filters, projection) {
  const conditions = [...filters, ...options.terms.map((term) => matches(fields, term))];
  return [
    ...(conditions.length ? [match({ $and: conditions })] : []),
    {
      $project: {
        title: 1, image: 1, subtitle: 1, date: 1, popularity: 1, kind: 1,
        ...(options.phrase ? {
          score: { $cond: [{ $regexMatch: { input: { $ifNull: ["$title", ""] }, regex: literal(options.phrase) } }, 2, 1] },
        } : { score: { $literal: 0 } }),
        ...projection,
      },
    },
    { $sort: options.sort === "date" ? { date: options.dateDirection || -1, score: -1, title: 1, _id: 1 }
      : options.sort === "popular" ? { popularity: -1, score: -1, title: 1, _id: 1 }
        : options.sort === "distance" ? { distance: 1, score: -1, title: 1, _id: 1 }
          : { score: -1, popularity: -1, title: 1, _id: 1 } },
    { $limit: LIMIT },
  ];
}

function movies(options) {
  const filters = [];
  filter(filters, ["cities"], options.location);
  filter(filters, ["genre"], options.genre);
  filter(filters, ["language", "languages"], options.language);
  filter(filters, ["status"], options.type);
  return Movie.aggregate(resultStages(options,
    ["title", "genre", "description", "cast.name", "cast.role", "crew.name", "crew.role", "language", "languages", "cities", "ottPlatform"],
    filters, { image: "$poster", subtitle: "$genre", date: "$releaseDate", popularity: "$votes", kind: { $literal: "movie" } }
  ));
}

function shows(options) {
  const filters = [];
  filter(filters, ["genre"], options.genre);
  filter(filters, ["category"], options.type);
  filter(filters, ["cast"], options.artist);
  return WebShow.aggregate([
    match({ isActive: true }),
    ...resultStages(options, ["title", "description", "cast", "genre", "category"], filters, {
      image: "$poster", subtitle: { $arrayElemAt: ["$genre", 0] }, date: "$releaseYear", popularity: "$rating", kind: { $literal: "show" },
    }),
  ]);
}

function eventSchedules(options) {
  const filters = [];
  const locationFields = ["city.name", "district.name", "place.address", "place.name"];
  filter(filters, locationFields, options.location);
  filter(filters, ["place.name"], options.venue);
  const hasScheduleFilter = filters.length > 0 || !!options.dateRange;
  return {
    required: hasScheduleFilter,
    stage: {
      $lookup: {
        from: EventSchedule.collection.name,
        localField: "_id",
        foreignField: "event",
        pipeline: [
          ...(options.dateRange ? [match({ eventDate: options.dateRange })] : []),
          join(Venue, "venue", "place"),
          join(City, "place.city", "city"),
          join(District, "place.district", "district"),
          ...(filters.length ? [match({ $and: filters })] : []),
          { $sort: { eventDate: 1 } },
          { $project: { eventDate: 1, "city.name": 1, "district.name": 1, "place.name": 1, "place.address": 1 } },
        ],
        as: "schedules",
      },
    },
  };
}

function events(options, sportsOnly = false) {
  const schedule = eventSchedules(options);
  const filters = [];
  const sportsFields = ["title", "description", "genre", "tags", "tour.title", "tour.tags"];
  filter(filters, ["category"], options.category);
  filter(filters, ["genre", "bookingType"], options.type);
  filter(filters, ["artists.name"], options.artist);
  if (sportsOnly) {
    filter(filters, sportsFields, options.sport);
    filter(filters, sportsFields, options.team);
    filter(filters, [...sportsFields, "artists.name"], options.player);
    filter(filters, sportsFields, options.competition);
  }
  return Event.aggregate([
    match({ status: { $in: activeEvents }, ...(sportsOnly ? { category: "Sports" } : {}) }),
    join(Artist, "artists", "artists"),
    join(Tour, "tour", "tour"),
    schedule.stage,
    ...(schedule.required ? [match({ "schedules.0": { $exists: true } })] : []),
    ...resultStages(sportsOnly ? { ...options, dateDirection: 1 } : options,
      [...sportsFields, "category", "artists.name", "artists.genres", "organizer.name", "languages", "schedules.place.name", "schedules.city.name", "schedules.district.name"],
      filters, { image: "$poster", subtitle: "$category", date: { $arrayElemAt: ["$schedules.eventDate", 0] }, popularity: "$ratings.count", kind: { $literal: "event" } }
    ),
  ]);
}

function playVenues(options) {
  if (options.team || options.player || options.competition) return Promise.resolve([]);
  const filters = [];
  filter(filters, ["city.name", "district.name", "address", "name"], options.location);
  filter(filters, ["sports.name", "sports.slug"], options.sport);
  filter(filters, ["name"], options.venue);
  // Play slots use the server calendar day, matching the existing slot generator.
  const slotRange = options.dateRange && Object.fromEntries(Object.entries(options.dateRange).map(([operator, date]) => [
    operator, new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  ]));
  const availability = slotRange || options.sort === "date" ? [
    {
      $lookup: {
        from: PlaySlot.collection.name,
        localField: "_id",
        foreignField: "venue",
        let: { sportIds: "$sports._id" },
        pipeline: [
          match({ status: "available", date: slotRange || { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
          ...(options.sport ? [match({ $expr: { $in: ["$activity", "$$sportIds"] } })] : []),
          { $sort: { date: 1 } }, { $limit: 1 }, { $project: { date: 1 } },
        ],
        as: "slots",
      },
    },
    ...(options.dateRange ? [match({ "slots.0": { $exists: true } })] : []),
  ] : [];
  const distance = options.coords ? {
    $cond: [
      { $and: [{ $isNumber: "$latitude" }, { $isNumber: "$longitude" }] },
      { $sqrt: { $add: [
        { $pow: [{ $subtract: ["$latitude", options.coords.lat] }, 2] },
        { $pow: [{ $multiply: [{ $subtract: ["$longitude", options.coords.lng] }, Math.cos(options.coords.lat * Math.PI / 180)] }, 2] },
      ] } },
      999,
    ],
  } : undefined;
  return PlayVenue.aggregate([
    match({ isActive: true }),
    join(City, "city", "city"),
    join(District, "district", "district"),
    {
      $lookup: {
        from: PlayActivity.collection.name, localField: "activities", foreignField: "_id",
        pipeline: [match({ isActive: true, ...(options.sport ? matches(["name", "slug"], options.sport) : {}) })],
        as: "sports",
      },
    },
    { $lookup: { from: Court.collection.name, localField: "_id", foreignField: "venue", pipeline: [match({ isActive: true }), { $project: { name: 1, surfaceType: 1 } }], as: "courts" } },
    ...availability,
    { $set: { title: "$name" } },
    ...resultStages({ ...options, dateDirection: 1 },
      ["name", "description", "address", "amenities", "city.name", "district.name", "sports.name", "sports.slug", "courts.name", "courts.surfaceType"],
      filters, { image: { $arrayElemAt: ["$images", 0] }, subtitle: { $arrayElemAt: ["$district.name", 0] },
        date: { $arrayElemAt: ["$slots.date", 0] }, kind: { $literal: "venue" }, ...(distance ? { distance } : {}) }
    ),
  ]);
}

function playSports(options) {
  if (!options.terms.length || options.location || options.venue || options.dateRange || options.team || options.player || options.competition || options.sort === "distance") {
    return Promise.resolve([]);
  }
  const filters = [];
  filter(filters, ["name", "slug"], options.sport);
  return PlayActivity.aggregate([
    match({ isActive: true }),
    { $set: { title: "$name" } },
    ...resultStages(options, ["name", "slug"], filters, { image: 1, kind: { $literal: "sport" } }),
  ]);
}

async function play(options) {
  const [venues, sportingEvents, sports] = await Promise.all([
    playVenues(options),
    options.sort === "distance" || options.scope === "all" ? [] : events(options, true),
    playSports(options),
  ]);
  const ranked = [...venues, ...sportingEvents, ...sports];
  ranked.sort((a, b) => {
    if (options.sort === "distance") return a.distance - b.distance;
    if (options.sort === "date" && a.date && b.date) return +new Date(a.date) - +new Date(b.date);
    if (options.sort === "date" && Boolean(a.date) !== Boolean(b.date)) return a.date ? -1 : 1;
    if (options.sort === "popular") return (b.popularity || 0) - (a.popularity || 0) || b.score - a.score;
    return b.score - a.score || a.title.localeCompare(b.title);
  });
  return ranked.slice(0, LIMIT);
}

async function eventResults(options) {
  const related = events(options);
  if (!options.terms.length || options.location || options.category || options.type || options.artist || options.venue || options.dateRange) {
    return related;
  }

  const [listings, performers] = await Promise.all([
    related,
    Artist.aggregate([
      { $set: { title: "$name" } },
      ...resultStages(options, ["name", "genres", "bio"], [], {
        image: 1, subtitle: { $arrayElemAt: ["$genres", 0] },
        popularity: { $cond: ["$isFeatured", 1, 0] }, kind: { $literal: "artist" },
      }),
    ]),
  ]);
  return [...listings, ...performers.slice(0, 6)];
}

const searchByScope = { movies, shows, play, events: eventResults };

exports.search = async (req, res, next) => {
  let options;
  try {
    options = readOptions(req.query);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
  try {
    const scopes = options.scope === "all" ? SCOPES : [options.scope];
    const sections = await Promise.all(scopes.map(async (scope) => ({
      scope,
      results: await searchByScope[scope](options),
    })));
    return res.json({ sections });
  } catch (error) {
    return next(error);
  }
};
