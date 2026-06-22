import type { Response } from "express";
import Candidate from "../models/candidate.model.js";
import CompanyApplication from "../models/company-application.model.js";
import CompanyJob from "../models/company-job.model.js";
import CompanyProfileModel from "../models/company-profile.model.js";
import User from "../models/user.model.js";
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

  // Verification gate — only verified companies may publish job roles
  try {
    const companyUser = await User.findById(userId);
    if (!companyUser || companyUser.isVerified !== true) {
      response.status(403).json({
        message:
          "Company verification required. Please upload valid business registration documents before publishing job roles.",
      });
      return;
    }
  } catch {
    response.status(500).json({ message: "Unable to verify company status" });
    return;
  }

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
  request: AuthenticatedRequest,
  response: Response,
) {
  const userId = getAuthorizedUserId(request, response);
  if (!userId) return;

  try {
    const applications = await CompanyApplication.find({ ownerId: userId });
    const candidateIds = [...new Set(applications.map(app => app.candidateId))];

    const items = await Candidate.find({ id: { $in: candidateIds } });
    response.status(200).json({ items });
  } catch (error) {
    response.status(500).json({ message: "Unable to list candidates" });
  }
}

export async function getCandidateForCompany(
  request: AuthenticatedRequest,
  response: Response,
) {
  const candidateId = request.params.candidateId as string;

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

  if (!profileData.companyName) {
    response.status(400).json({ message: "Company Name is required" });
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

// Saves uploaded document URLs to the company profile and marks it as Pending Review.
// Mirrors the Job Seeker document submission flow.
export async function saveVerificationDocs(
  request: AuthenticatedRequest,
  response: Response,
) {
  const userId = getAuthorizedUserId(request, response);
  if (!userId) return;

  const { businessRegDocUrl, taxIdDocUrl } = request.body as {
    businessRegDocUrl?: string;
    taxIdDocUrl?: string;
  };

  if (!businessRegDocUrl && !taxIdDocUrl) {
    response.status(400).json({ message: "At least one document URL is required" });
    return;
  }

  try {
    const updateFields: Record<string, string> = {
      verificationStatus: "Pending Review",
    };
    if (businessRegDocUrl) updateFields.businessRegDocUrl = businessRegDocUrl;
    if (taxIdDocUrl)       updateFields.taxIdDocUrl       = taxIdDocUrl;

    const saved = await CompanyProfileModel.findOneAndUpdate(
      { ownerId: userId },
      { $set: updateFields },
      { new: true },
    );

    if (!saved) {
      response.status(404).json({
        message: "Company profile not found. Please complete your profile first.",
      });
      return;
    }

    // Notify the company that documents are under review (fire-and-forget)
    const user = await User.findById(userId);
    if (user?.email) {
      sendVerificationSubmittedEmail(user.email, saved.companyName).catch(
        () => { /* email failure should not block the response */ },
      );
    }

    response.status(200).json({ item: saved });
  } catch {
    response.status(500).json({ message: "Unable to save verification documents" });
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
