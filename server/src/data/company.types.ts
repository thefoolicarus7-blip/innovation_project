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

export type JobApplication = {
  id: string;
  jobId: number;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  appliedAt: string;
  status: "New" | "Shortlisted" | "Interview" | "Rejected";
};

export const COMPANY_TYPES_VERSION = "1.0.0";
