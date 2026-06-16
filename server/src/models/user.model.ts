import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isVerified: {
    type: String,
    required: true,
  },
  cvUrl: {
    type: String,
  },
  idUrl: {
    type: String,
  },
  profileImageUrl: {
    type: String,
  },
  role: {
    type: String,
    enum: ["User", "Admin", "company"],
    default: "User",
  },
  skills: {
    type: [String],
    default: [],
  },
  // Password reset — store SHA-256 hash of the token, never the raw value.
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  // Email verification — store SHA-256 hash of the 6-digit OTP.
  emailVerificationToken: {
    type: String,
  },
  emailVerificationExpires: {
    type: Date,
  },
});

const User = mongoose.model("User", userSchema);

export default User;
