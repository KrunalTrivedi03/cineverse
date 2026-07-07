require("dotenv").config();
const express      = require("express");
const http         = require("http");
const { Server }   = require("socket.io");
const cors         = require("cors");
const cookieParser = require("cookie-parser");
const path         = require("path");
const connectDB    = require("./config/db");
const cron         = require("node-cron");
const { runNightlyAutomation, backfillWindow } = require("./services/showAutomation");

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
const quickPayRoutes    = require("./routes/quickPayRoutes");

const app    = express();
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

connectDB();

backfillWindow(30).catch((e) => console.error("Initial show backfill failed:", e.message));

// Every night at 2 AM: clean up completed shows, extend the rolling window
cron.schedule("0 2 * * *", () => {
  console.log("Running nightly show automation...");
  runNightlyAutomation().catch((e) => console.error("Nightly show automation failed:", e.message));
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
app.use("/api/quickpay",     quickPayRoutes); // ← NEW

app.get("/", (req, res) => res.send("CineVerse Backend Running..."));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

