const express = require("express");
const {
  login,
  register,
  mobileLogin,
} = require("../controllers/authController");

const router = express.Router();

router.post("/login", login);
router.post("/register", register);

router.post("/loginWithMobileNo", mobileLogin);

module.exports = router;
