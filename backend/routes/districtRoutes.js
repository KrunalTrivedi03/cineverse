const express = require("express");
const router  = express.Router();

const dc = require("../controllers/districtController");

router.post  ("/admin/create",       dc.createDistrict);
router.put   ("/admin/update/:id",   dc.updateDistrict);
router.delete("/admin/delete/:id",   dc.deleteDistrict);

router.get("/",              dc.getDistricts);
router.get("/city/:cityId",  dc.getDistrictsByCity);

module.exports = router;