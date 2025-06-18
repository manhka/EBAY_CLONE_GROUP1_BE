const errorHandler = (err, req, res, next) => {
  console.error(err.stack); // Log full error stack for debugging

  // Use existing response status code if set, otherwise default to 500 (Internal Server Error)
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || "An error occurred on the server.";

  // Handle specific Mongoose "CastError" (invalid ObjectId)
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found.";
  }

  // Handle MongoDB duplicate key error (e.g., email already exists)
  if (err.code === 11000) {
    statusCode = 400;
    message = `Duplicate field value: '${
      Object.keys(err.keyValue)[0]
    }' already exists.`;
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    // Collect all validation error messages into a single string
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // Handle JWT invalid token error
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token.";
  }

  // Handle JWT expired token error
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token has expired.";
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    // Include stack trace only in development environment for debugging
    // error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
