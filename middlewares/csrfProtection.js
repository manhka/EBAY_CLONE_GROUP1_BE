const csrf = require("csurf");
const cookieParser = require("cookie-parser"); // Ensure cookie-parser middleware is used before this

// Initialize CSRF protection middleware with cookie-based tokens
const csrfProtection = csrf({ cookie: true });

// Custom middleware to inject CSRF token into res.locals and handle errors
const applyCsrfProtection = (req, res, next) => {
  csrfProtection(req, res, (err) => {
    if (err) {
      if (err.code === "EBADCSRFTOKEN") {
        // Handle invalid or missing CSRF token
        return res.status(403).json({ msg: "Invalid or missing CSRF token." });
      }
      return next(err); // Pass other errors to the global error handler
    }

    // Attach CSRF token to res.locals for easy access (e.g., Postman, frontend)
    res.locals.csrfToken = req.csrfToken();
    next();
  });
};

module.exports = applyCsrfProtection;
