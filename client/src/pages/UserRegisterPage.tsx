import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { registerNormalUserAccount } from "../store/slices/authSlice";

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

export function UserRegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { error } = useAppSelector((state: any) => state.auth);

  const strength = getPasswordStrength(password);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setLocalError("Please enter a valid email address.");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    if (strength.level < 4) {
      setLocalError("Please meet all password requirements before submitting");
      return;
    }

    setLocalError("");

    const resultAction = await dispatch(
      registerNormalUserAccount({
        firstName,
        lastName,
        email: email.trim(),
        password,
      }),
    );
    if (registerNormalUserAccount.fulfilled.match(resultAction)) {
      if (resultAction.payload?.user?.isVerified === "true") {
        navigate("/");
      } else {
        navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
      }
    }
  };

  return (
    <main className="centered-page">
      <div className="login-shell">
        <section className="auth-card-wrap" style={{ gridColumn: "1 / -1" }}>
          <div
            className="auth-card"
            style={{ maxWidth: "480px", margin: "0 auto", width: "100%" }}
          >
            <div>
              <h1>Join swipe2work Today</h1>
              <p>
                Create your profile to start discovering and applying to the
                best roles.
              </p>
            </div>

            <form className="form-grid" onSubmit={handleSubmit}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <div className="field-wrap">
                  <label htmlFor="reg-first">First Name</label>
                  <input
                    id="reg-first"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="field-wrap">
                  <label htmlFor="reg-last">Last Name</label>
                  <input
                    id="reg-last"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field-wrap">
                <label htmlFor="reg-email">Email Address</label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field-wrap">
                <label htmlFor="reg-password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </div>

                {/* Strength checklist */}
                {password.length > 0 && (
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
                <label htmlFor="reg-confirm-password">Confirm Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="reg-confirm-password"
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
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <span style={{ fontSize: "0.78rem", color: "var(--danger)" }}>
                    Passwords do not match
                  </span>
                )}
              </div>

              {(localError || error) && (
                <div style={{ color: "var(--danger)", fontSize: "0.85rem" }}>
                  {localError || error}
                </div>
              )}

              <button type="submit" className="primary-btn">
                Create Account
              </button>
            </form>

            <div
              style={{
                textAlign: "center",
                marginTop: "16px",
                fontSize: "0.9rem",
              }}
            >
              <span style={{ color: "var(--muted)" }}>
                Already have an account?{" "}
              </span>
              <Link to="/" style={{ fontWeight: 600 }}>
                Sign in
              </Link>
            </div>

            <div
              style={{
                textAlign: "center",
                marginTop: "4px",
                fontSize: "0.9rem",
              }}
            >
              <span style={{ color: "var(--muted)" }}>
                Are you an employer?{" "}
              </span>
              <Link to="/register" style={{ fontWeight: 600 }}>
                Create a company account
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
