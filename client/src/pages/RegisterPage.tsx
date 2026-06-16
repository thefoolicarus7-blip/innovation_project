import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  clearAuthError,
  registerCompanyAccount,
} from "../store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

function getPasswordStrength(password: string) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const colors = ["#e5e7eb", "#ef4444", "#f97316", "#eab308", "#22c55e"];
  const labels = ["", "Very Weak", "Weak", "Fair", "Strong"];
  const level = Math.min(passed, 4);
  return { level, color: colors[level], label: labels[level], checks };
}

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: any) => state.auth.user);
  const error = useAppSelector((state: any) => state.auth.error);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const strength = getPasswordStrength(password);

  if (user) {
    if (user.isVerified !== "true") return <Navigate to="/verify-email" replace />;
    return <Navigate to="/portal/jobs" replace />;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch(clearAuthError());
    void dispatch(
      registerCompanyAccount({ firstName, lastName, email, password }),
    );
  };

  return (
    <div className="centered-page">
      <div className="login-shell">
        <section className="login-media">
          <div className="brand">
            <div className="brand-mark">s2w</div>
            <h2>swipe2work</h2>
          </div>
          <h2>Join the community of builders.</h2>
          <p>
            Create your company workspace and start discovering the talent that
            will define your future.
          </p>
          <div className="login-media-grid">
            <div className="login-media-item">
              <img
                src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=600"
                alt="Strategy"
              />
            </div>
            <div className="login-media-item">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600"
                alt="Culture"
              />
            </div>
            <div className="login-media-item">
              <img
                src="https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=600"
                alt="Growth"
              />
            </div>
            <div className="login-media-item">
              <img
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600"
                alt="Workspace"
              />
            </div>
          </div>
        </section>

        <div className="auth-card-wrap">
          <form className="auth-card" onSubmit={handleSubmit}>
            <div className="form-header">
              <h1>Get Started</h1>
              <p>Create your swipe2work company account.</p>
            </div>

            <div className="form-two-col">
              <div className="field-wrap">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  placeholder="Jane"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="field-wrap">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field-wrap">
              <label htmlFor="email">Work Email</label>
              <input
                id="email"
                type="email"
                placeholder="jane@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field-wrap">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {password.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                    {[1, 2, 3, 4].map((seg) => (
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
                  <ul style={{ listStyle: "none", padding: 0, margin: "6px 0 0", fontSize: "0.75rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px" }}>
                    {([["length","8+ chars"],["uppercase","Uppercase"],["lowercase","Lowercase"],["digit","Number"],["special","Special char"]] as const).map(([k, lbl]) => (
                      <li key={k} style={{ color: strength.checks[k] ? "#16a34a" : "#9ca3af" }}>
                        {strength.checks[k] ? "✓" : "○"} {lbl}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {error ? <p className="error-text">{error}</p> : null}

            <button type="submit" className="primary-btn">
              Create Account
            </button>

            <p
              style={{
                fontSize: "0.85rem",
                textAlign: "center",
                marginTop: "12px",
              }}
            >
              Already have an account?{" "}
              <Link to="/login" style={{ color: "var(--primary)" }}>
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
