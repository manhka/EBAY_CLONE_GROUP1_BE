const express = require("express");
const router = express.Router();
const csrf = require("csurf");
const authController = require("../controllers/authController");

const csrfProtection = csrf({ cookie: true });

router.get("/register", csrfProtection, authController.getRegister);
router.post("/register", csrfProtection, authController.postRegister);
router.get("/verify-email", authController.verifyEmail);

module.exports = router;
