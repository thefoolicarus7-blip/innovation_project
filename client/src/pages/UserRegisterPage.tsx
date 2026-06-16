import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { registerNormalUserAccount } from "../store/slices/authSlice";

export function UserRegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      navigate("/user/dashboard");
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
