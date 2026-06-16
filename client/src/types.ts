export type UserRole = "Admin" | "admin" | "company" | "user" | "User";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string;
  token?: string;
};

export type Job = {
  id: number;
  title: string;
  location: string;
  employmentType: "Full-time" | "Part-time" | "Contract" | "Remote";
  salaryRange: string;
  status: "Open" | "Paused" | "Closed";
  createdAt: string;
  deadline: string;
  tags: string[];
  experienceLevel: string;
};

export type Candidate = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  yearsOfExperience: number;
  skills: string[];
  education: string;
  summary: string;
  resumeUrl?: string;
};

export type JobApplication = {
  id: string;
  jobId: number;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  appliedAt: string;
  status: "New" | "Shortlisted" | "Interview" | "Rejected";
};

export type CompanyProfile = {
  companyName: string;
  companyType: string;
  industry: string;
  address: string;
  city: string;
  country: string;
  website: string;
  about: string;
  teamSize: string;
};

export type CompanyAnalytics = {
  totalJobs: number;
  openJobs: number;
  totalApplications: number;
  shortlisted: number;
  interviews: number;
  conversionRate: number;
  applicationsByJob: Array<{ jobTitle: string; count: number }>;
};

export type UserDailyStats = {
  suggestedToday: number;
  appliedToday: number;
  applyLimit: number;
  suggestLimit: number;
  date: string;
};

export type UserApplication = {
  _id: string;
  id: string;
  jobId: number;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  appliedAt: string;
  status: "New" | "Shortlisted" | "Interview" | "Rejected";
};
