import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { registerNormalUserAccount } from "../store/slices/authSlice";

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

export function UserRegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const strength = getPasswordStrength(password);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { error } = useAppSelector((state: any) => state.auth);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const resultAction = await dispatch(
      registerNormalUserAccount({
        firstName,
        lastName,
        email,
        password,
      }),
    );
    if (registerNormalUserAccount.fulfilled.match(resultAction)) {
      navigate("/verify-email");
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
                <input
                  id="reg-password"
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

              {error && (
                <div style={{ color: "var(--danger)", fontSize: "0.85rem" }}>
                  {error}
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
