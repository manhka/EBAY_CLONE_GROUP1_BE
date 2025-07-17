const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

// Import custom middlewares
const applyCsrfProtection = require("./middlewares/csrfProtection");
const errorHandler = require("./middlewares/errorHandler");

// Import route handlers
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const userRoutes = require("./routes/userRoutes");
const storeRoutes = require("./routes/storeRoutes");
const cartRoutes = require("./routes/cartRoutes");
const couponRouter = require("./routes/couponRoutes");
const orderRouter = require("./routes/orderRoutes")
const reviewRoutes = require('./routes/reviewRoute');
const userActivityRoute = require("./routes/userActivityRoute");
const returnRequestRoutes = require("./routes/returnRequestRoutes");

// Load environment variables
dotenv.config();

const app = express();

// --- CORE MIDDLEWARES (chạy trước tiên) ---

// Security Headers
app.use(helmet());

// Rate Limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: "Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau.",
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// CORS Configuration
const allowedOrigin = "http://localhost:3001";
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

// Body Parsers & Cookie Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// HTTP Request Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan("dev"));
}

// Serve static files (uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/csrf-token", applyCsrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// CSRF protection được xử lý bên trong file authRoutes.js
app.use("/api/auth", authRoutes);

app.use("/api", applyCsrfProtection);

app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRouter);
app.use("/api/orders", orderRouter);
app.use('/api/reviews', reviewRoutes);
app.use("/api/user-activity", userActivityRoute);

// Import and use Return Request Routes
app.use("/api/return-requests", applyCsrfProtection, returnRequestRoutes);

// --- Error Handling ---
// This middleware must be placed LAST, after all routes and other middlewares
app.use(errorHandler);

module.exports = app;