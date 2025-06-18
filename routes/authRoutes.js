// D:\EBAY_CLONE\ebay_clone_be\routes\authRoutes.js

const express = require("express");
const { body, param } = require("express-validator"); // Import param for URL parameters validation
const {
  registerUser,
  verifyPin,
  loginUser,
  refreshTokenHandler,
  logoutUser,
} = require("../controllers/authController");

const router = express.Router();

// --- Public Routes (no authentication required) ---

// Register
router.post(
  "/register",
  [
    body("email", "Please enter a valid email.").isEmail(),
    body("password", "Password must be at least 6 characters long.").isLength({
      min: 6,
    }),
  ],
  registerUser
);

// Verify PIN
router.post(
  "/verify-pin",
  [
    body("email", "Please enter a valid email.").isEmail(),
    body("pin", "PIN must be 6 digits.")
      .isLength({ min: 6, max: 6 })
      .isNumeric(),
  ],
  verifyPin
);

// Login
router.post(
  "/login",
  [
    body("email", "Please enter a valid email.").isEmail(),
    body("password", "Password is required.").notEmpty(),
  ],
  loginUser
);

// Refresh Token
router.post("/refresh-token", refreshTokenHandler);

// --- Private/Protected Routes (requires Access Token authentication) ---

// Logout (can be accessed even without valid token to clear cookies, but safer to protect if you want to record logouts)
router.post("/logout", logoutUser);

module.exports = router;
