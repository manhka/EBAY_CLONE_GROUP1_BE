const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const verifyToken = require("../middlewares/verifyToken");
// GET /api/user-profile/:userId
router.get("/user-profile/:userId", verifyToken, userController.getUserProfile);

// PUT /api/user-profile/:userId
// router.put("/user-profile/:userId", userController.updateUserProfile);

// POST /api/user-profile
router.post("/user-profile", userController.createUserProfile);

module.exports = router;
