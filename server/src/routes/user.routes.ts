import { Router } from "express";

import { authenticate } from "../middlewares/auth.middleware.js";
import {
  getMyProfile,
  getMyCv,
  saveMyCV,
  generateSummaryForCV,
  loginCompanyUser,
  loginUser,
  logoutUser,
  registerUser,
  updateUserDocuments,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationCode,
} from "../controllers/user.controller.js";

const userRouter = Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/logout", logoutUser);
userRouter.post("/company-login", loginCompanyUser);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password", resetPassword);
userRouter.post("/verify-email", verifyEmail);
userRouter.post("/resend-verification", resendVerificationCode);
userRouter.get("/me", authenticate, getMyProfile);
userRouter.patch("/documents", authenticate, updateUserDocuments);
userRouter.get("/cv", authenticate, getMyCv);
userRouter.post("/cv", authenticate, saveMyCV);
userRouter.post("/cv/generate-summary", authenticate, generateSummaryForCV);

export default userRouter;
