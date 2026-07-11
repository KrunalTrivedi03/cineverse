const express = require("express");
const router  = express.Router();
const esc = require("../controllers/eventScheduleController");

router.post("/admin/create",      esc.createSchedule);
router.put("/admin/update/:id",   esc.updateSchedule);
router.delete("/admin/delete/:id",esc.deleteSchedule);
router.delete("/admin/bulk-delete", esc.bulkDeleteSchedules);

router.post("/admin/:id/times",              esc.addTimeSlot);
router.delete("/admin/:id/times/:timeSlotId",esc.removeTimeSlot);

router.get("/",                    esc.getSchedules);
router.get("/:id",                 esc.getScheduleById);
router.get("/event/:eventId",      esc.getSchedulesByEvent);
router.get("/district/:districtId/event/:eventId", esc.getSchedulesByDistrict);

module.exports = router;