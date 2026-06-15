import mongoose from "mongoose";

const companyApplicationSchema = new mongoose.Schema(
  {
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    id: {
      type: String,
      required: true,
    },
    jobId: {
      type: Number,
      required: true,
    },
    candidateId: {
      type: String,
      required: true,
    },
    candidateName: {
      type: String,
      required: true,
      trim: true,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    appliedAt: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["New", "Shortlisted", "Interview", "Rejected"],
      required: true,
    },
  },
  {
    versionKey: false,
  },
);

companyApplicationSchema.index({ ownerId: 1, id: 1 }, { unique: true });

const CompanyApplication = mongoose.model("CompanyApplication", companyApplicationSchema);

export default CompanyApplication;
