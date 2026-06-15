import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/user.model.js";
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
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      response
        .status(409)
        .json({ message: "User with this email already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashedPassword,
      isVerified: "false",
      role: role ?? "User",
    });

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
