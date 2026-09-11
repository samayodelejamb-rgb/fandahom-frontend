import { useState } from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import "./split-auth.css";

const HERO_IMAGE = "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200";

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
    <div className="split-auth">
      <div className="split-auth__form-side">
        <div className="split-auth__form-wrapper">
          <Link to="/" className="split-auth__logo">
            <Home size={22} strokeWidth={2} />
            Fandahom
          </Link>

          <h1 className="split-auth__title">Reset your password</h1>

          {submitted ? (
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
              If an account exists for <strong>{email}</strong>, a password reset link has been sent.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="split-auth__form">
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", margin: "0 0 0.5rem 0" }}>
                Enter your email and we'll send you a link to reset your password.
              </p>
              <div>
                <label className="split-auth__label">Email Address <span className="required">*</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="split-auth__input"
                />
              </div>
              <button type="submit" disabled={loading} className="split-auth__submit-btn">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}

          <p className="split-auth__footer-text">
            <Link to="/login">Back to login</Link>
          </p>
        </div>
      </div>

      <div
        className="split-auth__image-side"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
      />
    </div>
  );
}

export default ForgotPasswordPage;