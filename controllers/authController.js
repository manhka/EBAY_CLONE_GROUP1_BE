const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendVerificationEmail } = require("../services/emailService");

exports.getRegister = (req, res) => {
  res.render("auth/register", { csrfToken: req.csrfToken() });
};

exports.postRegister = async (req, res) => {
  const { email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.render("auth/register", {
      csrfToken: req.csrfToken(),
      error: "Email đã tồn tại.",
    });
  }

  const hashed = await bcrypt.hash(password, 12);
  const token = jwt.sign({ email, password: hashed }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  try {
    await sendVerificationEmail(email, token);
    res.render("auth/verify", { email });
  } catch (err) {
    res.render("auth/register", {
      csrfToken: req.csrfToken(),
      error: "Không thể gửi email xác thực.",
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
    const { email, password } = decoded;

    const exists = await User.findOne({ email });
    if (exists) return res.send("Tài khoản đã tồn tại.");

    await User.create({ email, password });
    res.send("✅ Xác thực thành công! Bạn có thể đăng nhập.");
  } catch (err) {
    res.send("❌ Token không hợp lệ hoặc đã hết hạn.");
  }
};
