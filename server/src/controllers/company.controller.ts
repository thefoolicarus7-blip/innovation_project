import type { Response } from "express";
import Candidate from "../models/candidate.model.js";
import CompanyApplication from "../models/company-application.model.js";
import CompanyJob from "../models/company-job.model.js";
import CompanyProfileModel from "../models/company-profile.model.js";
import type {
  CompanyProfile,
  Job,
  JobApplication,
} from "../data/company.types.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { sendVerificationSubmittedEmail } from "../services/email.service.js";

const allowedApplicationStatuses: JobApplication["status"][] = [
  "New",
  "Shortlisted",
  "Interview",
  "Rejected",
];
const allowedEmploymentTypes: Job["employmentType"][] = [
  "Full-time",
  "Part-time",
  "Contract",
  "Remote",
];
const allowedJobStatuses: Job["status"][] = ["Open", "Paused", "Closed"];

function getAuthorizedUserId(
  request: AuthenticatedRequest,
  response: Response,
) {
  const userId = request.user?.userId;
  if (!userId) {
    response.status(401).json({ message: "Unauthorized" });
    return null;
  }
  return userId;
}

export async function listJobsForCompany(
  request: AuthenticatedRequest,
  response: Response,
) {
  const userId = getAuthorizedUserId(request, response);
  if (!userId) return;

  try {
    const items = await CompanyJob.find({ ownerId: userId }).sort({
      createdAt: -1,
    });
    response.status(200).json({ items });
  } catch (error) {
    response.status(500).json({ message: "Unable to list jobs" });
  }
}

export async function createJobForCompany(
  request: AuthenticatedRequest,
  response: Response,
) {
  const userId = getAuthorizedUserId(request, response);
  if (!userId) return;

  const {
    title,
    location,
    employmentType,
    salaryRange,
    status,
    deadline,
    tags,
    experienceLevel,
  } = request.body as Partial<Job>;

  if (
    !title ||
    !location ||
    !employmentType ||
    !salaryRange ||
    !status ||
    !deadline ||
    !experienceLevel
  ) {
    response.status(400).json({
      message:
        "title, location, employmentType, salaryRange, status, deadline and experienceLevel are required",
    });
    return;
  }

  if (!allowedEmploymentTypes.includes(employmentType)) {
    response.status(400).json({ message: "employmentType is invalid" });
    return;
  }

  if (!allowedJobStatuses.includes(status)) {
    response.status(400).json({ message: "status is invalid" });
    return;
  }

  try {
    const profile = await CompanyProfileModel.findOne({ ownerId: userId });
    if (!profile || profile.verificationStatus !== "Verified") {
      response.status(403).json({
        message:
          "Company verification is required before publishing job postings. Please upload your official business documents and wait for approval.",
      });
      return;
    }

    const lastJob = await CompanyJob.findOne({ ownerId: userId }).sort({
      id: -1,
    });
    const nextId = (lastJob?.id ?? 0) + 1;

    const record = await CompanyJob.create({
      ownerId: userId,
      id: nextId,
      title,
      location,
      employmentType,
      salaryRange,
      status,
      deadline,
      tags: Array.isArray(tags) ? tags : [],
      experienceLevel,
      createdAt: new Date().toISOString(),
    });

    response.status(201).json({ item: record });
  } catch (error) {
    response.status(500).json({ message: "Unable to create job" });
  }
}

export async function listApplicationsForCompany(
  request: AuthenticatedRequest,
  response: Response,
) {
  const userId = getAuthorizedUserId(request, response);
  if (!userId) return;

  try {
    const items = await CompanyApplication.find({ ownerId: userId }).sort({
      appliedAt: -1,
    });
    response.status(200).json({ items });
  } catch (error) {
    response.status(500).json({ message: "Unable to list applications" });
  }
}

export async function patchApplicationStatus(
  request: AuthenticatedRequest,
  response: Response,
) {
  const userId = getAuthorizedUserId(request, response);
  if (!userId) return;

  const { applicationId } = request.params;
  const { status } = request.body as { status?: JobApplication["status"] };

  if (!status || !allowedApplicationStatuses.includes(status)) {
    response.status(400).json({
      message: "status must be one of: New, Shortlisted, Interview, Rejected",
    });
    return;
  }

  try {
    const updated = await CompanyApplication.findOneAndUpdate(
      { id: applicationId, ownerId: userId },
      { status },
      { new: true },
    );

    if (!updated) {
      response.status(404).json({ message: "Application not found" });
      return;
    }

    response.status(200).json({ item: updated });
  } catch (error) {
    response
      .status(500)
      .json({ message: "Unable to update application status" });
  }
}

export async function listCandidatesForCompany(
  _request: AuthenticatedRequest,
  response: Response,
) {
  try {
    const items = await Candidate.find().sort({ fullName: 1 });
    response.status(200).json({ items });
  } catch (error) {
    response.status(500).json({ message: "Unable to list candidates" });
  }
}

export async function getCandidateForCompany(
  request: AuthenticatedRequest,
  response: Response,
) {
  const { candidateId } = request.params;

  try {
    const candidate = await Candidate.findOne({ id: candidateId });
    if (!candidate) {
      response.status(404).json({ message: "Candidate not found" });
      return;
    }
    response.status(200).json({ item: candidate });
  } catch (error) {
    response.status(500).json({ message: "Unable to fetch candidate" });
  }
}

export async function getProfileForCompany(
  request: AuthenticatedRequest,
  response: Response,
) {
  const userId = getAuthorizedUserId(request, response);
  if (!userId) return;

  try {
    const profile = await CompanyProfileModel.findOne({ ownerId: userId });
    response.status(200).json({ item: profile });
  } catch (error) {
    response.status(500).json({ message: "Unable to fetch company profile" });
  }
}

export async function saveProfileForCompany(
  request: AuthenticatedRequest,
  response: Response,
) {
  const userId = getAuthorizedUserId(request, response);
  if (!userId) return;

  const profileData = request.body as Partial<CompanyProfile>;

  if (
    !profileData.companyName ||
    !profileData.companyType ||
    !profileData.industry ||
    !profileData.address ||
    !profileData.city ||
    !profileData.country ||
    !profileData.about ||
    !profileData.teamSize
  ) {
    response.status(400).json({
      message: "Required fields are missing",
    });
    return;
  }

  try {
    const saved = await CompanyProfileModel.findOneAndUpdate(
      { ownerId: userId },
      { ...profileData, ownerId: userId },
      { upsert: true, new: true },
    );
    response.status(200).json({ item: saved });
  } catch (error) {
    response.status(500).json({ message: "Unable to save company profile" });
  }
}

export async function submitCompanyVerification(
  request: AuthenticatedRequest,
  response: Response,
) {
  const userId = getAuthorizedUserId(request, response);
  if (!userId) return;

  const { registrationNumber, businessEmail, verificationDocumentUrl } =
    request.body;

  if (!registrationNumber || !businessEmail || !verificationDocumentUrl) {
    response.status(400).json({ message: "All verification fields are required" });
    return;
  }

  try {
    const profile = await CompanyProfileModel.findOneAndUpdate(
      { ownerId: userId },
      {
        registrationNumber,
        businessEmail,
        verificationDocumentUrl,
        verificationStatus: "Pending Review",
      },
      { new: true },
    );

    if (!profile) {
      response.status(404).json({ message: "Company profile not found" });
      return;
    }

    await sendVerificationSubmittedEmail(businessEmail, profile.companyName);

    response.status(200).json({ item: profile });
  } catch (error) {
    response.status(500).json({ message: "Unable to submit verification" });
  }
}

export async function getAnalyticsForCompany(
  request: AuthenticatedRequest,
  response: Response,
) {
  const userId = getAuthorizedUserId(request, response);
  if (!userId) return;

  try {
    const [jobs, applications] = await Promise.all([
      CompanyJob.find({ ownerId: userId }),
      CompanyApplication.find({ ownerId: userId }),
    ]);

    const openJobs = jobs.filter((j) => j.status === "Open").length;
    const shortlisted = applications.filter(
      (a) => a.status === "Shortlisted",
    ).length;
    const interviews = applications.filter(
      (a) => a.status === "Interview",
    ).length;

    // Group applications by job
    const applicationsByJobMap = new Map<string, number>();
    applications.forEach((app) => {
      applicationsByJobMap.set(
        app.jobTitle,
        (applicationsByJobMap.get(app.jobTitle) ?? 0) + 1,
      );
    });

    const applicationsByJob = Array.from(applicationsByJobMap.entries()).map(
      ([jobTitle, count]) => ({
        jobTitle,
        count,
      }),
    );

    const analytics = {
      totalJobs: jobs.length,
      openJobs,
      totalApplications: applications.length,
      shortlisted,
      interviews,
      conversionRate:
        applications.length > 0
          ? Math.round((shortlisted / applications.length) * 100)
          : 0,
      applicationsByJob,
    };

    response.status(200).json({ item: analytics });
  } catch (error) {
    response.status(500).json({ message: "Unable to fetch analytics" });
  }
}
