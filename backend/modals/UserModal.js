const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // Name is required for both Google and Facebook sign-in
  },
  nicNo: {
    type: String,
    default: "", // nicNo can be empty if not provided
    unique: true, // Ensure nicNo is unique if provided
    sparse: true, // Allow unique constraint on fields that may be null or empty
  },
  contactNo: {
    type: String,
    default: "", // contactNo can be empty if not provided
    unique: true, // Ensure contactNo is unique if provided
    sparse: true, // Allow unique constraint on fields that may be null or empty
  },
  email: {
    type: String,
    default: "", // Email can be empty if not provided
    unique: true, // Ensure email is unique if provided
    sparse: true, // Allow unique constraint on fields that may be null or empty
  },
  password: {
    type: String,
    default: "", // Password will be empty for OAuth-based sign-ins
  },
});

module.exports = mongoose.model("User", userSchema);
