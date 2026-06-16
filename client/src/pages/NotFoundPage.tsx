import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="centered-page">
      <div className="auth-card">
        <h1>Page Not Found</h1>
        <p>The page you requested does not exist.</p>
        <Link className="primary-btn inline-btn" to="/">
          Go Home
        </Link>
      </div>
    </div>
  );
}
