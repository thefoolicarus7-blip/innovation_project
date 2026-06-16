import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  clearAuthError,
  registerCompanyAccount,
} from "../store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: any) => state.auth.user);
  const error = useAppSelector((state: any) => state.auth.error);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/portal/jobs" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setLocalError("Please enter a valid email address.");
      return;
    }
    setLocalError("");
    dispatch(clearAuthError());
    const resultAction = await dispatch(
      registerCompanyAccount({ firstName, lastName, email: email.trim(), password }),
    );
    if (registerCompanyAccount.fulfilled.match(resultAction)) {
      navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
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
              <div className="password-input-wrapper">
                <input
                  id="password"
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
            </div>

            {(localError || error) ? <p className="error-text">{localError || error}</p> : null}

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
