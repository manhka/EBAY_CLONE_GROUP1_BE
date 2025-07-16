const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const verifyToken = require("../middlewares/verifyToken");
const { singleUpload } = require("../middlewares/uploadMiddleware");


router.get("/user-profile/", verifyToken, userController.getUserProfile);

router.put(
  "/user-profile/",
  verifyToken,
  singleUpload("avatar"),
  userController.updateUserProfile
);

router.post(
  "/user-profile",
  verifyToken,
  singleUpload("avatar"),
  userController.createUserProfile
);

router.get("/user-addresses", verifyToken, userController.getUserAddresses);

router.post("/user-information", verifyToken, userController.addUserAddress);

module.exports = router;
