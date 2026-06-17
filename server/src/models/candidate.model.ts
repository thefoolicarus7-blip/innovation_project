import mongoose from "mongoose";

export interface WorkExperienceEntry {
  jobTitle: string;
  company: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface CandidateDocument extends mongoose.Document {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  yearsOfExperience: number;
  workExperiences: WorkExperienceEntry[];
  skills: string[];
  education: string;
  summary: string;
  resumeUrl?: string;
}

interface CandidateData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  yearsOfExperience: number;
  workExperiences: WorkExperienceEntry[];
  skills: string[];
  education: string;
  summary: string;
  resumeUrl?: string;
}

const workExperienceSchema = new mongoose.Schema<WorkExperienceEntry>(
  {
    jobTitle: { type: String, required: true },
    company: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String },
    description: { type: String },
  },
  { _id: false },
);

const candidateSchema = new mongoose.Schema<CandidateDocument>(
  {
    id: { type: String, required: true, index: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    dateOfBirth: { type: String },
    gender: { type: String },
    address: { type: String },
    yearsOfExperience: { type: Number, required: true },
    workExperiences: { type: [workExperienceSchema], default: [] },
    skills: { type: [String], default: [] },
    education: { type: String, required: true },
    summary: { type: String, required: true },
    resumeUrl: { type: String, default: undefined },
  },
  {
    versionKey: false,
  },
);

const CandidateModel = mongoose.models.Candidate || mongoose.model<CandidateDocument>("Candidate", candidateSchema);

const Candidate = {
  async findOne(query: { id?: string }): Promise<CandidateDocument | null> {
    return CandidateModel.findOne(query).exec();
  },

  async find(): Promise<CandidateDocument[]> {
    return CandidateModel.find().sort({ fullName: 1 }).exec();
  },

  async upsert(
    id: string,
    data: Omit<CandidateData, "id">,
  ): Promise<CandidateDocument> {
    const updated = await CandidateModel.findOneAndUpdate(
      { id },
      { ...data, id },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    ).exec();

    if (!updated) {
      throw new Error("Unable to upsert candidate");
    }

    return updated;
  },
};

export default Candidate;
