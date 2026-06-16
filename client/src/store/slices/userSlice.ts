import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  getUserJobs,
  applyToJob,
  getUserApplications,
} from "../../services/api";
import type { Job, UserApplication, UserDailyStats } from "../../types";

type UserState = {
  suggestedJobs: Job[];
  applications: UserApplication[];
  dailyStats: UserDailyStats | null;
  jobsLoading: boolean;
  applicationsLoading: boolean;
  error: string | null;
};

const initialState: UserState = {
  suggestedJobs: [],
  applications: [],
  dailyStats: null,
  jobsLoading: false,
  applicationsLoading: false,
  error: null,
};

export const loadUserJobs = createAsyncThunk("user/loadUserJobs", async () => {
  const payload = await getUserJobs();
  return payload;
});

export const applyToJobThunk = createAsyncThunk(
  "user/applyToJobThunk",
  async (jobId: number, { rejectWithValue }) => {
    try {
      const payload = await applyToJob(jobId);
      return payload.application;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to apply";
      return rejectWithValue(message);
    }
  },
);

export const loadUserApplications = createAsyncThunk(
  "user/loadUserApplications",
  async (tab?: "matches" | "let_it_go" | "all") => {
    const payload = await getUserApplications(tab);
    return payload.items;
  },
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadUserJobs.pending, (state) => {
        state.jobsLoading = true;
        state.error = null;
      })
      .addCase(loadUserJobs.fulfilled, (state, action) => {
        state.jobsLoading = false;
        state.suggestedJobs = action.payload.items;
        state.dailyStats = action.payload.dailyStats;
      })
      .addCase(loadUserJobs.rejected, (state, action) => {
        state.jobsLoading = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Failed to load jobs";
      })
      .addCase(applyToJobThunk.fulfilled, (state, action) => {
        state.applications = [action.payload, ...state.applications];
        if (state.dailyStats) {
          state.dailyStats.appliedToday += 1;
        }
      })
      .addCase(applyToJobThunk.rejected, (state, action) => {
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Failed to apply";
      })
      .addCase(loadUserApplications.pending, (state) => {
        state.applicationsLoading = true;
        state.error = null;
      })
      .addCase(loadUserApplications.fulfilled, (state, action) => {
        state.applicationsLoading = false;
        state.applications = action.payload;
      })
      .addCase(loadUserApplications.rejected, (state, action) => {
        state.applicationsLoading = false;
        state.error = "Failed to load applications";
      });
  },
});

export default userSlice.reducer;
