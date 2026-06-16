import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  resendVerificationCode,
  setUserVerified,
  verifyEmailAccount,
} from "../store/slices/authSlice";

export function VerifyEmailPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state: any) => state.auth.user);

  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "resending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  // Already verified — send to the right dashboard
  if (user?.isVerified === "true") {
    const role = user.role?.toLowerCase();
    if (role === "admin") return <Navigate to="/admin" replace />;
    if (role === "company") return <Navigate to="/portal/jobs" replace />;
    return <Navigate to="/user/dashboard" replace />;
  }

  // Not logged in
  if (!user) return <Navigate to="/" replace />;

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (code.trim().length !== 6) {
      setStatus("error");
      setMessage("Please enter the 6-digit code");
      return;
    }

    setStatus("loading");
    setMessage("");

    const result = await dispatch(verifyEmailAccount(code.trim()));

    if (verifyEmailAccount.fulfilled.match(result)) {
      dispatch(setUserVerified());
      setStatus("success");
      setMessage("Email verified! Redirecting…");
      setTimeout(() => {
        const role = user.role?.toLowerCase();
        if (role === "admin") navigate("/admin");
        else if (role === "company") navigate("/portal/jobs");
        else navigate("/user/dashboard");
      }, 1500);
    } else {
      setStatus("error");
      setMessage((result.payload as string) ?? "Invalid code. Please try again.");
    }
  };

  const handleResend = async () => {
    setStatus("resending");
    setMessage("");
    const result = await dispatch(resendVerificationCode());
    if (resendVerificationCode.fulfilled.match(result)) {
      setStatus("idle");
      setMessage("A new code has been sent to your email.");
    } else {
      setStatus("error");
      setMessage((result.payload as string) ?? "Failed to resend. Please try again.");
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
            {/* Icon */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <span style={{ fontSize: "48px" }}>📧</span>
            </div>

            <div className="form-header">
              <h1>Verify your email</h1>
              <p>
                We sent a 6-digit code to{" "}
                <strong>{user.email}</strong>. Enter it below to activate your
                account.
              </p>
            </div>

            {status === "success" ? (
              <div
                style={{
                  padding: "14px 16px",
                  background: "#ecfdf5",
                  border: "1px solid #10b981",
                  borderRadius: "8px",
                  color: "#065f46",
                  fontSize: "0.9rem",
                  textAlign: "center",
                }}
              >
                ✅ {message}
              </div>
            ) : (
              <>
                <form className="form-grid" onSubmit={handleVerify}>
                  <div className="field-wrap">
                    <label htmlFor="otp-code">Verification Code</label>
                    <input
                      id="otp-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="123456"
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      style={{
                        textAlign: "center",
                        fontSize: "1.6rem",
                        letterSpacing: "0.4em",
                        fontWeight: "bold",
                      }}
                      required
                    />
                  </div>

                  {status === "error" && (
                    <div style={{ color: "var(--danger)", fontSize: "0.85rem" }}>
                      {message}
                    </div>
                  )}

                  {status === "idle" && message && (
                    <div style={{ color: "#16a34a", fontSize: "0.85rem" }}>
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={status === "loading" || status === "resending"}
                  >
                    {status === "loading" ? "Verifying…" : "Verify Email"}
                  </button>
                </form>

                <div style={{ textAlign: "center", marginTop: "16px", fontSize: "0.9rem" }}>
                  <span style={{ color: "var(--muted)" }}>
                    Didn't receive the code?{" "}
                  </span>
                  <button
                    onClick={handleResend}
                    disabled={status === "resending" || status === "loading"}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--primary)",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      padding: 0,
                    }}
                  >
                    {status === "resending" ? "Sending…" : "Resend code"}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
