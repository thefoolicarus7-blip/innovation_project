import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { clearAuthError, loginCompanyUser } from "../store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

export function CompanyLoginPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: any) => state.auth.user);
  const error = useAppSelector((state: any) => state.auth.error);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  if (user) {
    const role = user.role.toLowerCase();
    if (role === "admin") return <Navigate to="/admin" replace />;
    if (role === "company") return <Navigate to="/portal/jobs" replace />;
    return <Navigate to="/user/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch(clearAuthError());
    const resultAction = await dispatch(
      loginCompanyUser({ email, password, role: "company" }),
    );
    if (loginCompanyUser.fulfilled.match(resultAction)) {
      navigate("/portal/jobs");
    }
  };

  return (
    <div className="centered-page">
      <div className="login-shell">
        <section className="login-media">
          <div className="brand">
            <div className="brand-mark">s2w</div>
            <h2>swipe2work</h2>
          </div>
          <h2>Hire the best talent for your community.</h2>
          <p>
            Join the movement and start discovering talent that makes a
            difference.
          </p>
          <div className="login-media-grid">
            <div className="login-media-item">
              <img
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600"
                alt="Team meeting"
              />
            </div>
            <div className="login-media-item">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600"
                alt="Collaboration"
              />
            </div>
          </div>
        </section>

        <div className="auth-card-wrap">
          <form className="auth-card" onSubmit={handleSubmit}>
            <div className="form-header">
              <h1>Employer Login</h1>
              <p>Sign in to your swipe2work Company Portal.</p>
            </div>

            <div className="field-wrap">
              <label htmlFor="email">Work Email</label>
              <input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {error ? <p className="error-text">{error}</p> : null}

            <button type="submit" className="primary-btn">
              Sign In to Portal
            </button>

            <p
              style={{
                fontSize: "0.85rem",
                textAlign: "center",
                marginTop: "12px",
              }}
            >
              Don't have a company account?{" "}
              <Link to="/register" style={{ color: "var(--primary)" }}>
                Get Started
              </Link>
            </p>

            <div
              style={{
                textAlign: "center",
                marginTop: "16px",
                paddingTop: "12px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "center",
                gap: "16px",
                fontSize: "0.85rem",
              }}
            >
              <Link to="/" style={{ color: "var(--muted)", textDecoration: "underline" }}>
                Job Seeker Login
              </Link>
              <Link to="/admin/login" style={{ color: "var(--muted)", textDecoration: "underline" }}>
                Admin Access
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
