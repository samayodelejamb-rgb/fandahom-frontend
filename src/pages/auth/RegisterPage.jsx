import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Home } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import TermsModal from "../../components/common/TermsModal";
import "./split-auth.css";

const HERO_IMAGE = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200";

// Matches the backend's documented rule: min 8 chars, at least one
// uppercase letter, one number, one symbol.
function isStrongPassword(pw) {
  return (
    pw.length >= 8 &&
    /[A-Z]/.test(pw) &&
    /[0-9]/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
  );
}

function RegisterPage() {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pendingWishlistId = location.state?.pendingWishlistId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isStrongPassword(password)) {
      setError("Password must be at least 8 characters and include an uppercase letter, a number, and a symbol");
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
      await register(
        {
          firstname,
          lastname,
          email,
          password,
          passwordConfirmation: confirmPassword,
        },
        pendingWishlistId
      );
      navigate(pendingWishlistId ? `/property/${pendingWishlistId}` : "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-auth">
      <div className="split-auth__form-side">
        <div className="split-auth__form-wrapper">
          <Link to="/" className="split-auth__logo">
            <span className="split-auth__logo-icon">
              <Home size={18} strokeWidth={2.2} />
            </span>
            Fandahom
          </Link>

          <h1 className="split-auth__title">Create your account</h1>

          <form onSubmit={handleSubmit} className="split-auth__form">
            <div>
              <label className="split-auth__label">First name <span className="required">*</span></label>
              <input
                type="text"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                required
                className="split-auth__input"
              />
            </div>

            <div>
              <label className="split-auth__label">Last name <span className="required">*</span></label>
              <input
                type="text"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                required
                className="split-auth__input"
              />
            </div>

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

            <div>
              <label className="split-auth__label">Password <span className="required">*</span></label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="split-auth__input"
                placeholder="8+ chars, 1 uppercase, 1 number, 1 symbol"
              />
            </div>

            <div>
              <label className="split-auth__label">Confirm password <span className="required">*</span></label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="split-auth__input"
              />
            </div>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
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

            {error && <p className="split-auth__error">{error}</p>}

            <button type="submit" disabled={loading} className="split-auth__submit-btn">
              {loading ? "Creating account..." : "Continue"}
            </button>
          </form>

          <p className="split-auth__footer-text">
            Already have an account? <Link to="/login" state={{ pendingWishlistId }}>Sign in</Link>
          </p>

          <div className="split-auth__divider">OR</div>

          <button type="button" className="split-auth__social-btn" disabled title="Coming soon">
            Continue with Google
          </button>
          <button type="button" className="split-auth__social-btn" disabled title="Coming soon">
            Continue with Apple
          </button>
          <button type="button" className="split-auth__social-btn" disabled title="Coming soon">
            Continue with Facebook
          </button>
        </div>
      </div>

      <div
        className="split-auth__image-side"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
      />

      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </div>
  );
}

export default RegisterPage;
