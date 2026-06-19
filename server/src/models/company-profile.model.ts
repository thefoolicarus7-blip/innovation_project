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
      default: "",
    },
    industry: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    website: {
      type: String,
      default: "",
    },
    about: {
      type: String,
      default: "",
    },
    teamSize: {
      type: String,
      default: "",
    },
    // Verification document URLs — saved when company uploads docs for admin review
    businessRegDocUrl:       { type: String, default: undefined },
    taxIdDocUrl:             { type: String, default: undefined },
    // Verification workflow state
    verificationStatus: {
      type: String,
      enum: ["Not Verified", "Pending Review", "Verified", "Rejected"],
      default: "Not Verified",
    },
    rejectionReason:         { type: String, default: "" },
  },
  {
    versionKey: false,
  },
);

const CompanyProfile = mongoose.model("CompanyProfile", companyProfileSchema);

export default CompanyProfile;
