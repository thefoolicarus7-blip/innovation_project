import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../store/hooks";
import { changeUserPassword } from "../store/slices/authSlice";

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

interface StrengthResult {
  level: StrengthLevel;
  label: string;
  color: string;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    digit: boolean;
    special: boolean;
  };
}

function getPasswordStrength(password: string): StrengthResult {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const passed = Object.values(checks).filter(Boolean).length as StrengthLevel;

  const labels: Record<StrengthLevel, string> = {
    0: "",
    1: "Very Weak",
    2: "Weak",
    3: "Fair",
    4: "Strong",
  };
  const colors: Record<StrengthLevel, string> = {
    0: "#e5e7eb",
    1: "#ef4444",
    2: "#f97316",
    3: "#eab308",
    4: "#22c55e",
  };

  const capped = Math.min(passed, 4) as StrengthLevel;
  return { level: capped, label: labels[capped], color: colors[capped], checks };
}

export function ChangePasswordPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      setSuccessMsg("");
      return;
    }

    if (strength.level < 4) {
      setErrorMsg("Please meet all password requirements before submitting");
      setSuccessMsg("");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const resultAction = await dispatch(
        changeUserPassword({ currentPassword, newPassword, confirmPassword })
      );

      if (changeUserPassword.fulfilled.match(resultAction)) {
        setSuccessMsg("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setErrorMsg(resultAction.payload as string ?? "Failed to change password");
      }
    } catch (err: any) {
      setErrorMsg(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "480px", margin: "24px auto", width: "100%" }}>
      <div className="auth-card">
        <div className="form-header">
          <h1>Change Password</h1>
          <p>Update your password to keep your workspace secure.</p>
        </div>

        {successMsg && (
          <div
            style={{
              padding: "12px 16px",
              background: "#ecfdf5",
              border: "1px solid #10b981",
              borderRadius: "8px",
              color: "#065f46",
              fontSize: "0.9rem",
              marginBottom: "16px",
            }}
          >
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              padding: "12px 16px",
              background: "#fef2f2",
              border: "1px solid #ef4444",
              borderRadius: "8px",
              color: "#991b1b",
              fontSize: "0.9rem",
              marginBottom: "16px",
            }}
          >
            {errorMsg}
          </div>
        )}

        <form className="form-grid" onSubmit={handleSubmit}>
          {/* Current Password */}
          <div className="field-wrap">
            <label htmlFor="current-pwd">Current Password</label>
            <div className="password-input-wrapper">
              <input
                id="current-pwd"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                aria-label={showCurrentPassword ? "Hide password" : "Show password"}
              >
                {showCurrentPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="field-wrap">
            <label htmlFor="new-pwd">New Password</label>
            <div className="password-input-wrapper">
              <input
                id="new-pwd"
                type={showNewPassword ? "text" : "password"}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>

            {/* Strength checklist */}
            {newPassword.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                  {([1, 2, 3, 4] as StrengthLevel[]).map((seg) => (
                    <div
                      key={seg}
                      style={{
                        flex: 1,
                        height: "4px",
                        borderRadius: "2px",
                        background: strength.level >= seg ? strength.color : "#e5e7eb",
                        transition: "background 0.2s",
                      }}
                    />
                  ))}
                </div>
                {strength.label && (
                  <span style={{ fontSize: "0.75rem", color: strength.color, fontWeight: 600 }}>
                    {strength.label}
                  </span>
                )}

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "8px 0 0",
                    fontSize: "0.78rem",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "4px",
                  }}
                >
                  {(
                    [
                      ["length", "At least 8 characters"],
                      ["uppercase", "One uppercase letter"],
                      ["lowercase", "One lowercase letter"],
                      ["digit", "One number"],
                      ["special", "One special character"],
                    ] as const
                  ).map(([key, label]) => (
                    <li
                      key={key}
                      style={{
                        color: strength.checks[key] ? "#16a34a" : "#6b7280",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span>{strength.checks[key] ? "✓" : "○"}</span>
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="field-wrap">
            <label htmlFor="confirm-pwd">Confirm New Password</label>
            <div className="password-input-wrapper">
              <input
                id="confirm-pwd"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <span style={{ fontSize: "0.78rem", color: "var(--danger)" }}>
                Passwords do not match
              </span>
            )}
          </div>

          <button
            type="submit"
            className="primary-btn"
            disabled={loading}
            style={{ marginTop: "12px" }}
          >
            {loading ? "Saving…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
