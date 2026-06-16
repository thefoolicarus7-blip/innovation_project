import { Router } from "express";

import {
  listJobs,
  swipeJob,
  getUserDailyStats,
} from "../controllers/job.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const jobRouter = Router();

jobRouter.get("/", authenticate, listJobs);
jobRouter.get("/daily-stats", authenticate, getUserDailyStats);
jobRouter.post("/swipe", authenticate, swipeJob);

export default jobRouter;
