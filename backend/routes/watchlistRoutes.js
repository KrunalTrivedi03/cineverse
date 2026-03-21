// ═══════════════════════════════════════════════════════════════
// FILE 3: routes/watchlistRoutes.js
// ═══════════════════════════════════════════════════════════════
const express = require("express");
const router  = express.Router();

const watchlistController = require("../controllers/watchlistController");
const auth                = require("../middleware/authMiddleware");
const requirePermission   = require("../middleware/permissionMiddleware");

router.get(
  "/check/:movieId",
  auth,
  watchlistController.checkWatchlist
);

router.get(
  "/",
  auth,
  requirePermission("VIEW_WATCHLIST"),
  watchlistController.getWatchlist
);

router.post(
  "/add",
  auth,
  requirePermission("ADD_TO_WATCHLIST"),
  watchlistController.addToWatchlist
);

router.post(
  "/remove",
  auth,
  requirePermission("REMOVE_FROM_WATCHLIST"),
  watchlistController.removeFromWatchlist
);

router.patch(
  "/status",
  auth,
  requirePermission("ADD_TO_WATCHLIST"),
  watchlistController.updateStatus
);

module.exports = router;