import { Router } from "express";
import { authenticate, isAdmin } from "../middlewares/auth.middleware.js";
import {
  getUnverifiedUsers,
  getUnverifiedCompanies,
  verifyUser,
} from "../controllers/admin.controller.js";

const adminRouter = Router();

// Protect all routes with auth and admin check
adminRouter.use(authenticate, isAdmin);

adminRouter.get("/unverified/users", getUnverifiedUsers);
adminRouter.get("/unverified/companies", getUnverifiedCompanies);
adminRouter.patch("/verify/:userId", verifyUser);

export default adminRouter;
