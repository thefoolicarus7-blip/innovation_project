import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loginNormalUserAccount } from "../store/slices/authSlice";

export function UserLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      loginNormalUserAccount({ email, password }),
    );
    if (loginNormalUserAccount.fulfilled.match(resultAction)) {
      navigate("/user/dashboard");
    }
  };

  return (
    <main className="centered-page">
      <div className="login-shell">
        <section className="login-media">
          <h2>Find your next big step.</h2>
          <p>
            Connect with leading companies and discover roles that match your
            passion and skills.
          </p>

          <div className="login-media-grid">
            <div className="login-media-item">
              <img
                src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800"
                alt="Working remotely"
              />
            </div>
            <div className="login-media-item">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800"
                alt="Coworking space"
              />
            </div>
          </div>
        </section>

        <section className="auth-card-wrap">
          <div className="auth-card">
            <div>
              <h1>Job Seeker Login</h1>
              <p>Welcome back to swipe2work. Enter your details to continue.</p>
            </div>

            <form className="form-grid" onSubmit={handleSubmit}>
              <div className="field-wrap">
                <label htmlFor="login-email">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field-wrap">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div style={{ color: "var(--danger)", fontSize: "0.85rem" }}>
                  {error}
                </div>
              )}

              <button type="submit" className="primary-btn">
                Sign In
              </button>

              <div style={{ textAlign: "right", marginTop: "8px" }}>
                <Link
                  to="/forgot-password"
                  style={{ fontSize: "0.85rem", color: "var(--muted)" }}
                >
                  Forgot password?
                </Link>
              </div>
            </form>

            <div
              style={{
                textAlign: "center",
                marginTop: "16px",
                fontSize: "0.9rem",
              }}
            >
              <span style={{ color: "var(--muted)" }}>
                Don't have an account?{" "}
              </span>
              <Link to="/user/register" style={{ fontWeight: 600 }}>
                Sign up
              </Link>
            </div>
            
            <div
              style={{
                textAlign: "center",
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "center",
                gap: "16px",
                fontSize: "0.85rem",
              }}
            >
              <Link to="/company/login" style={{ color: "var(--muted)", textDecoration: "underline" }}>
                Employer Portal
              </Link>
              <Link to="/admin/login" style={{ color: "var(--muted)", textDecoration: "underline" }}>
                Admin Access
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
