import mongoose from "mongoose";

const userDailyLimitSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    suggestedJobIds: {
      type: [Number],
      default: [],
    },
    appliedJobIds: {
      type: [Number],
      default: [],
    },
  },
  {
    versionKey: false,
  },
);

userDailyLimitSchema.index({ userId: 1, date: 1 }, { unique: true });

const UserDailyLimit = mongoose.model("UserDailyLimit", userDailyLimitSchema);

export default UserDailyLimit;
