import mongoose from "mongoose";

const companyJobSchema = new mongoose.Schema(
  {
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    id: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Remote"],
      required: true,
    },
    salaryRange: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Open", "Paused", "Closed"],
      required: true,
    },
    createdAt: {
      type: String,
      required: true,
    },
    deadline: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    experienceLevel: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    versionKey: false,
  },
);

companyJobSchema.index({ ownerId: 1, id: 1 }, { unique: true });

const CompanyJob = mongoose.model("CompanyJob", companyJobSchema);

export default CompanyJob;
