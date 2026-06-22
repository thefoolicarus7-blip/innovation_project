import type { Response } from "express";
import CompanyJob from "../models/company-job.model.js";
import CompanyApplication from "../models/company-application.model.js";
import UserDailyLimit from "../models/user-daily-limit.model.js";
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
    let dailyLimit = await UserDailyLimit.findOne({ userId, date: today });

    // If no limit record OR we have 0 suggested jobs, try to find some
    if (!dailyLimit || dailyLimit.suggestedJobIds.length === 0) {
      const user = await User.findById(userId);
      const userSkills = user?.skills || [];

      const appliedJobIds = await CompanyApplication.find({
        candidateId: userId,
      }).distinct("jobId");

      // 1. Fetch potential jobs that are open and not applied to
      const allPotentialJobs = await CompanyJob.find({
        status: "Open",
        id: { $nin: appliedJobIds },
      });

      // 2. Score jobs based on tag matching
      const userSkillsLower = userSkills.map((s: string) => s.toLowerCase());

      const scoredJobs = allPotentialJobs.map((job) => {
        let score = 0;
        const jobTagsLower = job.tags.map((t: string) => t.toLowerCase());
        const jobTitleLower = job.title.toLowerCase();

        userSkillsLower.forEach((skill: string) => {
          // Boost score if skill matches a tag
          if (jobTagsLower.includes(skill)) {
            score += 2;
          }
          // Boost score slightly if skill is in the title
          if (jobTitleLower.includes(skill)) {
            score += 1;
          }
        });

        return { job, score };
      });

      // 3. Filter for high relevance (score > 0) and sort
      let highRelevanceJobs = scoredJobs
        .filter((sj) => sj.score > 0)
        .sort((a, b) => b.score - a.score);

      // If we don't have any relevant jobs (e.g. no skills set), just show all potential jobs
      if (highRelevanceJobs.length === 0) {
        highRelevanceJobs = scoredJobs;
      }

      // 4. Take the results (no longer filling with random jobs)
      const suggestedJobs = highRelevanceJobs.map((sj) => sj.job);
      const suggestedJobIds = suggestedJobs.map((j) => j.id);

      if (!dailyLimit) {
        dailyLimit = await UserDailyLimit.create({
          userId,
          date: today,
          suggestedJobIds,
          appliedJobIds: []
        });
      } else if (suggestedJobIds.length > 0) {
        dailyLimit.suggestedJobIds = suggestedJobIds;
        await dailyLimit.save();
      }
    }

    // Return the same jobs they were shown today, but filter out the ones they already applied to
    let items = await CompanyJob.find({
      id: { $in: dailyLimit.suggestedJobIds, $nin: dailyLimit.appliedJobIds },
      status: "Open"
    });

    response.status(200).json({
      items,
      dailyStats: {
        appliedToday: dailyLimit.appliedJobIds.length,
        applyLimit: 10
      },
      pagination: {
        total: items.length
      }
    });
  } catch (error) {
    console.error("Error in listJobs:", error);
    response.status(500).json({ message: "Unable to list jobs" });
  }
}

export async function swipeJob(request: AuthenticatedRequest, response: Response) {
  const userId = request.user?.userId;
  const { jobId, action } = request.body as { jobId?: number; action?: SwipeAction };

  console.log(`[Swipe] Request received: userId=${userId}, jobId=${jobId}, action=${action}`);

  if (!userId) {
    console.error("[Swipe] Unauthorized: No userId in request");
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  const jobIdNum = Number(jobId);
  if (isNaN(jobIdNum)) {
    console.error(`[Swipe] Bad Request: jobId is not a number (${jobId})`);
    response.status(400).json({ message: "jobId must be a number" });
    return;
  }

  if (!action || !ALLOWED_ACTIONS.includes(action)) {
    console.error(`[Swipe] Bad Request: Invalid action (${action})`);
    response.status(400).json({ message: "action must be one of: left, right, up" });
    return;
  }

  try {
    const job = await CompanyJob.findOne({ id: jobIdNum });
    if (!job) {
      console.error(`[Swipe] Not Found: Job with id ${jobIdNum} does not exist`);
      response.status(404).json({ message: "Job not found" });
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    let dailyLimit = await UserDailyLimit.findOne({ userId, date: today });
    console.log(`[Swipe] Current daily limit for ${userId} on ${today}:`, dailyLimit ? `${dailyLimit.appliedJobIds.length}/10` : "None found");

    // Enforce daily limit for applications (Right/Up)
    if ((action === "right" || action === "up") && dailyLimit && dailyLimit.appliedJobIds.length >= 10 && !dailyLimit.appliedJobIds.includes(jobIdNum)) {
      console.warn(`[Swipe] Forbidden: User ${userId} reached daily limit`);
      response.status(403).json({ message: "You have reached your daily application limit of 10 jobs." });
      return;
    }

    // Update daily limit tracking
    console.log(`[Swipe] Updating UserDailyLimit for userId=${userId}, date=${today}`);
    dailyLimit = await UserDailyLimit.findOneAndUpdate(
      { userId, date: today },
      { $addToSet: { appliedJobIds: jobIdNum } },
      { upsert: true, new: true }
    );
    console.log(`[Swipe] UserDailyLimit updated: appliedCount=${dailyLimit?.appliedJobIds.length}`);

    let application = null;
    if (action === "right" || action === "up") {
      console.log(`[Swipe] Processing application (Right/Up) for jobId=${jobIdNum}`);
      const user = await User.findById(userId);

      if (user?.isVerified !== true) {
        console.warn(`[Swipe] Forbidden: User ${userId} is not verified`);
        response.status(403).json({ message: "Your account must be verified before you can apply for jobs." });
        return;
      }

      // Check if already applied to prevent duplicates
      const existing = await CompanyApplication.findOne({ candidateId: userId, jobId: jobIdNum });
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
        appliedToday: dailyLimit?.appliedJobIds.length ?? 0,
        applyLimit: 10
      }
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
    const dailyLimit = await UserDailyLimit.findOne({ userId, date: today });

    response.status(200).json({
      appliedToday: dailyLimit?.appliedJobIds.length ?? 0,
      applyLimit: 10
    });
  } catch (error) {
    console.error("Error in getUserDailyStats:", error);
    response.status(500).json({ message: "Unable to fetch daily stats" });
  }
}
