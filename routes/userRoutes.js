const express = require("express");
const { getUserDetails, editUser } = require("../controllers/userController");

const router = express.Router();

router.get("/getUserDetails/:userId", getUserDetails);
router.post("/editUser", editUser);

module.exports = router;
