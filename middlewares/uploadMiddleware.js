const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Define the upload directory
const uploadDir = "uploads/";

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created upload directory: ${path.resolve(uploadDir)}`);
}

// Configure file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Get the original extension of the file
    const ext = path.extname(file.originalname);
    // Get the filename without extension, replace spaces with hyphens, and remove other problematic characters
    const filenameWithoutExt = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "-") // Replace one or more spaces with a hyphen
      .replace(/[^a-zA-Z0-9-.]/g, ""); // Remove characters that are not letters, numbers, hyphens, or periods

    // Generate unique filename with timestamp + cleaned filename + original extension
    cb(null, Date.now() + "-" + filenameWithoutExt + ext);
  },
});

// Main Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Filter allowed file types
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/gif"
    ) {
      cb(null, true);
    } else {
      cb(
        new Error("Unsupported file format. Only JPG, PNG, GIF are allowed."),
        false
      );
    }
  },
});

// Export specific Multer middleware functions
exports.singleUpload = (fieldName) => upload.single(fieldName);
exports.arrayUpload = (fieldName, maxCount) =>
  upload.array(fieldName, maxCount);
exports.fieldsUpload = (fields) => upload.fields(fields);
exports.noFileUpload = upload.none();
