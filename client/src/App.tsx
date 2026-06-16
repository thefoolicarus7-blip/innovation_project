import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { PortalLayout } from "./layouts/PortalLayout";
import { ApplicationsPage } from "./pages/ApplicationsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { CandidateProfilePage } from "./pages/CandidateProfilePage";
import { CandidatesPage } from "./pages/CandidatesPage";
import { CompanyProfilePage } from "./pages/CompanyProfilePage";
import { ForbiddenPage } from "./pages/ForbiddenPage";
import { JobsPage } from "./pages/JobsPage";
import { CompanyLoginPage } from "./pages/LoginPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { UserLayout } from "./layouts/UserLayout";
import { UserDashboardPage } from "./pages/UserDashboardPage";
import { UserApplicationsPage } from "./pages/UserApplicationsPage";
import { CVBuilderPage } from "./pages/CVBuilderPage";
import { UserLoginPage } from "./pages/UserLoginPage";
import { UserRegisterPage } from "./pages/UserRegisterPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { useAppDispatch } from "./store/hooks";
import { InterviewPrepPage } from "./pages/InterviewPrep";
import { AdminLayout } from "./layouts/AdminLayout";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminCompaniesPage } from "./pages/AdminCompaniesPage";
import { checkAuth } from "./store/slices/authSlice";

export default function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(checkAuth());
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<UserLoginPage />} />
      <Route path="/company/login" element={<CompanyLoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      <Route path="/user/login" element={<UserLoginPage />} />
      <Route path="/user/register" element={<UserRegisterPage />} />

      <Route element={<ProtectedRoute allowedRoles={["company"]} />}>
        <Route path="/portal" element={<PortalLayout />}>
          <Route index element={<Navigate to="jobs" replace />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="candidates" element={<CandidatesPage />} />
          <Route
            path="candidates/:candidateId"
            element={<CandidateProfilePage />}
          />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="company" element={<CompanyProfilePage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["User", "user"]} />}>
        <Route path="/user" element={<UserLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<UserDashboardPage />} />
          <Route path="applications" element={<UserApplicationsPage />} />
          <Route path="cv-builder" element={<CVBuilderPage />} />
          <Route path="interview-prep" element={<InterviewPrepPage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="companies" element={<AdminCompaniesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
