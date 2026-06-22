import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  createCompanyJob,
  getApplications,
  getCandidates,
  getCompanyAnalytics,
  getCompanyJobs,
  getCompanyProfile,
  saveCompanyProfile,
  updateApplication,
} from "../../services/api";
import type {
  Candidate,
  CompanyAnalytics,
  CompanyProfile,
  Job,
  JobApplication,
} from "../../types";

type PortalState = {
  jobs: Job[];
  applications: JobApplication[];
  candidates: Candidate[];
  companyProfile: CompanyProfile | null;
  analytics: CompanyAnalytics | null;
  loading: boolean;
  error: string | null;
};

const initialState: PortalState = {
  jobs: [],
  applications: [],
  candidates: [],
  companyProfile: null,
  analytics: null,
  loading: false,
  error: null,
};

export const loadPortalData = createAsyncThunk(
  "portal/loadPortalData",
  async () => {
    const [jobs, applications, candidates, companyProfile, analytics] =
      await Promise.allSettled([
        getCompanyJobs(),
        getApplications(),
        getCandidates(),
        getCompanyProfile(),
        getCompanyAnalytics(),
      ]);

    return {
      jobs:          jobs.status          === "fulfilled" ? jobs.value          : [],
      applications:  applications.status  === "fulfilled" ? applications.value  : [],
      candidates:    candidates.status    === "fulfilled" ? candidates.value    : [],
      companyProfile: companyProfile.status === "fulfilled" ? companyProfile.value : null,
      analytics:     analytics.status     === "fulfilled" ? analytics.value     : null,
    };
  },
);

export const addJob = createAsyncThunk(
  "portal/addJob",
  async (input: Omit<Job, "id" | "createdAt">) => {
    return createCompanyJob(input);
  },
);

export const patchApplicationStatusAsync = createAsyncThunk(
  "portal/patchApplicationStatusAsync",
  async ({
    applicationId,
    status,
  }: {
    applicationId: string;
    status: JobApplication["status"];
  }) => {
    return updateApplication(applicationId, status);
  },
);

export const updateCompanyProfile = createAsyncThunk(
  "portal/updateCompanyProfile",
  async (input: CompanyProfile) => {
    return saveCompanyProfile(input);
  },
);

const portalSlice = createSlice({
  name: "portal",
  initialState,
  reducers: {
    updateApplicationStatus(
      state,
      action: PayloadAction<{
        applicationId: string;
        status: JobApplication["status"];
      }>,
    ) {
      const target = state.applications.find(
        (application) => application.id === action.payload.applicationId,
      );
      if (target) {
        target.status = action.payload.status;
      }
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadPortalData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadPortalData.fulfilled, (state, action) => {
        state.loading = false;
        state.jobs = action.payload.jobs;
        state.applications = action.payload.applications;
        state.candidates = action.payload.candidates;
        state.companyProfile = action.payload.companyProfile;
        state.analytics = action.payload.analytics;
      })
      .addCase(loadPortalData.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to load portal data.";
      })
      .addCase(addJob.fulfilled, (state, action) => {
        state.jobs = [action.payload, ...state.jobs];
      })
      .addCase(addJob.rejected, (state) => {
        state.error = "Unable to create job.";
      })
      .addCase(patchApplicationStatusAsync.fulfilled, (state, action) => {
        const target = state.applications.find(
          (application) => application.id === action.payload.id,
        );
        if (target) {
          target.status = action.payload.status;
        }
      })
      .addCase(patchApplicationStatusAsync.rejected, (state) => {
        state.error = "Unable to update application status.";
      })
      .addCase(updateCompanyProfile.fulfilled, (state, action) => {
        state.companyProfile = action.payload;
      })
      .addCase(updateCompanyProfile.rejected, (state) => {
        state.error = "Unable to save company profile.";
      });
  },
});

export const { updateApplicationStatus } = portalSlice.actions;
export default portalSlice.reducer;
