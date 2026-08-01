import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import TermsModal from "../../components/common/TermsModal";
import "./auth.css";

function RegisterPage() {
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!agreedToTerms) {
      setError("You must agree to the Terms & Conditions to continue");
      return;
    }

    setLoading(true);
    try {
      await register({ name, companyName, email, password });
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <h2 className="auth-page__title">Create your Fandahom account</h2>

      <form onSubmit={handleSubmit} className="auth-page__form">
        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="auth-page__input"
        />
        <input
          type="text"
          placeholder="Registration name (company)"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
          className="auth-page__input"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="auth-page__input"
        />
        <input
          type="password"
          placeholder="Password (min. 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="auth-page__input"
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="auth-page__input"
        />

        <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            style={{ marginTop: "0.2rem" }}
          />
          <span>
            I agree to the{" "}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              style={{ background: "none", border: "none", padding: 0, color: "var(--color-primary)", cursor: "pointer", textDecoration: "underline", fontSize: "inherit" }}
            >
              Terms & Conditions
            </button>{" "}
            and Privacy Policy
          </span>
        </label>

        {error && <p className="auth-page__error">{error}</p>}

        <button type="submit" disabled={loading} className="auth-page__submit-btn">
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="auth-page__footer-text">
        Already have an account? <Link to="/login">Log in</Link>
      </p>

      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </div>
  );
}

export default RegisterPage;