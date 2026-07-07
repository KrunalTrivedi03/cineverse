const express = require("express");
const router  = express.Router();
const tc      = require("../controllers/theatreController");

/* Theatre CRUD */
router.post("/admin/create",          tc.addTheatre);
router.put("/admin/update/:id",       tc.updateTheatre);
router.delete("/admin/delete/:id",    tc.deleteTheatre);

/* Screen CRUD */
router.post("/admin/:id/screens",                 tc.addScreen);
router.put("/admin/:id/screens/:screenId",        tc.updateScreen);
router.delete("/admin/:id/screens/:screenId",     tc.deleteScreen);

/* Seat Layout */
router.post("/admin/:id/screens/:screenId/layout/random",          tc.generateLayout);
router.get("/admin/:id/screens/:screenId/layout",                  tc.getLayout);
router.put("/admin/:id/screens/:screenId/layout",                  tc.saveLayout);
router.post("/admin/:id/screens/:screenId/layout/rows",            tc.addRow);
router.put("/admin/:id/screens/:screenId/layout/rows/:rowId",      tc.updateRow);
router.delete("/admin/:id/screens/:screenId/layout/rows/:rowId",   tc.deleteRow);

/* Public reads — specific before wildcard */
router.get("/",                   tc.getAllTheatres);
router.get("/city/:cityId",       tc.getTheatresByCity);
router.get("/:id",                tc.getTheatreById);

module.exports = router;