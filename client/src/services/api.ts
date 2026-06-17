import type {
  AuthUser,
  Candidate,
  CompanyAnalytics,
  CompanyProfile,
  Job,
  JobApplication,
  UserDailyStats,
  UserApplication,
  WorkExperience,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

type ApiErrorResponse = {
  message?: string;
};

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const fetchOptions: RequestInit = {
    ...options,
    credentials: "include", // Ensure cookies are sent with requests
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
    },
  };

  const response = await fetch(`${API_BASE_URL}${path}`, fetchOptions);

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      const payload = (await response.json()) as ApiErrorResponse;
      if (payload.message) {
        errorMessage = payload.message;
      }
    } catch {
      // Ignore JSON parsing errors and use default status message.
    }

    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
}

type CompanyLoginPayload = {
  user: AuthUser;
};

export async function loginCompany(
  email: string,
  password: string,
): Promise<CompanyLoginPayload> {
  const payload = await apiRequest<{
    user: {
      id: string;
      name: string;
      email: string;
      role: "company";
      companyId: string;
    };
  }>("/user/company-login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  return {
    user: {
      id: payload.user.id,
      name: payload.user.name,
      email: payload.user.email,
      role: payload.user.role,
      companyId: payload.user.companyId,
    },
  };
}

export async function registerCompany(data: any): Promise<CompanyLoginPayload> {
  const payload = await apiRequest<{
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: "company";
    };
  }>("/user/register", {
    method: "POST",
    body: JSON.stringify({ ...data, role: "company" }),
  });

  return {
    user: {
      id: payload.user.id,
      name: `${payload.user.firstName} ${payload.user.lastName}`,
      email: payload.user.email,
      role: "company",
      companyId: payload.user.id,
    },
  };
}

export async function logoutApi(): Promise<void> {
  await apiRequest("/user/logout", {
    method: "POST",
  });
}

export async function getCompanyJobs(): Promise<Job[]> {
  const payload = await apiRequest<{ items: Job[] }>("/company/jobs");
  return payload.items;
}

export async function createCompanyJob(
  input: Omit<Job, "id" | "createdAt">,
): Promise<Job> {
  const payload = await apiRequest<{ item: Job }>("/company/jobs", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return payload.item;
}

export async function getApplications(): Promise<JobApplication[]> {
  const payload = await apiRequest<{ items: JobApplication[] }>(
    "/company/applications",
  );
  return payload.items;
}

export async function updateApplication(
  applicationId: string,
  status: JobApplication["status"],
) {
  const payload = await apiRequest<{ item: JobApplication }>(
    `/company/applications/${applicationId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );

  return payload.item;
}

export async function getCandidates(): Promise<Candidate[]> {
  const payload = await apiRequest<{ items: Candidate[] }>(
    "/company/candidates",
  );
  return payload.items;
}

export async function getCandidateById(
  candidateId: string,
): Promise<Candidate | null> {
  try {
    const payload = await apiRequest<{ item: Candidate }>(
      `/company/candidates/${candidateId}`,
    );
    return payload.item;
  } catch {
    return null;
  }
}

export async function getCompanyProfile(): Promise<CompanyProfile> {
  const payload = await apiRequest<{ item: CompanyProfile }>(
    "/company/profile",
  );
  return payload.item;
}

export async function saveCompanyProfile(
  input: CompanyProfile,
): Promise<CompanyProfile> {
  const payload = await apiRequest<{ item: CompanyProfile }>(
    "/company/profile",
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  );

  return payload.item;
}

export async function getCompanyAnalytics(): Promise<CompanyAnalytics> {
  const payload = await apiRequest<{ item: CompanyAnalytics }>(
    "/company/analytics",
  );
  return payload.item;
}

export async function getMe(): Promise<{ user: AuthUser }> {
  return apiRequest<{ user: AuthUser }>("/user/me");
}

export async function forgotPasswordApi(email: string): Promise<{ message: string; resetToken?: string }> {
  return apiRequest<{ message: string; resetToken?: string }>("/user/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function forgotCompanyPasswordApi(email: string): Promise<{ message: string; resetToken?: string }> {
  return apiRequest<{ message: string; resetToken?: string }>("/user/company-forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordApi(
  token: string,
  password: string,
  confirmPassword: string,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/user/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password, confirmPassword }),
  });
}

export async function changePasswordApi(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/user/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  });
}

export async function verifyEmailCode(code: string, email?: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/user/verify-email", {
    method: "POST",
    body: JSON.stringify({ code, email }),
  });
}

export async function resendVerificationCodeApi(email?: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/user/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function loginNormalUser(email: string, password: string) {
  const payload = await apiRequest<{ user: AuthUser }>("/user/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return payload;
}

export async function registerNormalUser(data: any) {
  const payload = await apiRequest<{ user: AuthUser }>("/user/register", {
    method: "POST",
    body: JSON.stringify({ ...data, role: "User" }),
  });
  return payload;
}

export async function getUserJobs() {
  const payload = await apiRequest<{
    items: Job[];
    dailyStats: UserDailyStats;
  }>("/job", {
    method: "GET",
  });
  return payload;
}

export async function applyToJob(jobId: number) {
  const payload = await apiRequest<{ application: UserApplication }>(
    `/job/${jobId}/swipe`,
    {
      method: "POST",
      body: JSON.stringify({ action: "right" }),
    },
  );
  return payload;
}

export async function getUserApplications(
  tab?: "matches" | "let_it_go" | "all",
) {
  const url =
    tab && tab !== "all" ? `/applications?tab=${tab}` : "/applications";
  const payload = await apiRequest<{ items: UserApplication[]; total: number }>(
    url,
  );
  return payload;
}

export async function getAdminUnverifiedUsers() {
  const payload = await apiRequest<{ items: any[] }>("/admin/unverified/users");
  return payload.items;
}

export async function getAdminUnverifiedCompanies() {
  const payload = await apiRequest<{ items: any[] }>(
    "/admin/unverified/companies",
  );
  return payload.items;
}

export async function adminVerifyUser(userId: string) {
  const payload = await apiRequest<{ message: string }>(
    `/admin/verify/${userId}`,
    {
      method: "PATCH",
    },
  );
  return payload;
}

export type CvData = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  yearsOfExperience: number;
  workExperiences: WorkExperience[];
  skills: string[];
  education: string;
  summary: string;
  resumeUrl?: string;
};

export async function getMyCV(): Promise<CvData | null> {
  const payload = await apiRequest<{ cv: CvData | null }>("/user/cv");
  return payload.cv;
}

export async function saveCV(data: Omit<CvData, "id" | "resumeUrl">): Promise<CvData> {
  const payload = await apiRequest<{ cv: CvData }>("/user/cv", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return payload.cv;
}

export async function generateCVSummary(data: {
  fullName: string;
  yearsOfExperience: number;
  education: string;
  skills: string[];
}): Promise<string> {
  const payload = await apiRequest<{ summary: string }>("/user/cv/generate-summary", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return payload.summary;
}

// ── Document / media upload ───────────────────────────────────────────────────
// Uses multipart/form-data — cannot reuse apiRequest() which forces JSON content-type.
// Endpoint: POST /api/media/upload  (requires auth cookie, 10 MB limit)
// Accepted types: application/pdf, image/jpeg, image/png, image/webp

export type UploadedFile = {
  secureUrl: string;
  originalName: string;
  mimeType: string;
  bytes: number;
};

export async function uploadDocumentFile(
  file: File,
  folder: string,
): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  // Do NOT set Content-Type — the browser must add it together with the multipart boundary
  const response = await fetch(`${API_BASE_URL}/media/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    let msg = `Upload failed (${response.status})`;
    try {
      const err = (await response.json()) as { message?: string };
      if (err.message) msg = err.message;
    } catch { /* ignore JSON parse errors */ }
    throw new Error(msg);
  }

  const payload = (await response.json()) as { file: UploadedFile };
  return payload.file;
}

