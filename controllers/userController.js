const UserInformation = require("../models/UserInformation"); // Adjust the path as needed to your UserInformation model

// @desc    Get user profile (View)
// @route   GET /api/user-profile/:userId
// @access  Private (Typically requires authentication and authorization)
//          An authenticated user usually views their own profile, or an admin views any profile.
exports.getUserProfile = async (req, res) => {
  try {
    // In a real application, if authentication is in place, you would get the userId from
    // the authenticated user object (e.g., req.user.id) to ensure a user can only
    // fetch their own profile, unless it's an admin endpoint.
    // For this example, we're using req.params.userId.
    const userId = req.params.userId;

    // Find the user profile by the 'userId' field in the schema
    // .populate('userId') is used if you want to fetch details from the 'User' model
    // that this UserInformation document references. Make sure your 'User' model is also defined.
    const userProfile = await UserInformation.findOne({
      userId: userId,
    }).populate("userId");

    if (!userProfile) {
      return res
        .status(404)
        .json({ message: "User profile not found for this user ID." });
    }

    // If found, send the profile data
    res.status(200).json({
      message: "User profile fetched successfully.",
      profile: userProfile,
    });
  } catch (error) {
    console.error(
      `Error fetching user profile for ID ${req.params.userId}:`,
      error
    );
    // Handle specific Mongoose errors or general server errors
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid User ID format." });
    }
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/user-profile/:userId
// @access  Private (Typically requires authentication and authorization)
//          An authenticated user should only be able to update their own profile.
exports.updateUserProfile = async (req, res) => {
  try {
    // Again, in a real authenticated system, you'd verify `req.params.userId`
    // matches `req.user.id` or check for admin privileges.
    const userIdToUpdate = req.params.userId;
    const updateData = req.body; // The data sent in the request body to update

    // Ensure we don't allow updating the 'userId' field itself through this endpoint
    // If updateData contains userId, remove it to prevent accidental changes.
    if (updateData.userId) {
      delete updateData.userId;
    }

    // Find the document by its 'userId' field and update it
    // options:
    // - new: true -> Returns the updated document instead of the original
    // - runValidators: true -> Ensures Mongoose schema validators (like regex) run on update
    // - context: 'query' -> Necessary for some validators like 'unique' to work correctly with findOneAndUpdate
    const updatedProfile = await UserInformation.findOneAndUpdate(
      { userId: userIdToUpdate }, // Query to find the document by its userId
      { $set: updateData }, // Use $set to update only the fields provided in updateData
      {
        new: true,
        runValidators: true,
        context: "query", // Important for certain validations during update
      }
    );

    if (!updatedProfile) {
      // If no document was found with the given userId
      return res
        .status(404)
        .json({ message: "User profile not found for this user ID." });
    }

    // If update was successful, send back the updated profile
    res.status(200).json({
      message: "User profile updated successfully.",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error(
      `Error updating user profile for ID ${req.params.userId}:`,
      error
    );

    // Handle Mongoose validation errors (e.g., regex mismatch, required field missing)
    if (error.name === "ValidationError") {
      const errors = {};
      // Iterate over validation errors to extract messages
      for (let field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return res.status(400).json({ message: "Validation error.", errors });
    }
    // Handle unique constraint errors (e.g., if you had an email field and tried to set a duplicate)
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Duplicate field value entered.",
        field: error.keyValue,
      });
    }
    // Handle general server errors
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// You might also need a 'create' controller if users register and then create their profile
// @desc    Create a new user profile
// @route   POST /api/user-profile
// @access  Private (Typically done after user registration)
exports.createUserProfile = async (req, res) => {
  try {
    // In a real app, userId would likely come from the authenticated user (req.user.id)
    // This prevents users from creating profiles for arbitrary user IDs.
    const { userId, fullName, phone, street, city, state, country, isDefault } =
      req.body;

    // Check if a profile for this userId already exists (due to unique: true on userId)
    const existingProfile = await UserInformation.findOne({ userId });
    if (existingProfile) {
      return res.status(409).json({
        message:
          "User profile for this user ID already exists. Use PUT to update it.",
      });
    }

    const newUserProfile = new UserInformation({
      userId,
      fullName,
      phone,
      street,
      city,
      state,
      country,
      isDefault,
    });

    const savedProfile = await newUserProfile.save();
    res.status(201).json({
      message: "User profile created successfully.",
      profile: savedProfile,
    });
  } catch (error) {
    console.error("Error creating user profile:", error);
    if (error.name === "ValidationError") {
      const errors = {};
      for (let field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return res.status(400).json({ message: "Validation error.", errors });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Duplicate user ID, profile already exists.",
        field: error.keyValue,
      });
    }
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};
