// D:\EBAY_CLONE\ebay_clone_be\controllers\authController.js

const { validationResult } = require("express-validator");
const User = require("../models/User");
const jwt = require("jsonwebtoken"); // Still needed for jwt.verify in refreshTokenHandler

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

  const { email, password } = req.body;

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

  const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes

  try {
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ msg: "Invalid email or password." });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        msg: "Your account has not been verified. Please check your email for the PIN.",
      });
    }

    // --- Generate Access Token and Refresh Token using helpers ---
    const accessToken = generateAccessToken(user._id, user.email);
    const refreshToken = generateRefreshToken(user._id);

    // TODO: Optional but Recommended: Save Refresh Token to DB for revocation purposes
    // If you add a `refreshTokens: [String]` array to your User model:
    // user.refreshTokens.push(refreshToken);
    // await user.save();

    // --- Set Access Token Cookie ---
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
      sameSite: "Lax",
      path: "/", // Or '/api' if all your API routes are under '/api'
    });

    // --- Set Refresh Token Cookie ---
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
      sameSite: "Lax",
      path: "/api/auth/refresh-token", // IMPORTANT: Restrict to refresh endpoint
    });

    res.status(200).json({
      success: true,
      msg: "Login successful!",
      user: {
        // Return non-sensitive user info for frontend display/state
        id: user._id,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Error in loginUser:", error.message);
    next(error);
  }
};

// @desc    Refresh Access Token using Refresh Token
// @route   POST /api/auth/refresh-token
// @access  Public (but requires valid refreshToken cookie)
const refreshTokenHandler = async (req, res, next) => {
  const oldRefreshToken = req.cookies.refreshToken;

  if (!oldRefreshToken) {
    return res.status(401).json({ msg: "NoRefreshTokenProvided" });
  }

  try {
    // 1. Verify the old Refresh Token
    const decoded = jwt.verify(
      oldRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // 2. Find the user based on the ID from the Refresh Token
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ msg: "UserNotFoundForRefreshToken" });
    }

    // TODO: Optional but Recommended: Check if the oldRefreshToken is actually stored for this user in DB
    // This helps prevent reuse of revoked refresh tokens and improves security.
    if (!user.refreshTokens || !user.refreshTokens.includes(oldRefreshToken)) {
      // If refresh token is not found or is blacklisted, consider it stolen.
      // Invalidate all refresh tokens for this user for security (logout all devices).
      // user.refreshTokens = []; await user.save();
      return res.status(401).json({ msg: "RefreshTokenRevokedOrInvalid" });
    }

    // 3. Generate NEW Access Token and NEW Refresh Token (Token Rotation)
    const newAccessToken = generateAccessToken(user._id, user.email);
    const newRefreshToken = generateRefreshToken(user._id);

    // TODO: Optional but Recommended: Update Refresh Token in DB (remove old, add new)
    // user.refreshTokens = user.refreshTokens.filter(token => token !== oldRefreshToken);
    // user.refreshTokens.push(newRefreshToken);
    // await user.save();

    const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
    const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;

    // 4. Set NEW Access Token Cookie
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
      sameSite: "Lax",
      path: "/",
    });

    // 5. Set NEW Refresh Token Cookie (with updated expiry and value)
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
      sameSite: "Lax",
      path: "/api/auth/refresh-token",
    });

    res
      .status(200)
      .json({ success: true, msg: "Token has been refreshed successfully." });
  } catch (err) {
    console.error("Error refreshing token:", err.message);
    // If Refresh Token is expired or invalid, force user to log in again
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ msg: "RefreshTokenExpired" });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ msg: "RefreshTokenInvalid" });
    }
    next(err);
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
