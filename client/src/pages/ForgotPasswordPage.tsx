import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordApi } from "../services/api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  // In development the server returns the raw token so testers don't need email.
  const [devToken, setDevToken] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    setDevToken(null);

    try {
      const data = await forgotPasswordApi(email.trim());
      setStatus("success");
      setMessage(data.message);
      if (data.resetToken) {
        setDevToken(data.resetToken);
      }
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
              <h1>Forgot Password</h1>
              <p>
                Enter the email address linked to your account and we will
                generate a reset token for you.
              </p>
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
                  {message}
                </div>

                {devToken && (
                  <div
                    style={{
                      padding: "14px 16px",
                      background: "#fff7ed",
                      border: "1px solid #f97316",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      fontSize: "0.85rem",
                    }}
                  >
                    <strong style={{ color: "#c2410c" }}>
                      Development mode — reset token:
                    </strong>
                    <code
                      style={{
                        display: "block",
                        marginTop: "8px",
                        wordBreak: "break-all",
                        background: "#fff",
                        padding: "8px",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                      }}
                    >
                      {devToken}
                    </code>
                    <p style={{ marginTop: "8px", color: "#9a3412" }}>
                      Copy this token and paste it on the reset page. In
                      production this would be sent by email.
                    </p>
                  </div>
                )}

                <Link
                  to="/reset-password"
                  style={{
                    display: "block",
                    textAlign: "center",
                    marginBottom: "12px",
                    fontWeight: 600,
                  }}
                >
                  Go to Reset Password
                </Link>
              </div>
            ) : (
              <form className="form-grid" onSubmit={handleSubmit}>
                <div className="field-wrap">
                  <label htmlFor="fp-email">Email Address</label>
                  <input
                    id="fp-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
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
                  {status === "loading" ? "Sending…" : "Send Reset Token"}
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
              <span style={{ color: "var(--muted)" }}>
                Remember your password?{" "}
              </span>
              <Link to="/" style={{ fontWeight: 600 }}>
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
