const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator"); // Import param for URL parameters validation
const {
  registerUser,
  verifyPin,
  loginUser,
  refreshTokenHandler,
  logoutUser,
} = require("../controllers/authController");
const applyCsrfProtection = require("../middlewares/csrfProtection"); // Import middleware CSRF

// --- Public Routes (no authentication required) ---

// Register - Áp dụng CSRF protection
router.post(
  "/register",
  applyCsrfProtection, // <--- Đã thêm CSRF Protection
  [
    body("email", "Please enter a valid email.").isEmail(),
    body("password", "Password must be at least 6 characters long.").isLength({
      min: 6,
    }),
  ],
  registerUser
);

// Verify PIN - Thường không cần CSRF nếu chỉ gửi PIN qua body, nhưng nếu là POST, có thể thêm
router.post(
  "/verify-pin",
  // applyCsrfProtection, // Bạn có thể thêm vào đây nếu muốn, tùy thuộc vào cách xử lý PIN ở frontend
  [
    body("email", "Please enter a valid email.").isEmail(),
    body("pin", "PIN must be 6 digits.")
      .isLength({ min: 6, max: 6 })
      .isNumeric(),
  ],
  verifyPin
);

// Login - Áp dụng CSRF protection
router.post(
  "/login",
  applyCsrfProtection, // <--- Đã thêm CSRF Protection
  [
    body("email", "Please enter a valid email.").isEmail(),
    body("password", "Password is required.").notEmpty(),
  ],
  loginUser
);

// Refresh Token - KHÔNG áp dụng CSRF protection
router.post("/refresh-token", refreshTokenHandler);

// --- Private/Protected Routes (requires Access Token authentication) ---

// Logout - Áp dụng CSRF protection
router.post("/logout", applyCsrfProtection, logoutUser); // <--- Đã thêm CSRF Protection

module.exports = router;
