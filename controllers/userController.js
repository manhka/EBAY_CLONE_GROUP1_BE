const User = require("../models/User");
const UserInformation = require("../models/UserInformation"); // Adjust the path as needed to your UserInformation model
const mongoose = require("mongoose");
// @desc    Get user profile (View)
// @route   GET /api/user-profile/:userId
// @access  Private (Typically requires authentication and authorization)
//          An authenticated user usually views their own profile, or an admin views any profile.
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const objectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;
    const userProfile = await UserInformation.findOne({
      user: objectId,
    });
    const userProfileResponse = {
      username: user.username,
      email: user.email,
      fullName: userProfile?.fullName,
      phone: userProfile?.phone,
      birthday: userProfile?.birthday,
      isDefault: userProfile?.isDefault,
      street: userProfile?.street,
      country: userProfile?.country,
      state: userProfile?.state,
      city: userProfile?.city,
      avatar: userProfile?.avatar,
    };

    // If found, send the profile data
    res.status(200).json({
      message: "User profile fetched successfully.",
      profile: userProfileResponse,
    });
  } catch (error) {
    console.error(error);
    // Handle specific Mongoose errors or general server errors
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid User ID format." });
    }
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// Handles updating an existing user profile
exports.updateUserProfile = async (req, res) => {
  try {
    // Identify the user whose profile is being updated.
    // This ID comes from your authentication middleware (e.g., JWT payload).
    const userId = req.user.id;

    // Validate the userId format from the authentication middleware
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID format." });
    }

    // req.body contains all non-file form fields after Multer processes the request.
    let updateData = { ...req.body };

    console.log("Received text data (req.body) for update:", updateData);
    console.log("Received file data (req.file) for update:", req.file);

    // Remove fields that should not be directly updated from the client payload
    // These are usually handled by the system or are internal IDs.
    const forbiddenFields = ["_id", "user", "userId"]; // 'user' links to User model
    forbiddenFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        // Check for undefined to prevent deleting actual data
        delete updateData[field];
      }
    });

    // Handle profile picture update if a new file was uploaded
    if (req.file) {
      // Multer stores the file. Construct the URL/path to save in the database.
      const newAvatarUrl = `/uploads/${req.file.filename}`; // This assumes local storage
      // In production, this would be a public URL from Cloudinary/S3/GCS after uploading req.file.

      // Assign to profilePictureUrl, consistent with the database schema and frontend expectation
      updateData.avatar = newAvatarUrl;
      console.log(`New avatar uploaded: ${newAvatarUrl}`);
    } else {
      // If no new file is uploaded, and the frontend sent an empty string or null for 'avatar',
      // it means the user wants to remove the existing profile picture.
      // Or if the frontend didn't send 'avatar' key at all, it means no change to existing.
      // It depends on your frontend's logic for clearing an image.
      // If frontend sends an empty string for avatar, explicitly set profilePictureUrl to null.
      if (updateData.avatar === "") {
        // Assuming frontend sends empty string to clear
        updateData.profilePictureUrl = null;
        console.log("Profile picture cleared.");
      }
      // If req.file is undefined and updateData.avatar is not explicitly cleared,
      // it means no change was requested for the profile picture, so leave existing profilePictureUrl untouched.
      delete updateData.avatar; // Remove the temporary 'avatar' field from updateData
    }

    // Convert birthday from "yyyy-MM-dd" string to Date object for Mongoose
    if (updateData.birthday) {
      updateData.birthday = new Date(updateData.birthday);
    } else if (updateData.birthday === "") {
      updateData.birthday = null; // Set to null if an empty string is sent to clear it
    }

    // Find and update the user profile document in the database
    const updatedProfile = await UserInformation.findOneAndUpdate(
      { user: userId }, // Query: Find the document linked to this userId
      { $set: updateData }, // Update: Apply only the fields present in updateData
      {
        new: true, // Option: Return the updated document after the update is applied
        runValidators: true, // Option: Run Mongoose schema validators on the update operation
        upsert: false, // Option: Do NOT create a new document if one is not found (this is for PUT, not POST)
        context: "query", // Option: Important for some Mongoose validators (e.g., unique validation)
      }
    );

    // If no profile document was found for the given userId
    if (!updatedProfile) {
      return res.status(404).json({
        message: "User profile information not found. Please create one first.",
      });
    }

    // Send a success response with the newly updated profile data
    res.status(200).json({
      message: "Thông tin hồ sơ người dùng đã được cập nhật thành công.",
      profile: updatedProfile, // Send back the updated document
    });
  } catch (error) {
    console.error(
      `Lỗi khi cập nhật hồ sơ người dùng cho ID ${req.user.id}:`,
      error
    );

    // --- Error Handling for Multer specific errors ---
    if (error instanceof multer.MulterError) {
      return res
        .status(400)
        .json({ message: `File upload error: ${error.message}` });
    }
    // Custom error messages from fileFilter in uploadMiddleware
    if (
      error.message === "Unsupported file format." ||
      error.message.includes("File too large")
    ) {
      return res.status(400).json({ message: error.message });
    }

    // --- Error Handling for Mongoose Validation errors ---
    // Occurs if data doesn't match schema (e.g., required field missing, invalid type)
    if (error.name === "ValidationError") {
      const errors = {};
      for (let field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return res.status(400).json({ message: "Validation error.", errors });
    }
    // --- Error Handling for Duplicate key errors ---
    // Occurs if a field with `unique: true` constraint receives a duplicate value
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0]; // Get the field that caused the duplicate
      return res.status(409).json({
        // 409 Conflict is appropriate for resource conflicts
        message: `Value '${error.keyValue[field]}' for field '${field}' already exists. Please choose a different value.`,
        field: field, // Send back the problematic field for frontend to highlight
      });
    }
    // --- Generic Server Error ---
    // Catch-all for any other unexpected errors
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};
// You might also need a 'create' controller if users register and then create their profile
// @desc    Create a new user profile
// @route   POST /api/user-profile
// @access  Private (Typically done after user registration)
exports.createUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // User ID from authentication middleware
    console.log("Request Body:", req.body); // Log req.body to see text fields
    console.log("Request File:", req.file); // Log req.file to see uploaded file details

    // Access text fields directly from req.body after Multer has processed them
    // Note: 'avatar' will NOT be in req.body. It's in req.file.
    const {
      fullName,
      phone,
      street,
      city,
      state,
      country,
      isDefault,
      birthday,
      // Do NOT destructure 'avatar' from req.body here
    } = req.body;

    // Optional: Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID format." });
    }

    // Check if a profile for this userId already exists (prevent duplicates)
    // IMPORTANT: Ensure your UserInformation schema has a field named 'user'
    // that references the User model's _id, and that it's set as unique if appropriate.
    const existingProfile = await UserInformation.findOne({ user: userId });
    if (existingProfile) {
      return res.status(409).json({
        message:
          "User profile for this user ID already exists. Use PUT to update it.",
      });
    }

    // Construct the new user profile object
    const newProfileData = {
      user: userId, // Link to the authenticated user's ID
      fullName,
      phone,
      street,
      city,
      state,
      country,
      isDefault,
      // Convert birthday string (YYYY-MM-DD) to Date object if needed
      birthday: birthday ? new Date(birthday) : null,
    };

    // Handle the uploaded avatar file
    if (req.file) {
      // If a file was uploaded, req.file contains its details.
      // Store the path where Multer saved it, or a public URL if uploaded to cloud storage.
      newProfileData.avatar = `/uploads/${req.file.filename}`;
      console.log("Avatar file processed:", newProfileData.avatar);
    } else {
      // If no file was uploaded, set a default or leave it empty/null
      newProfileData.avatar =
        "http://bootdey.com/img/Content/avatar/avatar1.png"; // Default avatar
      console.log("No avatar file uploaded. Using default.");
    }

    // Create and save the new UserInformation document
    const newUserProfile = new UserInformation(newProfileData);
    const savedProfile = await newUserProfile.save();

    res.status(201).json({
      // 201 Created status for successful creation
      message: "User profile created successfully.",
      profile: savedProfile,
    });
  } catch (error) {
    console.error("Error creating user profile:", error);

    // Handle Multer errors (e.g., file size, invalid format)
    if (
      error.message &&
      (error.message.includes("Unsupported file format.") ||
        error.message.includes("File too large"))
    ) {
      return res.status(400).json({ message: error.message });
    }

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const errors = {};
      for (let field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return res.status(400).json({ message: "Validation error.", errors });
    }
    // Handle duplicate key errors (e.g., if 'user' field is unique and a profile already exists)
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({
        // Use 409 Conflict for duplicate resource
        message: `Duplicate entry for field '${field}'. A profile for this user may already exist.`,
        field: field,
      });
    }
    // Generic server error
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};
