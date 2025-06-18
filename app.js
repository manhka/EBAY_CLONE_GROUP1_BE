// app.js
const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const morgan = require("morgan"); // Logging HTTP requests

// Import custom middlewares
const applyCsrfProtection = require("./middlewares/csrfProtection");
const errorHandler = require("./middlewares/errorHandler");

// Load environment variables
dotenv.config();

const app = express();

// Security Headers with Helmet
app.use(helmet());

// Rate Limiting to prevent brute-force attacks
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau.",
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  })
);

// Body Parsers for JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie Parser
app.use(cookieParser());

// HTTP Request Logger (useful for debugging)
app.use(morgan("dev")); // 'dev' format for concise, colored output

// CORS Configuration
// Allow requests from your frontend (even if not present yet, good practice)
const allowedOrigin = "http://localhost:3001";
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true, // Allow cookies to be sent (needed for CSRF)
  })
);

// CSRF Protection Middleware
// This must come AFTER cookieParser and BEFORE any routes that you want to protect.
app.use(applyCsrfProtection);

// --- API Endpoints ---

app.get("/api/csrf-token", applyCsrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
// Import and use Auth Routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);
const userRoutes = require("./routes/userRoutes");
app.use("/api/", userRoutes);
// --- Error Handling ---
// This middleware must be placed LAST, after all routes and other middlewares
app.use(errorHandler);

module.exports = app;
