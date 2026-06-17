import type { Request, Response } from "express";
import User from "../models/user.model.js";
import CompanyProfile from "../models/company-profile.model.js";
import { extractSkillsFromCV } from "../services/ai.service.js";
import { sendVerificationApprovedEmail, sendVerificationRejectedEmail } from "../services/email.service.js";

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

export async function getPendingCompanyVerifications(
  request: Request,
  response: Response,
) {
  try {
    const profiles = await CompanyProfile.find({
      verificationStatus: "Pending Review",
    });

    const userIds = profiles.map((p) => p.ownerId);
    const companyUsers = await User.find({
      _id: { $in: userIds },
    }).select("-password");

    const items = profiles.map((profile) => {
      const user = companyUsers.find((u) => String(u._id) === profile.ownerId);
      return {
        id: profile.ownerId,
        email: user?.email || "",
        name: user ? `${user.firstName} ${user.lastName}` : "",
        profile,
      };
    });

    response.status(200).json({ items });
  } catch (error) {
    response.status(500).json({
      message: "Unable to fetch pending verifications",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function approveCompanyVerification(request: Request, response: Response) {
  const { companyId } = request.params;

  if (!companyId) {
    response.status(400).json({ message: "companyId is required" });
    return;
  }

  try {
    const profile = await CompanyProfile.findOneAndUpdate(
      { ownerId: companyId },
      { verificationStatus: "Verified", rejectionReason: "" },
      { new: true }
    );

    if (!profile) {
      response.status(404).json({ message: "Company profile not found" });
      return;
    }

    const user = await User.findById(companyId);
    if (user) {
      await sendVerificationApprovedEmail(user.email, profile.companyName);
    }

    response.status(200).json({ message: "Company verified successfully", profile });
  } catch (error) {
    response.status(500).json({ message: "Unable to approve verification" });
  }
}

export async function rejectCompanyVerification(request: Request, response: Response) {
  const { companyId } = request.params;
  const { reason } = request.body;

  if (!companyId) {
    response.status(400).json({ message: "companyId is required" });
    return;
  }
  
  if (!reason) {
    response.status(400).json({ message: "rejection reason is required" });
    return;
  }

  try {
    const profile = await CompanyProfile.findOneAndUpdate(
      { ownerId: companyId },
      { verificationStatus: "Rejected", rejectionReason: reason },
      { new: true }
    );

    if (!profile) {
      response.status(404).json({ message: "Company profile not found" });
      return;
    }

    const user = await User.findById(companyId);
    if (user) {
      await sendVerificationRejectedEmail(user.email, profile.companyName, reason);
    }

    response.status(200).json({ message: "Company verification rejected", profile });
  } catch (error) {
    response.status(500).json({ message: "Unable to reject verification" });
  }
}
