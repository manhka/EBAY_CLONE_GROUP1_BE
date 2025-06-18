// D:\EBAY_CLONE\ebay_clone_be\utils\tokenUtils.js

const jwt = require("jsonwebtoken");

// Helper function to generate Access Token
const generateAccessToken = (userId, email) => {
  return jwt.sign(
    { id: userId, email: email },
    process.env.JWT_SECRET, // Use your Access Token secret from .env
    { expiresIn: "15m" } // Access Token expires in 15 minutes
  );
};

// Helper function to generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId }, // Refresh Token only needs user ID
    process.env.REFRESH_TOKEN_SECRET, // Use your Refresh Token secret from .env
    { expiresIn: "7d" } // Refresh Token expires in 7 days
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
