import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPasswordApi } from "../services/api";

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

  // All 5 checks met → level 4; we cap at 4 but passed goes 0-5
  const capped = Math.min(passed, 4) as StrengthLevel;
  return { level: capped, label: labels[capped], color: colors[capped], checks };
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const strength = getPasswordStrength(newPassword);

  // Auto-redirect to login after success
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => navigate("/"), 3000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match");
      return;
    }

    if (strength.level < 4) {
      setStatus("error");
      setMessage("Please meet all password requirements before submitting");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const data = await resetPasswordApi(token.trim(), newPassword, confirmPassword);
      setStatus("success");
      setMessage(data.message);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  return (
    <main className="centered-page">
      <div className="login-shell">
        <section className="auth-card-wrap" style={{ gridColumn: "1 / -1" }}>
          <div
            className="auth-card"
            style={{ maxWidth: "440px", margin: "0 auto", width: "100%" }}
          >
            <div className="form-header">
              <h1>Reset Password</h1>
              <p>Enter your reset token and choose a new secure password.</p>
            </div>

            {status === "success" ? (
              <div>
                <div
                  style={{
                    padding: "14px 16px",
                    background: "var(--success-bg, #ecfdf5)",
                    border: "1px solid var(--success, #10b981)",
                    borderRadius: "8px",
                    color: "var(--success, #065f46)",
                    fontSize: "0.9rem",
                    marginBottom: "16px",
                  }}
                >
                  {message} Redirecting to login…
                </div>
                <Link to="/" className="primary-btn" style={{ textAlign: "center", display: "block" }}>
                  Go to Login
                </Link>
              </div>
            ) : (
              <form className="form-grid" onSubmit={handleSubmit}>
                <div className="field-wrap">
                  <label htmlFor="rp-token">Reset Token</label>
                  <input
                    id="rp-token"
                    type="text"
                    placeholder="Paste your reset token here"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                    style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                  />
                </div>

                <div className="field-wrap">
                  <label htmlFor="rp-password">New Password</label>
                  <input
                    id="rp-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />

                  {/* Strength bar */}
                  {newPassword.length > 0 && (
                    <div style={{ marginTop: "8px" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "4px",
                          marginBottom: "6px",
                        }}
                      >
                        {([1, 2, 3, 4] as StrengthLevel[]).map((seg) => (
                          <div
                            key={seg}
                            style={{
                              flex: 1,
                              height: "4px",
                              borderRadius: "2px",
                              background:
                                strength.level >= seg
                                  ? strength.color
                                  : "#e5e7eb",
                              transition: "background 0.2s",
                            }}
                          />
                        ))}
                      </div>
                      {strength.label && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: strength.color,
                            fontWeight: 600,
                          }}
                        >
                          {strength.label}
                        </span>
                      )}

                      {/* Requirement checklist */}
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
                            ["length", "8+ characters"],
                            ["uppercase", "Uppercase letter"],
                            ["lowercase", "Lowercase letter"],
                            ["digit", "Number"],
                            ["special", "Special character"],
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

                <div className="field-wrap">
                  <label htmlFor="rp-confirm">Confirm New Password</label>
                  <input
                    id="rp-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                    <span style={{ fontSize: "0.78rem", color: "var(--danger)" }}>
                      Passwords do not match
                    </span>
                  )}
                </div>

                {status === "error" && (
                  <div style={{ color: "var(--danger)", fontSize: "0.85rem" }}>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Resetting…" : "Reset Password"}
                </button>
              </form>
            )}

            <div
              style={{
                textAlign: "center",
                marginTop: "16px",
                fontSize: "0.9rem",
              }}
            >
              <Link to="/forgot-password" style={{ color: "var(--muted)" }}>
                Request a new token
              </Link>
              {" · "}
              <Link to="/" style={{ fontWeight: 600 }}>
                Back to Login
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
