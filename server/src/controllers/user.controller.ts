import crypto from "node:crypto";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/user.model.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../services/email.service.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-jwt-secret";
const JWT_EXPIRES_IN = "7d";
const PASSWORD_SALT_ROUNDS = 10;
const TOKEN_COOKIE_NAME = "token";
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;       // 1 hour
const VERIFICATION_EXPIRY_MS = 10 * 60 * 1000;       // 10 minutes

const IS_PRODUCTION = process.env.NODE_ENV === "production";

// ── JWT / cookie helpers ──────────────────────────────────────────────────────

function signAuthToken(userId: string, email: string, role: string) {
  return jwt.sign({ userId, email, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: (IS_PRODUCTION ? "none" : "lax") as "none" | "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function setAuthCookie(response: Response, token: string) {
  response.cookie(TOKEN_COOKIE_NAME, token, COOKIE_OPTIONS);
}

// ── Validation helpers ────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

function validatePasswordStrength(password: string): string | null {
  if (password.length < 8)
    return "Password must be at least 8 characters long";
  if (!/[A-Z]/.test(password))
    return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password))
    return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(password))
    return "Password must contain at least one number";
  if (!/[^A-Za-z0-9]/.test(password))
    return "Password must contain at least one special character (e.g. !@#$%^&*)";
  return null;
}

// ── Token / OTP generators ────────────────────────────────────────────────────

function generateResetToken(): { rawToken: string; hashedToken: string } {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, hashedToken };
}

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function generateOTP(): { rawOTP: string; hashedOTP: string } {
  // 6-digit numeric OTP
  const rawOTP = String(Math.floor(100000 + Math.random() * 900000));
  const hashedOTP = crypto.createHash("sha256").update(rawOTP).digest("hex");
  return { rawOTP, hashedOTP };
}

// ── Controllers ───────────────────────────────────────────────────────────────

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

  const trimmedFirstName = firstName.trim();
  const trimmedLastName = lastName.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    response.status(400).json({ message: "Invalid email address format" });
    return;
  }

  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    response.status(400).json({ message: passwordError });
    return;
  }

  if (!trimmedFirstName || !trimmedLastName) {
    response.status(400).json({ message: "Name fields must not be blank" });
    return;
  }

  try {
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      response.status(409).json({ message: "User with this email already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    const { rawOTP, hashedOTP } = generateOTP();

    const user = await User.create({
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      email: normalizedEmail,
      password: hashedPassword,
      isVerified: "false",
      role: role ?? "User",
      emailVerificationToken: hashedOTP,
      emailVerificationExpires: new Date(Date.now() + VERIFICATION_EXPIRY_MS),
    });

    // Send verification email — errors are logged but don't fail registration.
    sendVerificationEmail(user.email, rawOTP).catch((err) =>
      console.error("[register] Failed to send verification email:", err),
    );

    const token = signAuthToken(String(user._id), user.email, user.role);
    setAuthCookie(response, token);

    response.status(201).json({
      token,
      message: "Account created. Check your email for a 6-digit verification code.",
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
    response.status(500).json({
      error: error instanceof Error ? error.message : "Unable to register user",
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

  if (!isValidEmail(email.trim())) {
    response.status(401).json({ message: "Invalid email or password" });
    return;
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      response.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      response.status(401).json({ message: "Invalid email or password" });
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
      email: email.trim().toLowerCase(),
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

    const token = signAuthToken(String(user._id), user.email, user.role);
    setAuthCookie(response, token);

    response.status(200).json({
      token,
      user: {
        id: String(user._id),
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        companyId: user.role === "company" ? String(user._id) : undefined,
      },
    });
  } catch {
    response.status(500).json({ message: "Unable to login" });
  }
}

export function logoutUser(_request: Request, response: Response) {
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

/**
 * POST /api/user/verify-email   (requires auth)
 * Body: { code }
 *
 * Validates the 6-digit OTP against the stored SHA-256 hash and sets
 * isVerified = "true" on the user's account.
 */
export async function verifyEmail(
  request: AuthenticatedRequest,
  response: Response,
) {
  const userId = request.user?.userId;
  if (!userId) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { code } = request.body as { code?: string };
  if (!code || code.trim().length === 0) {
    response.status(400).json({ message: "Verification code is required" });
    return;
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      response.status(404).json({ message: "User not found" });
      return;
    }

    if (user.isVerified === "true") {
      response.status(200).json({ message: "Email is already verified" });
      return;
    }

    if (
      !user.emailVerificationToken ||
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      response.status(400).json({
        message: "Verification code has expired. Please request a new one.",
      });
      return;
    }

    const hashedInput = hashToken(code.trim());
    if (hashedInput !== user.emailVerificationToken) {
      response.status(400).json({ message: "Invalid verification code" });
      return;
    }

    user.isVerified = "true";
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    response.status(200).json({ message: "Email verified successfully" });
  } catch {
    response.status(500).json({ message: "Unable to verify email" });
  }
}

/**
 * POST /api/user/resend-verification   (requires auth)
 *
 * Generates a new OTP and resends the verification email to the logged-in user.
 */
export async function resendVerification(
  request: AuthenticatedRequest,
  response: Response,
) {
  const userId = request.user?.userId;
  if (!userId) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      response.status(404).json({ message: "User not found" });
      return;
    }

    if (user.isVerified === "true") {
      response.status(200).json({ message: "Email is already verified" });
      return;
    }

    const { rawOTP, hashedOTP } = generateOTP();
    user.emailVerificationToken = hashedOTP;
    user.emailVerificationExpires = new Date(Date.now() + VERIFICATION_EXPIRY_MS);
    await user.save();

    sendVerificationEmail(user.email, rawOTP).catch((err) =>
      console.error("[resend-verification] Failed to send email:", err),
    );

    response.status(200).json({ message: "A new verification code has been sent to your email" });
  } catch {
    response.status(500).json({ message: "Unable to resend verification code" });
  }
}

/**
 * POST /api/user/forgot-password   (public)
 * Body: { email }
 */
export async function forgotPassword(request: Request, response: Response) {
  const { email } = request.body as { email?: string };

  if (!email) {
    response.status(400).json({ message: "email is required" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!isValidEmail(normalizedEmail)) {
    response.status(400).json({ message: "Invalid email address format" });
    return;
  }

  try {
    const user = await User.findOne({ email: normalizedEmail });

    // Always return 200 — prevents revealing which emails are registered.
    if (!user) {
      response.status(200).json({
        message: "If an account with that email exists, a reset link has been sent.",
      });
      return;
    }

    const { rawToken, hashedToken } = generateResetToken();
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
    await user.save();

    sendPasswordResetEmail(user.email, rawToken).catch((err) => {
      console.error("[forgot-password] Failed to send email:", err);
      const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
      console.warn(
        `[forgot-password] Reset link for ${user.email}:\n` +
        `${frontendUrl}/reset-password?token=${rawToken}`,
      );
    });

    response.status(200).json({
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch {
    response.status(500).json({ message: "Unable to process password reset" });
  }
}

/**
 * POST /api/user/reset-password   (public)
 * Body: { token, newPassword, confirmPassword }
 */
export async function resetPassword(request: Request, response: Response) {
  const { token, newPassword, confirmPassword } = request.body as {
    token?: string;
    newPassword?: string;
    confirmPassword?: string;
  };

  if (!token || !newPassword || !confirmPassword) {
    response.status(400).json({
      message: "token, newPassword and confirmPassword are required",
    });
    return;
  }

  if (newPassword !== confirmPassword) {
    response.status(400).json({ message: "Passwords do not match" });
    return;
  }

  const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) {
    response.status(400).json({ message: passwordError });
    return;
  }

  try {
    const hashedToken = hashToken(token.trim());

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      response.status(400).json({ message: "Reset token is invalid or has expired" });
      return;
    }

    user.password = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    response.status(200).json({ message: "Password has been reset successfully" });
  } catch {
    response.status(500).json({ message: "Unable to reset password" });
  }
}
