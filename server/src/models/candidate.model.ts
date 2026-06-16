import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    yearsOfExperience: {
      type: Number,
      required: true,
      min: 0,
    },
    skills: {
      type: [String],
      default: [],
    },
    education: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    resumeUrl: {
      type: String,
      default: "",
    },
  },
  {
    versionKey: false,
  },
);

const Candidate = mongoose.model("Candidate", candidateSchema);

export default Candidate;
