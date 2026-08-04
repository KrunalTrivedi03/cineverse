require("dotenv").config();
const express      = require("express");
const http         = require("http");
const { Server }   = require("socket.io");
const cors         = require("cors");
const cookieParser = require("cookie-parser");
const path         = require("path");
const connectDB    = require("./config/db");
const cron         = require("node-cron");

// Destructure fixMissingLanguages along with other automation functions
const { 
  runNightlyAutomation, 
  backfillWindow, 
  fixMissingLanguages 
} = require("./services/showAutomation");

const { runNightlyEventAutomation } = require("./services/eventAutomation");

const userAuthRoutes    = require("./routes/authRoutes");
const adminAuthRoutes   = require("./routes/adminAuthRoutes");
const movieRoutes       = require("./routes/movieRoutes");
const watchlistRoutes   = require("./routes/watchlistRoutes");
const roleRoutes        = require("./routes/roleRoutes");
const permissionRoutes  = require("./routes/permissionRoutes");
const adminUserRoutes   = require("./routes/adminUserRoutes");
const normalUsersRoutes = require("./routes/userRoutes");
const cityRoutes        = require("./routes/cityRoutes");
const theatreRoutes     = require("./routes/theatreRoutes");
const showRoutes        = require("./routes/showRoutes");
const seatRoutes        = require("./routes/seatRoutes");
const paymentRoutes     = require("./routes/paymentRoutes");
const quickPayRoutes     = require("./routes/quickPayRoutes");

/* Event module */
const districtRoutes       = require("./routes/districtRoutes");
const artistRoutes         = require("./routes/artistRoutes");
const venueRoutes          = require("./routes/venueRoutes");
const eventRoutes          = require("./routes/eventRoutes");
const publicEventRoutes    = require("./routes/publicEventRoutes");
const tourRoutes           = require("./routes/tourRoutes");
const eventScheduleRoutes  = require("./routes/eventScheduleRoutes");
const eventSeatRoutes      = require("./routes/eventSeatRoutes");
const eventPaymentRoutes   = require("./routes/eventPaymentRoutes");
const offerRoutes          = require("./routes/offerRoutes");
const contactRoutes        = require("./routes/contactRoutes");

const app    = express();
app.set("trust proxy", 1);
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (process.env.CLIENT_URL || "").replace(/\/$/, ""),
    credentials: true,
    methods:     ["GET", "POST"],
  },
});
require("./socket")(io);

app.use(cors({ origin: (process.env.CLIENT_URL || "").replace(/\/$/, ""), credentials: true }));
app.use(express.json());
app.use(cookieParser());

const session = require("express-session");
const passport = require("./config/passport");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Connect DB and then run the startup tasks asynchronously
connectDB().then(async () => {
  try {
    // 1. Instantly fix any existing shows in the database missing a language on server restart
    await fixMissingLanguages();
    console.log("Existing show languages verified & updated.");

    // 2. Perform regular window backfill
    await backfillWindow(30);
  } catch (e) {
    console.error("Startup show initialization failed:", e.message);
  }
});

// Every night at 2 AM: clean up completed shows, fix missing languages, extend the rolling window
cron.schedule("0 2 * * *", () => {
  console.log("Running nightly show automation...");
  runNightlyAutomation().catch((e) => console.error("Nightly show automation failed:", e.message));
});

// Every night at 2:15 AM: clean up completed event schedules, resync event statuses
cron.schedule("15 2 * * *", () => {
  console.log("Running nightly event automation...");
  runNightlyEventAutomation().catch((e) => console.error("Nightly event automation failed:", e.message));
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth",         userAuthRoutes);
app.use("/api/admin/auth",   adminAuthRoutes);
app.use("/api/movies",       require("./routes/publicMovieRoutes"));
app.use("/api/admin/movies", movieRoutes);
app.use("/api/watchlist",    watchlistRoutes);
app.use("/api/roles",        roleRoutes);
app.use("/api/permissions",  permissionRoutes);
app.use("/api/admin/users",  adminUserRoutes);
app.use("/api/users",        normalUsersRoutes);
app.use("/api/cities",       cityRoutes);
app.use("/api/theatres",     theatreRoutes);
app.use("/api/shows",        showRoutes);
app.use("/api/seats",        seatRoutes);
app.use("/api/payment",      paymentRoutes);
app.use("/api/quickpay",     quickPayRoutes);

/* Event module */
app.use("/api/districts",       districtRoutes);
app.use("/api/artists",         artistRoutes);
app.use("/api/venues",          venueRoutes);
app.use("/api/events",          publicEventRoutes);
app.use("/api/admin/events",    eventRoutes);
app.use("/api/tours",           tourRoutes);
app.use("/api/event-schedules", eventScheduleRoutes);
app.use("/api/event-seats",     eventSeatRoutes);
app.use("/api/event-payment",   eventPaymentRoutes);

/* Offers & Contact */
app.use("/api/offers",  offerRoutes);
app.use("/api/contact", contactRoutes);

app.get("/", (req, res) => res.send("CineVerse Backend Running..."));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));