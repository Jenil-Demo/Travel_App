const express = require("express");
const { getStatusMaster } = require("../controllers/masterController");

const router = express.Router();

router.get("/getStatus", getStatusMaster);

module.exports = router;
