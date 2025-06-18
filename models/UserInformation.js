const mongoose = require("mongoose");

const userInformationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "User ID is required."],
      ref: "User",
      unique: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required."],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters long."],
      maxlength: [100, "Full name cannot exceed 100 characters."],
      match: [
        /^[a-zA-Z\u00C0-\u1EF9\s\-\.]+$/,
        "Full name can only contain letters, spaces, hyphens, and periods.",
      ],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required."],
      trim: true,
      match: [
        /^\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/,
        "Please enter a valid phone number.",
      ],
    },
    street: {
      type: String,
      required: [true, "Street address is required."],
      trim: true,
      minlength: [3, "Street address must be at least 3 characters long."],
      maxlength: [200, "Street address cannot exceed 200 characters."],
      match: [
        /^[a-zA-Z0-9\u00C0-\u1EF9\s\-\.,\/]+$/,
        "Street address can only contain letters, numbers, spaces, hyphens, commas, periods, and slashes.",
      ],
    },
    city: {
      type: String,
      required: [true, "City is required."],
      trim: true,
      minlength: [2, "City name must be at least 2 characters long."],
      maxlength: [100, "City cannot exceed 100 characters."],
      // Allows letters, spaces, hyphens, and Vietnamese diacritics
      match: [
        /^[a-zA-Z\u00C0-\u1EF9\s\-\.]+$/,
        "City can only contain letters, spaces, hyphens, and periods.",
      ],
    },
    state: {
      type: String,
      required: [true, "State/Province is required."],
      trim: true,
      minlength: [2, "State/Province name must be at least 2 characters long."],
      maxlength: [100, "State/Province cannot exceed 100 characters."],
      match: [
        /^[a-zA-Z\u00C0-\u1EF9\s\-\.]+$/,
        "State/Province can only contain letters, spaces, hyphens, and periods.",
      ],
    },
    country: {
      type: String,
      required: [true, "Country is required."],
      trim: true,
      minlength: [2, "Country name must be at least 2 characters long."],
      maxlength: [50, "Country name cannot exceed 50 characters."],
      match: [/^[a-zA-Z\s]+$/, "Country can only contain letters and spaces."],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const UserInformation = mongoose.model(
  "UserInformation",
  userInformationSchema
);

module.exports = UserInformation;
