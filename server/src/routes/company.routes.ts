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
<<<<<<< HEAD
  saveVerificationDocs,
=======
  submitCompanyVerification,
>>>>>>> b7ea2f2e3dadbc4dd8ab1b0949eb33c07eb5f265
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
<<<<<<< HEAD
companyRouter.patch("/verification-docs", saveVerificationDocs);
=======
companyRouter.put("/verification", submitCompanyVerification);
>>>>>>> b7ea2f2e3dadbc4dd8ab1b0949eb33c07eb5f265
companyRouter.get("/analytics", getAnalyticsForCompany);

export default companyRouter;
