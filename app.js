const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

// Load biến môi trường
dotenv.config();

const app = express();

// Middleware bảo mật
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau.",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS cho phép React frontend truy cập
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// CSRF
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Endpoint để React frontend lấy CSRF token nếu cần
app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// API Routes
const authRouter = require("./routes/authRoutes");

// app.use("/api/auth", authRouter);

// (Tuỳ chọn) Nếu bạn build React trong cùng thư mục server
const clientBuildPath = path.join(__dirname, "client", "build");
app.use(express.static(clientBuildPath));

// Bắt mọi route còn lại và trả về React app
// app.get("*", (req, res) => {
//   res.sendFile(path.join(clientBuildPath, "index.html"));
// });

// CSRF error handling
app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    return res.status(403).json({ msg: "Token CSRF không hợp lệ hoặc thiếu" });
  }
  next(err);
});

module.exports = app;
