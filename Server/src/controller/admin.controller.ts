import type { Request, Response } from "express";
import User from "../models/user.model.js";
import CompanyProfile from "../models/company-profile.model.js";
import { extractSkillsFromCV } from "../services/ai.service.js";

export async function getUnverifiedUsers(request: Request, response: Response) {
  try {
    const users = await User.find({
      role: "User",
      isVerified: "false",
    }).select("-password");

    response.status(200).json({ items: users });
  } catch (error) {
    response.status(500).json({
      message: "Unable to fetch unverified users",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function getUnverifiedCompanies(
  request: Request,
  response: Response,
) {
  try {
    // Find users with role "company" who are unverified
    const companyUsers = await User.find({
      role: "company",
      isVerified: "false",
    }).select("-password");

    const userIds = companyUsers.map((u) => String(u._id));

    // Fetch corresponding profiles
    const profiles = await CompanyProfile.find({
      ownerId: { $in: userIds },
    });

    // Merge data for the admin view
    const items = companyUsers.map((user) => {
      const profile = profiles.find((p) => p.ownerId === String(user._id));
      return {
        id: String(user._id),
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        profile: profile || null,
      };
    });

    response.status(200).json({ items });
  } catch (error) {
    response.status(500).json({
      message: "Unable to fetch unverified companies",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function verifyUser(request: Request, response: Response) {
  const { userId } = request.params;

  if (!userId) {
    response.status(400).json({ message: "userId is required" });
    return;
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      response.status(404).json({ message: "User not found" });
      return;
    }

    user.isVerified = "true";

    // If it's a standard user and they have a CV, extract skills
    if (user.role === "User" && user.cvUrl) {
      console.log(
        `[Admin] Extracting skills for user ${user._id} from ${user.cvUrl}`,
      );
      const skills = await extractSkillsFromCV(user.cvUrl);
      if (skills.length > 0) {
        user.skills = skills;
        console.log(
          `[Admin] Extracted ${skills.length} skills for user ${user._id}`,
        );
      }
    }

    await user.save();

    response.status(200).json({
      message: "User verified successfully",
      userId: String(user._id),
      isVerified: user.isVerified,
      skillsExtracted: user.skills.length,
    });
  } catch (error) {
    response.status(500).json({
      message: "Unable to verify user",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
