import { Router } from "express";

import { listMyApplications } from "../controllers/application.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const applicationRouter = Router();

applicationRouter.get("/", authenticate, listMyApplications);

export default applicationRouter;
