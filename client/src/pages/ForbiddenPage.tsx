import { Link } from "react-router-dom";

export function ForbiddenPage() {
  return (
    <div className="centered-page">
      <div className="auth-card">
        <h1>Access Denied</h1>
        <p>You do not have permission to access this page.</p>
        <Link className="primary-btn inline-btn" to="/login">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
