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
  saveVerificationDocs,
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
companyRouter.patch("/verification-docs", saveVerificationDocs);
companyRouter.get("/analytics", getAnalyticsForCompany);

export default companyRouter;
