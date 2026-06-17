import { Router } from "express";

import {
  createJobForCompany,
  getAnalyticsForCompany,
  getCandidateForCompany,
  getProfileForCompany,
  listApplicationsForCompany,
  listCandidatesForCompany,
  listJobsForCompany,
  patchApplicationStatus,
  saveProfileForCompany,
  submitCompanyVerification,
} from "../controllers/company.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const companyRouter = Router();

companyRouter.use(authenticate);

companyRouter.get("/jobs", listJobsForCompany);
companyRouter.post("/jobs", createJobForCompany);
companyRouter.get("/applications", listApplicationsForCompany);
companyRouter.patch("/applications/:applicationId/status", patchApplicationStatus);
companyRouter.get("/candidates", listCandidatesForCompany);
companyRouter.get("/candidates/:candidateId", getCandidateForCompany);
companyRouter.get("/profile", getProfileForCompany);
companyRouter.put("/profile", saveProfileForCompany);
companyRouter.put("/verification", submitCompanyVerification);
companyRouter.get("/analytics", getAnalyticsForCompany);

export default companyRouter;
