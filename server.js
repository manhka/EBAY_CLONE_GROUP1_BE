const app = require("./app");
const connectDB = require("./config/db");
const dotenv = require("dotenv");

dotenv.config(); // Ensure environment variables are loaded from .env file

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
