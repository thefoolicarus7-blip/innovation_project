import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  loginCompany,
  logoutApi,
  registerCompany,
  loginNormalUser,
  registerNormalUser,
  getMe,
  verifyEmailCode,
  resendVerificationCodeApi,
  changePasswordApi,
} from "../../services/api";
import type { AuthUser, UserRole } from "../../types";

type LoginPayload = {
  email: string;
  password: string;
  role: UserRole;
};

type AuthState = {
  user: AuthUser | null;
  error: string | null;
};

const AUTH_STORAGE_KEY = "swipe2work_portal_auth_user";

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

const initialState: AuthState = {
  user: readStoredUser(),
  error: null,
};

export const loginCompanyUser = createAsyncThunk(
  "auth/loginCompanyUser",
  async ({ email, password, role }: LoginPayload, { rejectWithValue }) => {
    try {
      const payload = await loginCompany(email, password);
      return payload.user;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to login";
      return rejectWithValue(message);
    }
  },
);

export const registerCompanyAccount = createAsyncThunk(
  "auth/registerCompanyAccount",
  async (data: any, { rejectWithValue }) => {
    try {
      const payload = await registerCompany(data);
      return payload.user;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to register";
      return rejectWithValue(message);
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { dispatch }) => {
    try {
      await logoutApi();
    } finally {
      dispatch(authSlice.actions.clearUser());
    }
  },
);

export const loginNormalUserAccount = createAsyncThunk(
  "auth/loginNormalUserAccount",
  async (
    { email, password }: Omit<LoginPayload, "role">,
    { rejectWithValue },
  ) => {
    try {
      const payload = await loginNormalUser(email, password);
      return payload.user;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to login";
      return rejectWithValue(message);
    }
  },
);

export const registerNormalUserAccount = createAsyncThunk(
  "auth/registerNormalUserAccount",
  async (data: any, { rejectWithValue }) => {
    try {
      const payload = await registerNormalUser(data);
      return payload.user;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to register";
      return rejectWithValue(message);
    }
  },
);

export const verifyEmailAccount = createAsyncThunk(
  "auth/verifyEmailAccount",
  async ({ code, email }: { code: string; email?: string }, { rejectWithValue }) => {
    try {
      const payload = await verifyEmailCode(code, email);
      return payload.message;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unable to verify email",
      );
    }
  },
);

export const resendVerificationCode = createAsyncThunk(
  "auth/resendVerificationCode",
  async (email: string | undefined, { rejectWithValue }) => {
    try {
      const payload = await resendVerificationCodeApi(email);
      return payload.message;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unable to resend verification code",
      );
    }
  },
);

export const changeUserPassword = createAsyncThunk(
  "auth/changeUserPassword",
  async (
    { currentPassword, newPassword, confirmPassword }: any,
    { rejectWithValue },
  ) => {
    try {
      const payload = await changePasswordApi(
        currentPassword,
        newPassword,
        confirmPassword,
      );
      return payload.message;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unable to change password",
      );
    }
  },
);

export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const payload = await getMe();
      return payload.user;
    } catch (error) {
      return rejectWithValue("Session expired");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    clearUser(state) {
      state.user = null;
      state.error = null;
      localStorage.removeItem(AUTH_STORAGE_KEY);
    },
    setUserVerified(state) {
      if (state.user) {
        state.user.isVerified = "true";
      }
    },
  },
  extraReducers(builder) {
    builder
      .addCase(checkAuth.fulfilled, (state, action: PayloadAction<AuthUser>) => {
        state.user = action.payload;
        state.error = null;
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(action.payload));
      })
      .addCase(checkAuth.rejected, (state) => {
        state.user = null;
        state.error = null;
        localStorage.removeItem(AUTH_STORAGE_KEY);
      })
      .addCase(loginCompanyUser.pending, (state) => {
        state.error = null;
      })
      .addCase(
        loginCompanyUser.fulfilled,
        (state, action: PayloadAction<AuthUser>) => {
          state.user = action.payload;
          state.error = null;
          localStorage.setItem(
            AUTH_STORAGE_KEY,
            JSON.stringify(action.payload),
          );
        },
      )
      .addCase(loginCompanyUser.rejected, (state, action) => {
        state.error =
          (action.payload as string | undefined) ?? "Unable to login";
      })
      .addCase(registerCompanyAccount.pending, (state) => {
        state.error = null;
      })
      .addCase(
        registerCompanyAccount.fulfilled,
        (state, action: PayloadAction<AuthUser>) => {
          state.user = action.payload;
          state.error = null;
          localStorage.setItem(
            AUTH_STORAGE_KEY,
            JSON.stringify(action.payload),
          );
        },
      )
      .addCase(registerCompanyAccount.rejected, (state, action) => {
        state.error =
          (action.payload as string | undefined) ?? "Unable to register";
      })
      .addCase(loginNormalUserAccount.pending, (state) => {
        state.error = null;
      })
      .addCase(
        loginNormalUserAccount.fulfilled,
        (state, action: PayloadAction<AuthUser>) => {
          state.user = action.payload;
          state.error = null;
          localStorage.setItem(
            AUTH_STORAGE_KEY,
            JSON.stringify(action.payload),
          );
        },
      )
      .addCase(loginNormalUserAccount.rejected, (state, action) => {
        state.error =
          (action.payload as string | undefined) ?? "Unable to login";
      })
      .addCase(registerNormalUserAccount.pending, (state) => {
        state.error = null;
      })
      .addCase(
        registerNormalUserAccount.fulfilled,
        (state, action: PayloadAction<AuthUser>) => {
          state.user = action.payload;
          state.error = null;
          localStorage.setItem(
            AUTH_STORAGE_KEY,
            JSON.stringify(action.payload),
          );
        },
      )
      .addCase(registerNormalUserAccount.rejected, (state, action) => {
        state.error =
          (action.payload as string | undefined) ?? "Unable to register";
      })
      .addCase(verifyEmailAccount.pending, (state) => {
        state.error = null;
      })
      .addCase(verifyEmailAccount.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(verifyEmailAccount.rejected, (state, action) => {
        state.error =
          (action.payload as string | undefined) ?? "Unable to verify email";
      })
      .addCase(resendVerificationCode.pending, (state) => {
        state.error = null;
      })
      .addCase(resendVerificationCode.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(resendVerificationCode.rejected, (state, action) => {
        state.error =
          (action.payload as string | undefined) ??
          "Unable to resend verification code";
      });
  },
});

export const { clearAuthError, clearUser, setUserVerified } = authSlice.actions;
export default authSlice.reducer;
