import { Router } from "express";

import { authenticate } from "../middlewares/auth.middleware.js";
import {
  forgotPassword,
  getMyProfile,
  loginCompanyUser,
  loginUser,
  logoutUser,
  registerUser,
  resendVerification,
  resetPassword,
  updateUserDocuments,
  verifyEmail,
} from "../controllers/user.controller.js";

const userRouter = Router();

// Public routes
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/logout", logoutUser);
userRouter.post("/company-login", loginCompanyUser);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password", resetPassword);

// Protected routes (require valid JWT)
userRouter.get("/me", authenticate, getMyProfile);
userRouter.patch("/documents", authenticate, updateUserDocuments);
userRouter.post("/verify-email", authenticate, verifyEmail);
userRouter.post("/resend-verification", authenticate, resendVerification);

export default userRouter;
