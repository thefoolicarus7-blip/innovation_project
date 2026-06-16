import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getAdminUnverifiedUsers,
  getAdminUnverifiedCompanies,
  adminVerifyUser,
} from "../../services/api";

type AdminState = {
  unverifiedUsers: any[];
  unverifiedCompanies: any[];
  loading: boolean;
  error: string | null;
};

const initialState: AdminState = {
  unverifiedUsers: [],
  unverifiedCompanies: [],
  loading: false,
  error: null,
};

export const fetchUnverifiedUsers = createAsyncThunk(
  "admin/fetchUnverifiedUsers",
  async () => {
    return await getAdminUnverifiedUsers();
  },
);

export const fetchUnverifiedCompanies = createAsyncThunk(
  "admin/fetchUnverifiedCompanies",
  async () => {
    return await getAdminUnverifiedCompanies();
  },
);

export const verifyUserThunk = createAsyncThunk(
  "admin/verifyUserThunk",
  async (userId: string, { rejectWithValue }) => {
    try {
      await adminVerifyUser(userId);
      return userId;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Verification failed",
      );
    }
  },
);

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnverifiedUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUnverifiedUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.unverifiedUsers = action.payload;
      })
      .addCase(fetchUnverifiedUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch users";
      })
      .addCase(fetchUnverifiedCompanies.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUnverifiedCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.unverifiedCompanies = action.payload;
      })
      .addCase(fetchUnverifiedCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch companies";
      })
      .addCase(verifyUserThunk.fulfilled, (state, action) => {
        state.unverifiedUsers = state.unverifiedUsers.filter(
          (u) => u._id !== action.payload,
        );
        state.unverifiedCompanies = state.unverifiedCompanies.filter(
          (c) => c.id !== action.payload,
        );
      });
  },
});

export default adminSlice.reducer;
