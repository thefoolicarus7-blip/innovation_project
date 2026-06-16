import mongoose from "mongoose";

export type UserRole = "User" | "Admin" | "company";

export interface UserDocument extends mongoose.Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isVerified: string;
  role: UserRole;
  cvUrl?: string;
  idUrl?: string;
  profileImageUrl?: string;
  skills: string[];
  resetToken?: string;
  resetTokenExpiry?: number;
  verificationCode?: string;
  verificationCodeExpiry?: number;
}

const userSchema = new mongoose.Schema<UserDocument>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    isVerified: { type: String, required: true, default: "false" },
    role: {
      type: String,
      required: true,
      enum: ["User", "Admin", "company"],
    },
    cvUrl: { type: String, default: undefined },
    idUrl: { type: String, default: undefined },
    profileImageUrl: { type: String, default: undefined },
    skills: { type: [String], default: [] },
    resetToken: { type: String, default: undefined },
    resetTokenExpiry: { type: Number, default: undefined },
    verificationCode: { type: String, default: undefined },
    verificationCodeExpiry: { type: Number, default: undefined },
  },
  {
    versionKey: false,
  },
);

const User = mongoose.models.User || mongoose.model<UserDocument>("User", userSchema);

export default User;
