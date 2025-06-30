const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const verifyToken = require("../middlewares/verifyToken");
const { singleUpload } = require("../middlewares/uploadMiddleware");

// GET /api/user-profile/:userId
router.get("/user-profile/", verifyToken, userController.getUserProfile);

// PUT /api/user-profile/:userId
router.put(
  "/user-profile/",
  verifyToken,
  singleUpload("avatar"),
  userController.updateUserProfile
);

// POST /api/user-profile
router.post(
  "/user-profile",
  verifyToken,
  singleUpload("avatar"),
  userController.createUserProfile
);

module.exports = router;
