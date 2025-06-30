// D:\EBAY_CLONE\ebay_clone_be\controllers\authController.js

const { validationResult } = require("express-validator");
const User = require("../models/User");
const jwt = require("jsonwebtoken"); // Still needed for jwt.verify in refreshTokenHandler
const mongoose = require("mongoose");
// Import token generation helper functions
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken");

// Import PIN generation and email service
const { generatePin } = require("../utils/generatePin");
const { sendVerificationPinEmail } = require("../services/emailService");

// @desc    Register user: Creates unverified user in DB and sends verification PIN
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    const pin = generatePin(6); // Generate 6-digit PIN
    const pinExpiresAt = new Date(
      Date.now() +
        (parseInt(process.env.PIN_EXPIRES_IN_MINUTES) || 2) * 60 * 1000
    );

    if (user) {
      if (user.isVerified) {
        return res.status(400).json({
          msg: "This email already exists and has been verified. Please log in.",
        });
      }

      // Email exists but unverified - Update PIN and resend
      user.verificationPin = pin;
      user.verificationPinExpiresAt = pinExpiresAt;
      await user.save();

      await sendVerificationPinEmail(user.email, pin);
      return res.status(200).json({
        msg: "This email is already registered but unverified. A new verification PIN has been sent to your email.",
      });
    } else {
      // New user - Create UNVERIFIED user in DB
      const newUser = await User.create({
        username,
        email,
        password, // Password will be hashed by the `pre('save')` middleware in `User.js`
        isVerified: false,
        verificationPin: pin,
        verificationPinExpiresAt: pinExpiresAt,
      });

      await sendVerificationPinEmail(newUser.email, pin);

      res.status(201).json({
        success: true,
        msg: "Registration successful! Please check your email to enter the account verification PIN.",
      });
    }
  } catch (error) {
    console.error("Error in registerUser:", error.message);
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.status(409).json({
        msg: "This email address is already registered. If unverified, please check your email for the PIN or try registering again to send a new code.",
      });
    }
    next(error);
  }
};

// @desc    Verify user's email using PIN
// @route   POST /api/auth/verify-pin
// @access  Public
const verifyPin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, pin } = req.body;

  try {
    const userToVerify = await User.findOne({ email }).select(
      "verificationPin verificationPinExpiresAt"
    );

    if (!userToVerify) {
      return res.status(404).json({ msg: "Account not found." });
    }

    if (userToVerify.isVerified) {
      return res
        .status(400)
        .json({ msg: "This email has already been verified. Please log in." });
    }
    console.log(`===============> ${userToVerify}`);
    if (userToVerify.verificationPin !== pin) {
      return res.status(400).json({ msg: "Incorrect PIN. Please try again." });
    }

    if (
      userToVerify.verificationPinExpiresAt &&
      userToVerify.verificationPinExpiresAt <= Date.now()
    ) {
      userToVerify.verificationPin = null;
      userToVerify.verificationPinExpiresAt = null;
      await userToVerify.save();
      return res.status(400).json({
        msg: "PIN has expired. Please register again to receive a new PIN.",
      });
    }

    userToVerify.isVerified = true;
    userToVerify.verificationPin = null;
    userToVerify.verificationPinExpiresAt = null;
    userToVerify.verifiedAt = new Date(); // Record verification time
    await userToVerify.save();

    res.status(200).json({
      success: true,
      msg: "Email verification successful! Your account has been created. You can log in now.",
    });
  } catch (error) {
    console.error("Error in verifyPin:", error.message);
    next(error);
  }
};

// @desc    Authenticate user and set tokens (Access Token & Refresh Token)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Select password and refreshTokens array to manage them
    const user = await User.findOne({ email }).select(
      "+password +refreshTokens"
    ); // Select refreshTokens here

    if (!user || !(await user.comparePassword(password))) {
      console.log("Login failed: Invalid credentials for email:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.isVerified === false) {
      return res.status(401).json({
        msg: "Your account has not been verified. Please check your email for the PIN.",
      });
    }

    const isSecure = process.env.NODE_ENV === "production";
    console.log(
      `Setting cookies. Secure flag: ${isSecure} (NODE_ENV: ${process.env.NODE_ENV})`
    );

    // --- DEBUG LOG: Check cookies BEFORE clearing ---
    console.log("Login: Cookies received BEFORE clearing:", req.cookies);

    // --- CRITICAL FIX: Clear old refreshToken cookie BEFORE setting new one ---
    // Attempt to clear for both /api/auth path and root path /
    // This tries to clear any stale refresh token, regardless of how its path was set previously.
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isSecure, // Use the same secure flag as the one being set
      sameSite: "Lax",
      path: "/api/auth", // Try clearing for the specific path it's currently set on
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isSecure,
      sameSite: "Lax",
      path: "/", // Try clearing for the root path as well, in case an older version set it broadly
    });
    console.log("Cleared old refreshToken cookies (attempted both paths).");

    // 1. Generate Access Token
    const accessToken = generateAccessToken(user._id, user.email);

    // 2. Generate Refresh Token (now also a JWT)
    const refreshToken = generateRefreshToken(user._id); // This is now a JWT string

    // 3. Manage refreshTokens array in user document
    // Filter out expired/invalid refresh tokens from the DB array based on their 'exp' claim
    const validRefreshTokens = [];
    for (const storedToken of user.refreshTokens) {
      try {
        jwt.verify(storedToken, process.env.REFRESH_TOKEN_SECRET, {
          ignoreExpiration: false,
        });
        validRefreshTokens.push(storedToken);
      } catch (err) {
        // Token is expired or invalid, filter it out
        console.log(
          `Login: Filtered out expired/invalid stored refresh token from DB: ${storedToken.substring(
            0,
            20
          )}...`
        );
      }
    }
    user.refreshTokens = validRefreshTokens;
    user.refreshTokens.push(refreshToken); // Add the new refresh token JWT string

    await user.save({ validateBeforeSave: false }); // Do not re-run password hash pre-save hook
    console.log("Saved new refresh token JWT to DB for user:", user._id);

    // 4. Set Access Token as an HTTP-only cookie (short-lived)
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isSecure, // Use 'isSecure' variable
      expires: new Date(Date.now() + 1 * 60 * 1000), // Access token expiry (5 minutes)
      sameSite: "Lax",
      path: "/",
    });
    console.log("Set accessToken cookie.");

    // 5. Set Refresh Token as an HTTP-only cookie (long-lived JWT string)
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isSecure, // Use 'isSecure' variable
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Refresh token expiry (7 days)
      sameSite: "Lax",
      path: "/api/auth", // Important: Refresh token only accessible on auth refresh path
    });
    console.log("Set new refreshToken cookie (JWT).");

    res.json({
      message: "Logged in successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Login process error:", error);
    next(error);
  }
};

// @desc    Refresh Access Token using Refresh Token
// @route   POST /api/auth/refresh-token
// @access  Public (but protected by refresh token)
const refreshTokenHandler = async (req, res, next) => {
  console.log("\n--- Refresh Token endpoint hit! ---");
  console.log("Incoming request cookies:", req.cookies);

  const refreshTokenFromCookie = req.cookies.refreshToken;

  if (!refreshTokenFromCookie) {
    console.log(
      "Refresh failed: No 'refreshToken' cookie found in the request."
    );
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/",
    });
    return res.status(401).json({
      message: "No refresh token provided",
      msg: "NoRefreshTokenProvided",
    });
  }

  // Verify the refresh token JWT
  let decodedRefreshToken;
  try {
    decodedRefreshToken = jwt.verify(
      refreshTokenFromCookie,
      process.env.REFRESH_TOKEN_SECRET
    );
    console.log(
      "Refresh token JWT verified. Decoded payload:",
      decodedRefreshToken
    );
    // Add validation for decoded ID - ensure it's a valid ObjectId format if using MongoDB ObjectIDs
    if (!mongoose.Types.ObjectId.isValid(decodedRefreshToken.id)) {
      // NEW VALIDATION
      console.warn(
        "Refresh failed: Decoded refresh token ID is not a valid MongoDB ObjectId format."
      );
      throw new Error("Invalid ID format in refresh token.");
    }
  } catch (err) {
    console.warn(
      "Refresh failed: 'refreshToken' JWT is invalid or expired during verification.",
      err.message
    );
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/api/auth",
    });
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/",
    });
    if (err.name === "TokenExpiredError") {
      return res.status(403).json({
        message: "Refresh token expired. Please log in again.",
        msg: "RefreshTokenExpired",
      });
    }
    return res.status(403).json({
      message: "Invalid refresh token. Please re-login.",
      msg: "InvalidRefreshToken",
    });
  }

  // Find the user by the ID from the decoded refresh token
  try {
    console.log(
      "Attempting to find user with ID from decoded token:",
      decodedRefreshToken.id
    );
    const user = await User.findById(decodedRefreshToken.id).select(
      "+refreshTokens"
    ); // Select refreshTokens

    console.log(
      "User found by decoded refresh token ID:",
      user ? user._id : "None"
    );

    if (!user) {
      console.log(
        "Refresh failed: User not found from decoded refresh token ID (ID might be incorrect or user deleted)."
      );
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        path: "/api/auth",
      });
      res.clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        path: "/",
      });
      return res.status(403).json({
        message: "User associated with refresh token not found.",
        msg: "UserNotFound",
      });
    }

    // Check if the received refreshTokenFromCookie exists in the user's refreshTokens array in DB
    const isTokenInDb = user.refreshTokens.includes(refreshTokenFromCookie);
    console.log(
      "Is refresh token (from cookie) found in user's DB array?",
      isTokenInDb
    );

    if (!isTokenInDb) {
      console.log(
        "Refresh failed: Refresh token not found in DB array (revoked or not matching a valid session)."
      );
      // This is a critical point. If a token is reused (not found in DB but it was valid once),
      // it could be a replay attack. Consider invalidating all refresh tokens for this user.
      // For now, just clear cookies and force re-login.
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        path: "/api/auth",
      });
      res.clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        path: "/",
      });
      return res.status(403).json({
        message: "Refresh token revoked or invalid.",
        msg: "RefreshTokenRevokedOrInvalid",
      });
    }

    // --- Token Rotation ---
    // Remove the current (used) refresh token from the DB array
    user.refreshTokens = user.refreshTokens.filter(
      (token) => token !== refreshTokenFromCookie
    );

    // Also filter out any other expired/invalid tokens from the array before adding new one
    const validRefreshTokens = [];
    for (const storedToken of user.refreshTokens) {
      try {
        jwt.verify(storedToken, process.env.REFRESH_TOKEN_SECRET, {
          ignoreExpiration: false,
        });
        validRefreshTokens.push(storedToken);
      } catch (err) {
        console.log(
          `Filtered out expired/invalid stored refresh token during rotation cleanup: ${storedToken.substring(
            0,
            20
          )}...`
        );
      }
    }
    user.refreshTokens = validRefreshTokens;
    // --- End Token Rotation Cleanup ---

    // Generate new Access Token and a NEW Refresh Token for the next cycle
    const newAccessToken = generateAccessToken(user._id, user.email);
    const newRefreshToken = generateRefreshToken(user._id); // Generate a brand new refresh token JWT

    // Add the new refresh token to the user's array in DB
    user.refreshTokens.push(newRefreshToken);
    await user.save({ validateBeforeSave: false }); // Save changes to DB

    const isSecure = process.env.NODE_ENV === "production";

    // Set the new access token as an HTTP-only cookie
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: isSecure,
      expires: new Date(Date.now() + 1 * 60 * 1000), // New access token expiry (5 minutes)
      sameSite: "Lax",
      path: "/",
    });
    console.log(
      "Successfully refreshed access token and set new one for user:",
      user._id
    );

    // Set the NEW refresh token as an HTTP-only cookie (IMPORTANT: this replaces the old one in the client)
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: isSecure,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // New refresh token expiry (7 days)
      sameSite: "Lax",
      path: "/api/auth",
    });
    console.log(
      "Successfully set new refresh token cookie for user:",
      user._id
    );

    res.json({
      message: "Access token refreshed successfully",
      msg: "AccessTokenRefreshed",
    });
  } catch (error) {
    console.error("Error during refresh token process:", error);
    next(error); // Pass to general error handler
  }
};

// @desc    Log user out / Clear cookies
// @route   POST /api/auth/logout
// @access  Private (though accessible even without valid token to clear cookies)
const logoutUser = (req, res) => {
  // Clear accessToken cookie
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
  });

  // Clear refreshToken cookie
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/api/auth/refresh-token",
  });

  // TODO: Optional: Invalidate refreshToken in DB if you stored it for revocation
  // E.g., if (req.user && req.user.id) { // req.user comes from `protect` middleware
  //   // Find and remove this specific refresh token from user.refreshTokens array
  //   // await User.findByIdAndUpdate(req.user.id, { $pull: { refreshTokens: req.cookies.refreshToken } });
  // }

  res.status(200).json({ success: true, msg: "Logged out successfully." });
};

module.exports = {
  registerUser,
  verifyPin,
  loginUser,
  refreshTokenHandler,
  logoutUser,
};
