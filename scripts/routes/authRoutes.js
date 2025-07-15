const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const {
  registerUser,
  verifyPin,
  loginUser,
  refreshTokenHandler,
  logoutUser,
} = require("../controllers/authController");
const applyCsrfProtection = require("../middlewares/csrfProtection");

router.post(
  "/register",
  applyCsrfProtection,
  [
    body("email", "Please enter a valid email.").isEmail(),
    body("password", "Password must be at least 6 characters long.").isLength({
      min: 6,
    }),
  ],
  registerUser
);

router.post(
  "/verify-pin",
  // applyCsrfProtection,
  [
    body("email", "Please enter a valid email.").isEmail(),
    body("pin", "PIN must be 6 digits.")
      .isLength({ min: 6, max: 6 })
      .isNumeric(),
  ],
  verifyPin
);

router.post(
  "/login",
  applyCsrfProtection,
  [
    body("email", "Please enter a valid email.").isEmail(),
    body("password", "Password is required.").notEmpty(),
  ],
  loginUser
);

router.post("/refresh-token", applyCsrfProtection, refreshTokenHandler);

router.post("/logout", applyCsrfProtection, logoutUser);

module.exports = router;
