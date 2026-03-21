const express = require("express");
const router = express.Router();

const cityController = require("../controllers/cityController");

router.post("/admin/create", cityController.createCity);

router.get("/", cityController.getCities);

module.exports = router;
