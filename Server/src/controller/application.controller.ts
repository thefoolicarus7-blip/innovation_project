import type { Response } from "express";
import CompanyApplication from "../models/company-application.model.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

type ApplicationTab = "matches" | "let_it_go";
const ALLOWED_TABS: ApplicationTab[] = ["matches", "let_it_go"];

export async function listMyApplications(
  request: AuthenticatedRequest,
  response: Response,
) {
  const userId = request.user?.userId;

  if (!userId) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  const tabParam = request.query.tab;
  const tab = typeof tabParam === "string" ? tabParam : undefined;

  if (tab && !ALLOWED_TABS.includes(tab as ApplicationTab)) {
    response
      .status(400)
      .json({ message: "tab must be one of: matches, let_it_go" });
    return;
  }

  try {
    const query: any = {};
    if (request.user?.role === "User") {
      query.candidateId = userId;
    } else {
      query.ownerId = userId;
    }

    if (tab === "matches") {
      query.status = { $in: ["New", "Shortlisted", "Interview"] };
    } else if (tab === "let_it_go") {
      query.status = "Rejected";
    }

    const items = await CompanyApplication.find(query).sort({ appliedAt: -1 });

    response.status(200).json({
      items,
      total: items.length,
      tab: tab ?? "all",
    });
  } catch (error) {
    response.status(500).json({ message: "Unable to list applications" });
  }
}
