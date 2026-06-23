import type { Response } from "express";
import CompanyJob from "../models/company-job.model.js";
import CompanyApplication from "../models/company-application.model.js";
import User from "../models/user.model.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

export type SwipeAction = "left" | "right" | "up";
const ALLOWED_ACTIONS: SwipeAction[] = ["left", "right", "up"];

export async function listJobs(request: AuthenticatedRequest, response: Response) {
  const userId = request.user?.userId;
  if (!userId) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  try {
    // Get all applications this user has ever made, with their ownerId+jobId pair
    const appliedApps = await CompanyApplication.find({ candidateId: userId }).lean();

    // Count today's applications directly — avoids the numeric-id deduplication bug in UserDailyLimit
    const appliedToday = appliedApps.filter(
      (app) => typeof app.appliedAt === "string" && app.appliedAt.startsWith(today)
    ).length;

    // Build precise exclusion using (ownerId, id) compound key so that applying to
    // employer A's job #1 does NOT hide employer B's job #1 (different job, same numeric id)
    let excludedMongoIds: unknown[] = [];
    if (appliedApps.length > 0) {
      const appliedJobs = await CompanyJob.find({
        $or: appliedApps.map((app) => ({ ownerId: app.ownerId, id: app.jobId })),
      }).select("_id").lean();
      excludedMongoIds = appliedJobs.map((j) => j._id);
    }

    // Always show all currently open jobs that the user hasn't applied to
    const user = await User.findById(userId);
    const userSkillsLower = (user?.skills ?? []).map((s: string) => s.toLowerCase());

    const openJobs = await CompanyJob.find({
      status: "Open",
      _id: { $nin: excludedMongoIds },
    });

    // Sort by skill match score so best matches appear first
    const scored = openJobs.map((job) => {
      let score = 0;
      const jobTagsLower = job.tags.map((t: string) => t.toLowerCase());
      const jobTitleLower = job.title.toLowerCase();
      userSkillsLower.forEach((skill) => {
        if (jobTagsLower.includes(skill)) score += 2;
        if (jobTitleLower.includes(skill)) score += 1;
      });
      return { job, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const items = scored.map((s) => s.job);

    response.status(200).json({
      items,
      dailyStats: {
        appliedToday,
        applyLimit: 10,
      },
      pagination: {
        total: items.length,
      },
    });
  } catch (error) {
    console.error("Error in listJobs:", error);
    response.status(500).json({ message: "Unable to list jobs" });
  }
}

export async function swipeJob(request: AuthenticatedRequest, response: Response) {
  const userId = request.user?.userId;
  const { jobId, jobMongoId, action } = request.body as { jobId?: number; jobMongoId?: string; action?: SwipeAction };

  console.log(`[Swipe] Request received: userId=${userId}, jobId=${jobId}, jobMongoId=${jobMongoId}, action=${action}`);

  if (!userId) {
    console.error("[Swipe] Unauthorized: No userId in request");
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (!action || !ALLOWED_ACTIONS.includes(action)) {
    console.error(`[Swipe] Bad Request: Invalid action (${action})`);
    response.status(400).json({ message: "action must be one of: left, right, up" });
    return;
  }

  try {
    // Prefer lookup by MongoDB _id (unambiguous) when provided; fall back to numeric id
    const job = jobMongoId
      ? await CompanyJob.findById(jobMongoId)
      : await CompanyJob.findOne({ id: Number(jobId) });

    if (!job) {
      console.error(`[Swipe] Not Found: Job not found (mongoId=${jobMongoId}, id=${jobId})`);
      response.status(404).json({ message: "Job not found" });
      return;
    }

    const jobIdNum = job.id as number;

    const today = new Date().toISOString().split("T")[0];

    // Count actual applications made today — accurate regardless of numeric id collisions
    const todayApplyCount = await CompanyApplication.countDocuments({
      candidateId: userId,
      appliedAt: { $regex: `^${today}` },
    });
    console.log(`[Swipe] Today's apply count for ${userId}: ${todayApplyCount}/10`);

    let application = null;
    let isNewApplication = false;

    if (action === "right" || action === "up") {
      // Enforce daily limit only for new applications (not re-applies or left-swipes)
      const existing = await CompanyApplication.findOne({ candidateId: userId, ownerId: job.ownerId, jobId: jobIdNum });
      if (!existing && todayApplyCount >= 10) {
        console.warn(`[Swipe] Forbidden: User ${userId} reached daily limit`);
        response.status(403).json({ message: "You have reached your daily application limit of 10 jobs." });
        return;
      }

      console.log(`[Swipe] Processing application (Right/Up) for jobId=${jobIdNum}`);
      const user = await User.findById(userId);

      if (!user?.isVerified && !user?.isOTPverified) {
        console.warn(`[Swipe] Forbidden: User ${userId} is not verified`);
        response.status(403).json({ message: "Your account must be verified before you can apply for jobs." });
        return;
      }

      if (!existing) {
        console.log(`[Swipe] Creating new CompanyApplication for candidateId=${userId}, jobId=${jobIdNum}`);
        application = await CompanyApplication.create({
          ownerId: job.ownerId,
          id: `${userId}-${jobIdNum}-${Date.now()}`,
          jobId: jobIdNum,
          candidateId: userId,
          candidateName: user ? `${user.firstName} ${user.lastName}` : "Unknown Candidate",
          jobTitle: job.title,
          appliedAt: new Date().toISOString(),
          status: "New"
        });
        isNewApplication = true;
        console.log(`[Swipe] CompanyApplication created: id=${application.id}`);
      } else {
        console.log(`[Swipe] User already applied to job ${jobIdNum}, skipping creation`);
        application = existing;
      }
    }

    console.log("[Swipe] Action recorded successfully");
    response.status(200).json({
      message: "Swipe action recorded",
      application,
      dailyStats: {
        appliedToday: isNewApplication ? todayApplyCount + 1 : todayApplyCount,
        applyLimit: 10,
      },
    });
  } catch (error) {
    console.error("[Swipe] Critical Error:", error);
    response.status(500).json({ message: "Unable to record swipe" });
  }
}

export async function getUserDailyStats(request: AuthenticatedRequest, response: Response) {
  const userId = request.user?.userId;
  if (!userId) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  try {
    const appliedToday = await CompanyApplication.countDocuments({
      candidateId: userId,
      appliedAt: { $regex: `^${today}` },
    });

    response.status(200).json({
      appliedToday,
      applyLimit: 10
    });
  } catch (error) {
    console.error("Error in getUserDailyStats:", error);
    response.status(500).json({ message: "Unable to fetch daily stats" });
  }
}
