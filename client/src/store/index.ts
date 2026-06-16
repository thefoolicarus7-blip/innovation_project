import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import portalReducer from "./slices/portalSlice";
import userReducer from "./slices/userSlice";
import adminReducer from "./slices/adminSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    portal: portalReducer,
    user: userReducer,
    admin: adminReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
