import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";

import User from "../models/user.model.js";
import Candidate from "../models/candidate.model.js";
import { generateCvSummary } from "../services/ai.service.js";
import { sendPasswordResetEmail, sendVerificationEmail, verifyEmailExistence } from "../services/email.service.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-jwt-secret";
const JWT_EXPIRES_IN = "7d";
const PASSWORD_SALT_ROUNDS = 10;
const TOKEN_COOKIE_NAME = "token";

function signAuthToken(userId: string, email: string, role: string) {
  return jwt.sign(
    {
      userId,
      email,
      role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

// sameSite "none" is required for cross-domain cookies.
// sameSite "none" mandates secure:true (HTTPS).
// In local dev over HTTP, use sameSite "lax" instead so cookies still work.
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: (IS_PRODUCTION ? "none" : "lax") as "none" | "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function setAuthCookie(response: Response, token: string) {
  response.cookie(TOKEN_COOKIE_NAME, token, COOKIE_OPTIONS);
}

export function validatePassword(password: string): { isValid: boolean; reason?: string } {
  if (password.length < 8) {
    return { isValid: false, reason: "Password must be at least 8 characters long." };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, reason: "Password must contain at least one uppercase letter." };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, reason: "Password must contain at least one lowercase letter." };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, reason: "Password must contain at least one number." };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { isValid: false, reason: "Password must contain at least one special character." };
  }
  return { isValid: true };
}

export async function registerUser(request: Request, response: Response) {
  const { firstName, lastName, email, password, role } = request.body as {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    role?: string;
  };

  if (!firstName || !lastName || !email || !password) {
    response.status(400).json({
      message: "firstName, lastName, email and password are required",
    });
    return;
  }

  try {
    const normalizedEmail = email.toLowerCase();

    // Validate password complexity
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      response.status(400).json({ message: passwordValidation.reason });
      return;
    }

    // 1. Validate email existence and format
    const emailValidation = await verifyEmailExistence(normalizedEmail);
    if (!emailValidation.isValid) {
      response.status(400).json({ message: emailValidation.reason });
      return;
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      response
        .status(409)
        .json({ message: "User with this email already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

    // 2. Generate 6-digit verification code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashedPassword,
      isVerified: IS_DEVELOPMENT ? "true" : "false",
      role: (role ?? "User") as "User" | "Admin" | "company",
      skills: [],
      verificationCode: otp,
      verificationCodeExpiry: otpExpiry,
    });

    // 3. Send verification email
    try {
      await sendVerificationEmail(normalizedEmail, otp);
    } catch (emailError) {
      console.error("[register] failed to send verification email:", emailError);
    }

    const token = signAuthToken(String(user._id), user.email, user.role);
    setAuthCookie(response, token);

    response.status(201).json({
      token,
      user: {
        id: String(user._id),
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
      },
    });
  } catch (error) {
    response
      .status(500)
      .json({
        error:
          error instanceof Error ? error.message : "Unable to register user",
      });
  }
}

export async function loginUser(request: Request, response: Response) {
  const { email, password } = request.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    response.status(400).json({ message: "email and password are required" });
    return;
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      response.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      response.status(401).json({ message: "Invalid email or password" });
      return;
    }

    if (user.isVerified !== "true") {
      response.status(403).json({
        message: "Email not verified",
        email: user.email,
      });
      return;
    }

    const token = signAuthToken(String(user._id), user.email, user.role);
    setAuthCookie(response, token);

    response.status(200).json({
      token,
      user: {
        id: String(user._id),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`,
      },
    });
  } catch {
    response.status(500).json({ message: "Unable to login user" });
  }
}

export async function loginCompanyUser(request: Request, response: Response) {
  const { email, password } = request.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    response.status(400).json({ message: "email and password are required" });
    return;
  }

  try {
    const user = await User.findOne({
      email: email.toLowerCase(),
      role: { $in: ["company", "Admin"] },
    });

    if (!user) {
      response.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      response.status(401).json({ message: "Invalid credentials" });
      return;
    }

    if (user.isVerified !== "true") {
      response.status(403).json({
        message: "Email not verified",
        email: user.email,
      });
      return;
    }

    const token = signAuthToken(String(user._id), user.email, user.role);
    setAuthCookie(response, token);

    response.status(200).json({
      token,
      user: {
        id: String(user._id),
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        companyId: user.role === "company" ? String(user._id) : undefined,
      },
    });
  } catch {
    response.status(500).json({ message: "Unable to login" });
  }
}

export async function forgotPassword(request: Request, response: Response) {
  const { email } = request.body as { email?: string };

  if (!email) {
    response.status(400).json({ message: "Email is required" });
    return;
  }

  const normalizedEmail = email.toLowerCase();
  console.debug(`[auth] forgotPassword requested for ${normalizedEmail}`);

  try {
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.debug(`[auth] forgotPassword: email not found: ${normalizedEmail}`);
      response.status(200).json({
        message: "If an account exists for that email, a password reset link will be sent.",
        ...(IS_DEVELOPMENT ? { debug: "email_not_found" } : {}),
      });
      return;
    }

    const rawToken = crypto.randomBytes(24).toString("hex");
    user.resetToken = rawToken;
    user.resetTokenExpiry = Date.now() + 1000 * 60 * 60;
    await user.save();

    console.debug(`[auth] generated reset token for ${normalizedEmail}: ${rawToken}`);
    await sendPasswordResetEmail(normalizedEmail, rawToken);

    response.status(200).json({
      message: "Password reset instructions have been sent to your email.",
      resetToken: rawToken,
    });
  } catch (error) {
    console.error("[auth] forgotPassword error:", error);
    response.status(500).json({ message: "Unable to process password reset" });
  }
}

export async function forgotCompanyPassword(request: Request, response: Response) {
  const { email } = request.body as { email?: string };

  if (!email) {
    response.status(400).json({ message: "Email is required" });
    return;
  }

  const normalizedEmail = email.toLowerCase();
  console.debug(`[auth] forgotCompanyPassword requested for ${normalizedEmail}`);

  try {
    const user = await User.findOne({
      email: normalizedEmail,
      role: { $in: ["company", "Admin"] },
    });

    if (!user) {
      console.debug(`[auth] forgotCompanyPassword: email not found or not employer: ${normalizedEmail}`);
      response.status(404).json({
        message: "No employer account found with this email address.",
      });
      return;
    }

    const rawToken = crypto.randomBytes(24).toString("hex");
    user.resetToken = rawToken;
    user.resetTokenExpiry = Date.now() + 1000 * 60 * 60;
    await user.save();

    console.debug(`[auth] generated reset token for company ${normalizedEmail}: ${rawToken}`);
    await sendPasswordResetEmail(normalizedEmail, rawToken, "company/reset-password");

    response.status(200).json({
      message: "Password reset instructions have been sent to your email.",
      resetToken: rawToken,
    });
  } catch (error) {
    console.error("[auth] forgotCompanyPassword error:", error);
    response.status(500).json({ message: "Unable to process password reset" });
  }
}

export async function resetPassword(request: Request, response: Response) {
  const { token, password, confirmPassword } = request.body as {
    token?: string;
    password?: string;
    confirmPassword?: string;
  };

  if (!token || !password || !confirmPassword) {
    response.status(400).json({
      message: "token, password, and confirmPassword are required",
    });
    return;
  }

  if (password !== confirmPassword) {
    response.status(400).json({ message: "Passwords do not match" });
    return;
  }

  // Validate password complexity
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    response.status(400).json({ message: passwordValidation.reason });
    return;
  }

  try {
    const user = await User.findOne({ resetToken: token });

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < Date.now()) {
      response.status(400).json({ message: "Reset token is invalid or expired" });
      return;
    }

    user.password = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    response.status(200).json({ message: "Password updated successfully" });
  } catch {
    response.status(500).json({ message: "Unable to reset password" });
  }
}

export function logoutUser(_request: Request, response: Response) {
  // Must pass the same sameSite/secure/path options that were used when setting
  // the cookie, otherwise the browser ignores the clear instruction.
  response.clearCookie(TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: (IS_PRODUCTION ? "none" : "lax") as "none" | "lax",
  });
  response.status(200).json({ message: "Logged out successfully" });
}

export async function getMyProfile(
  request: AuthenticatedRequest,
  response: Response,
) {
  const userId = request.user?.userId;

  if (!userId) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const user = await User.findById(userId).select("-password");

    if (!user) {
      response.status(404).json({ message: "User not found" });
      return;
    }

    response.status(200).json({
      user: {
        id: String(user._id),
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
        cvUrl: user.cvUrl,
        idUrl: user.idUrl,
        profileImageUrl: user.profileImageUrl,
        companyId: user.role === "company" ? String(user._id) : undefined,
      },
    });
  } catch {
    response.status(500).json({ message: "Unable to fetch user profile" });
  }
}

export async function updateUserDocuments(
  request: AuthenticatedRequest,
  response: Response,
) {
  const userId = request.user?.userId;

  if (!userId) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { cvUrl, idUrl, profileImageUrl } = request.body as {
    cvUrl?: string;
    idUrl?: string;
    profileImageUrl?: string;
  };

  try {
    const user = await User.findById(userId);

    if (!user) {
      response.status(404).json({ message: "User not found" });
      return;
    }

    if (cvUrl) user.cvUrl = cvUrl;
    if (idUrl) user.idUrl = idUrl;
    if (profileImageUrl) user.profileImageUrl = profileImageUrl;

    await user.save();

    response.status(200).json({
      message: "Documents updated successfully",
      user: {
        id: String(user._id),
        cvUrl: user.cvUrl,
        idUrl: user.idUrl,
        profileImageUrl: user.profileImageUrl,
        isVerified: user.isVerified,
      },
    });
  } catch {
    response.status(500).json({ message: "Unable to update documents" });
  }
}

export async function getMyCv(
  request: AuthenticatedRequest,
  response: Response,
) {
  const userId = request.user?.userId;
  if (!userId) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const candidate = await Candidate.findOne({ id: userId });
    response.status(200).json({ cv: candidate ?? null });
  } catch {
    response.status(500).json({ message: "Unable to fetch CV" });
  }
}

export async function saveMyCV(
  request: AuthenticatedRequest,
  response: Response,
) {
  const userId = request.user?.userId;
  if (!userId) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { fullName, email, phone, yearsOfExperience, skills, education, summary } =
    request.body as {
      fullName?: string;
      email?: string;
      phone?: string;
      yearsOfExperience?: number;
      skills?: string[];
      education?: string;
      summary?: string;
    };

  if (!fullName || !email || !phone || yearsOfExperience === undefined || !education || !summary) {
    response.status(400).json({
      message: "fullName, email, phone, yearsOfExperience, education and summary are required",
    });
    return;
  }

  try {
    const candidate = await Candidate.upsert(userId, {
      fullName,
      email,
      phone,
      yearsOfExperience: Number(yearsOfExperience),
      skills: Array.isArray(skills) ? skills : [],
      education,
      summary,
    });

    // Also update the user's skills so job matching works
    const user = await User.findById(userId);
    if (user && Array.isArray(skills) && skills.length > 0) {
      user.skills = skills;
      await user.save();
    }

    response.status(200).json({ cv: candidate });
  } catch {
    response.status(500).json({ message: "Unable to save CV" });
  }
}

export async function generateSummaryForCV(
  request: AuthenticatedRequest,
  response: Response,
) {
  const userId = request.user?.userId;
  if (!userId) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { fullName, yearsOfExperience, education, skills } = request.body as {
    fullName?: string;
    yearsOfExperience?: number;
    education?: string;
    skills?: string[];
  };

  if (!fullName || yearsOfExperience === undefined || !education || !skills?.length) {
    response.status(400).json({
      message: "fullName, yearsOfExperience, education and skills are required",
    });
    return;
  }

  try {
    const summary = await generateCvSummary({
      fullName,
      yearsOfExperience: Number(yearsOfExperience),
      education,
      skills,
    });
    response.status(200).json({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate summary";
    response.status(500).json({ message });
  }
}

export async function verifyEmail(request: Request, response: Response) {
  const { code, email } = request.body as { code?: string; email?: string };

  const userEmail = email || (request as AuthenticatedRequest).user?.email;

  if (!code) {
    response.status(400).json({ message: "Incorrect verification code" }); // keep it friendly
    return;
  }

  if (!userEmail) {
    response.status(400).json({ message: "Email is required" });
    return;
  }

  try {
    const user = await User.findOne({ email: userEmail.toLowerCase() });

    if (!user) {
      response.status(404).json({ message: "User not found" });
      return;
    }

    if (user.isVerified === "true") {
      response.status(200).json({ message: "Email is already verified" });
      return;
    }

    if (!user.verificationCode || user.verificationCode !== code.trim()) {
      response.status(400).json({ message: "Incorrect verification code" });
      return;
    }

    if (!user.verificationCodeExpiry || user.verificationCodeExpiry < Date.now()) {
      response.status(400).json({ message: "Expired verification code" });
      return;
    }

    user.isVerified = "true";
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    await user.save();

    response.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    response.status(500).json({ message: "Unable to verify email" });
  }
}

export async function resendVerificationCode(request: Request, response: Response) {
  const { email } = request.body as { email?: string };

  const userEmail = email || (request as AuthenticatedRequest).user?.email;

  if (!userEmail) {
    response.status(400).json({ message: "Email is required" });
    return;
  }

  try {
    const user = await User.findOne({ email: userEmail.toLowerCase() });

    if (!user) {
      response.status(404).json({ message: "User not found" });
      return;
    }

    if (user.isVerified === "true") {
      response.status(400).json({ message: "Email is already verified" });
      return;
    }

    // Generate new code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = otp;
    user.verificationCodeExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    try {
      await sendVerificationEmail(user.email, otp);
    } catch (emailError) {
      console.error("[resend] failed to send verification email:", emailError);
      response.status(500).json({ message: "Failed email delivery" });
      return;
    }

    response.status(200).json({ message: "Verification code resent successfully" });
  } catch (error) {
    response.status(500).json({ message: "Unable to resend verification code" });
  }
}

export async function changePassword(request: Request, response: Response) {
  const userId = (request as AuthenticatedRequest).user?.userId;
  if (!userId) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { currentPassword, newPassword, confirmPassword } = request.body as {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };

  if (!currentPassword || !newPassword || !confirmPassword) {
    response.status(400).json({
      message: "currentPassword, newPassword, and confirmPassword are required",
    });
    return;
  }

  if (newPassword !== confirmPassword) {
    response.status(400).json({ message: "Passwords do not match" });
    return;
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    response.status(400).json({ message: passwordValidation.reason });
    return;
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      response.status(404).json({ message: "User not found" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      response.status(400).json({ message: "Incorrect current password" });
      return;
    }

    user.password = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
    await user.save();

    response.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    response.status(500).json({ message: "Unable to change password" });
  }
}
