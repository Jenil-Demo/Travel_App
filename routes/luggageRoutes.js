const express = require("express");
const router = express.Router();
const luggageController = require("../controllers/luggageController");

router.post("/add", luggageController.addLuggage);
router.get("/getLuggageDetails/:userId", luggageController.getTripDetails);
router.get("/:tripId", luggageController.getLuggageByTrip);
router.post(
  "/updateLuggageDropStatus",
  luggageController.updateLuggageDropStatus
);
router.post("/addPaymentTransaction", luggageController.addPaymentTransaction);
module.exports = router;
