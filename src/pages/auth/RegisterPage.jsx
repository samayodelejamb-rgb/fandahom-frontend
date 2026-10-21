import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Home } from "lucide-react";
import PasswordInput from "../../components/common/PasswordInput";
import { requestRegistrationCode, verifyRegistration } from "../../services/authApi";
import { USING_MOCK_API } from "../../config";
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

const hintStyle = {
  fontSize: "0.85rem",
  color: "var(--color-text-secondary)",
  margin: "0 0 0.5rem 0",
};

function RegisterPage() {
  // Registration has two steps (per the API doc):
  //   1. "email"   — enter your email; the backend emails a 6-digit code
  //   2. "details" — enter the code + your details; the account is created
  const [step, setStep] = useState("email");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const pendingWishlistId = location.state?.pendingWishlistId;

  // Step 1: ask the backend to email a code.
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await requestRegistrationCode(email.trim());
      setStep("details");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await requestRegistrationCode(email.trim());
      setInfo("A new code has been sent to your email.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: send the code + details. The account is created, but no
  // session starts, so we send the user to the login page.
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit code from your email");
      return;
    }
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
      await verifyRegistration({
        email: email.trim(),
        code: code.trim(),
        firstname,
        lastname,
        password,
        passwordConfirmation: confirmPassword,
      });
      navigate("/login", {
        replace: true,
        state: {
          pendingWishlistId,
          email: email.trim(),
          notice: "Account created! Sign in to continue.",
        },
      });
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

          {step === "email" ? (
            <form onSubmit={handleSendCode} className="split-auth__form">
              <p style={hintStyle}>
                Enter your email and we&apos;ll send you a 6-digit verification code.
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

              {error && <p className="split-auth__error">{error}</p>}

              <button type="submit" disabled={loading} className="split-auth__submit-btn">
                {loading ? "Sending code..." : "Send verification code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateAccount} className="split-auth__form">
              <p style={hintStyle}>
                We sent a 6-digit code to <strong>{email}</strong>. It expires in 15 minutes.
              </p>
              {USING_MOCK_API && (
                <p style={{ ...hintStyle, color: "var(--color-primary)" }}>
                  Demo mode: use the code <strong>123456</strong>.
                </p>
              )}

              <div>
                <label className="split-auth__label">Verification code <span className="required">*</span></label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  required
                  className="split-auth__input"
                  placeholder="6-digit code"
                />
              </div>

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
                <label className="split-auth__label">Password <span className="required">*</span></label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="8+ chars, 1 uppercase, 1 number, 1 symbol"
                />
              </div>

              <div>
                <label className="split-auth__label">Confirm password <span className="required">*</span></label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
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

              {info && <p style={{ ...hintStyle, color: "#16a34a", margin: 0 }}>{info}</p>}
              {error && <p className="split-auth__error">{error}</p>}

              <button type="submit" disabled={loading} className="split-auth__submit-btn">
                {loading ? "Creating account..." : "Create account"}
              </button>

              <p style={{ ...hintStyle, margin: 0, textAlign: "center" }}>
                Didn&apos;t get a code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  style={{ background: "none", border: "none", padding: 0, color: "var(--color-primary)", cursor: "pointer", fontSize: "inherit", textDecoration: "underline" }}
                >
                  Resend
                </button>
                {" · "}
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setError("");
                    setInfo("");
                    setCode("");
                  }}
                  style={{ background: "none", border: "none", padding: 0, color: "var(--color-primary)", cursor: "pointer", fontSize: "inherit", textDecoration: "underline" }}
                >
                  Change email
                </button>
              </p>
            </form>
          )}

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
