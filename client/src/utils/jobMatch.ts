import type { Candidate, Job } from "../types";

export type JobMatchResult = {
  score: number; // 0 to 100
  matchedSkills: string[];
  missingSkills: string[];
  educationMatch: boolean;
  experienceMatch: boolean;
};

export function calculateJobScore(user: Candidate | null, job: Job): JobMatchResult {
  if (!user) {
    return {
      score: 0,
      matchedSkills: [],
      missingSkills: job.requiredSkills || [],
      educationMatch: false,
      experienceMatch: false,
    };
  }

  // 1. Skills Match (70%)
  const userSkills = (user.skills || []).map((s) => s.toLowerCase().trim());
  const combinedReqSkills = Array.from(new Set([...(job.requiredSkills || []), ...(job.tags || [])]));
  const reqSkills = combinedReqSkills.map((s) => s.toLowerCase().trim());
  
  let matchedSkills: string[] = [];
  let missingSkills: string[] = [];
  let skillsScore = 0;

  if (reqSkills.length === 0) {
    skillsScore = 70; // if no skills required, full marks for skills
  } else {
    for (let i = 0; i < combinedReqSkills.length; i++) {
      const originalSkill = combinedReqSkills[i];
      const normalizedSkill = reqSkills[i];
      if (userSkills.includes(normalizedSkill)) {
        matchedSkills.push(originalSkill);
      } else {
        missingSkills.push(originalSkill);
      }
    }
    const skillMatchPercentage = matchedSkills.length / reqSkills.length;
    skillsScore = skillMatchPercentage * 70;
  }

  // 2. Education Match (15%)
  // Simple check: if job has preferred education, does the user have it?
  // We can do a case-insensitive includes for simplicity.
  let educationMatch = false;
  let eduScore = 0;
  if (!job.preferredEducation || job.preferredEducation.trim() === "") {
    educationMatch = true;
    eduScore = 15;
  } else if (user.education) {
    const userEdu = user.education.toLowerCase();
    const jobEdu = job.preferredEducation.toLowerCase();
    if (userEdu.includes(jobEdu) || jobEdu.includes(userEdu) || userEdu === jobEdu) {
      educationMatch = true;
      eduScore = 15;
    }
  }

  // 3. Experience Match (15%)
  let experienceMatch = false;
  let expScore = 0;
  const userExp = user.yearsOfExperience || 0;
  const reqExp = job.requiredExperience || 0;

  if (userExp >= reqExp) {
    experienceMatch = true;
    expScore = 15;
  }

  // Calculate final score
  const finalScore = Math.round(skillsScore + eduScore + expScore);

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    matchedSkills,
    missingSkills,
    educationMatch,
    experienceMatch,
  };
}
