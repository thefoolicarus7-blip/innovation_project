import mongoose from "mongoose";

const companyProfileSchema = new mongoose.Schema(
  {
    ownerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    companyType: {
      type: String,
      required: true,
    },
    industry: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    website: {
      type: String,
      default: "",
    },
    about: {
      type: String,
      required: true,
    },
    teamSize: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
  },
);

const CompanyProfile = mongoose.model("CompanyProfile", companyProfileSchema);

export default CompanyProfile;
