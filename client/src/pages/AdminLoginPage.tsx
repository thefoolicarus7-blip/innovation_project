import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loginCompanyUser } from "../store/slices/authSlice";

export function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, error } = useAppSelector((state: any) => state.auth);

  if (user) {
    const role = user.role.toLowerCase();
    if (role === "admin") return <Navigate to="/admin" replace />;
    if (role === "company") return <Navigate to="/portal/jobs" replace />;
    return <Navigate to="/user/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const resultAction = await dispatch(
      loginCompanyUser({ email, password, role: "Admin" }),
    );
    if (loginCompanyUser.fulfilled.match(resultAction)) {
      navigate("/admin");
    }
  };

  return (
    <main
      className="centered-page"
      style={{
        background: "radial-gradient(circle at center, #111 0%, #000 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle Grid Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      <div
        className="login-shell"
        style={{
          maxWidth: "480px",
          gridTemplateColumns: "1fr",
          border: "1px solid var(--border-strong)",
          background: "rgba(18, 18, 21, 0.8)",
          backdropFilter: "blur(20px)",
        }}
      >
        <section className="auth-card-wrap" style={{ padding: "48px" }}>
          <div className="auth-card">
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "56px",
                  height: "56px",
                  background: "var(--danger)",
                  borderRadius: "var(--radius-md)",
                  color: "white",
                  fontSize: "1.2rem",
                  fontWeight: "900",
                  marginBottom: "16px",
                  boxShadow: "0 0 30px rgba(239, 68, 68, 0.3)",
                }}
              >
                s2w
              </div>
              <h1 style={{ fontSize: "1.75rem", marginBottom: "8px" }}>Administrative Access</h1>
              <p style={{ fontSize: "0.9rem" }}>Secure gateway for swipe2work platform oversight.</p>
            </div>

            <form className="form-grid" onSubmit={handleSubmit}>
              <div className="field-wrap">
                <label htmlFor="login-email">AUTHORIZED EMAIL</label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="admin@nysa.com"
                  style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-strong)" }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field-wrap">
                <label htmlFor="login-password">SECURE PASSWORD</label>
                <div className="password-input-wrapper">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-strong)" }}
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
              </div>

              {error && (
                <div
                  style={{
                    color: "var(--danger)",
                    fontSize: "0.85rem",
                    textAlign: "center",
                    background: "rgba(239, 68, 68, 0.1)",
                    padding: "8px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="primary-btn"
                style={{
                  background: "var(--danger)",
                  color: "white",
                  marginTop: "8px",
                  height: "48px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  fontSize: "0.85rem",
                }}
              >
                Verify & Authenticate
              </button>
            </form>

            <div
              style={{
                marginTop: "32px",
                padding: "16px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
              }}
            >
              <p style={{ fontSize: "0.75rem", lineHeight: "1.5", color: "var(--muted-foreground)", textAlign: "center", margin: 0 }}>
                <strong>SECURITY ADVISORY:</strong> This system is restricted to authorized personnel. All access attempts are logged and monitored.
              </p>
            </div>

            <div
              style={{
                textAlign: "center",
                marginTop: "24px",
                paddingTop: "16px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "center",
                gap: "24px",
                fontSize: "0.8rem",
              }}
            >
              <Link to="/" style={{ color: "var(--muted)", fontWeight: "500" }}>
                User Portal
              </Link>
              <Link to="/company/login" style={{ color: "var(--muted)", fontWeight: "500" }}>
                Employer Portal
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
