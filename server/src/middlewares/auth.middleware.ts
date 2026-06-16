import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export type AuthUser = {
  userId: string;
  email: string;
  role: string;
};

export type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-jwt-secret";

export function authenticate(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
) {
  // Web client sends token via HttpOnly cookie.
  // Mobile app sends token via Authorization: Bearer <token> header.
  const cookieToken: string | undefined = request.cookies?.token;
  const authHeader = request.headers.authorization;
  const bearerToken =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  const token = cookieToken ?? bearerToken;

  if (!token) {
    response.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!decoded.userId || !decoded.email || !decoded.role) {
      response.status(401).json({ message: "Invalid token payload" });
      return;
    }

    request.user = {
      userId: String(decoded.userId),
      email: String(decoded.email),
      role: String(decoded.role),
    };

    next();
  } catch {
    response.status(401).json({ message: "Invalid or expired token" });
  }
}

export function isAdmin(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
) {
  if (request.user?.role !== "Admin") {
    response.status(403).json({ message: "Admin access required" });
    return;
  }
  next();
}
