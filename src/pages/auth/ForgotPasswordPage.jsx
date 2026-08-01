import { useState } from "react";
import { Link } from "react-router-dom";
import "./auth.css";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="auth-page">
      <h2 className="auth-page__title">Reset your password</h2>

      {submitted ? (
        <p className="auth-page__hint">
          If an account exists for <strong>{email}</strong>, a password reset
          link has been sent.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="auth-page__form">
          <p className="auth-page__hint">
            Enter your email and we'll send you a link to reset your password.
          </p>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-page__input"
          />
          <button type="submit" disabled={loading} className="auth-page__submit-btn">
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      )}

      <p className="auth-page__footer-text">
        <Link to="/login">Back to login</Link>
      </p>
    </div>
  );
}

export default ForgotPasswordPage;