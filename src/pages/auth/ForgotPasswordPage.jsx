import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import PasswordInput from "../../components/common/PasswordInput";
import { requestPasswordReset, confirmPasswordReset } from "../../services/authApi";
import { USING_MOCK_API } from "../../config";
import "./split-auth.css";

const HERO_IMAGE = "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200";

// Same password rule as registration (from the API doc).
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

function ForgotPasswordPage() {
  // Password reset has two steps (per the API doc):
  //   1. "email" — enter your email; the backend emails a 6-digit code
  //   2. "reset" — enter the code + a new password
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const sendCode = async ({ isResend }) => {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      // The backend always answers 200, whether or not the email has an
      // account, so we never reveal which emails are registered.
      await requestPasswordReset(email.trim());
      if (isResend) setInfo("If an account exists, a new code has been sent.");
      else setStep("reset");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = (e) => {
    e.preventDefault();
    sendCode({ isResend: false });
  };

  const handleReset = async (e) => {
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

    setLoading(true);
    try {
      await confirmPasswordReset({
        email: email.trim(),
        code: code.trim(),
        password,
        passwordConfirmation: confirmPassword,
      });
      // The reset doesn't log anyone in; send them to sign in.
      navigate("/login", {
        replace: true,
        state: {
          email: email.trim(),
          notice: "Password updated! Sign in with your new password.",
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const linkButtonStyle = {
    background: "none",
    border: "none",
    padding: 0,
    color: "var(--color-primary)",
    cursor: "pointer",
    fontSize: "inherit",
    textDecoration: "underline",
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

          <h1 className="split-auth__title">Reset your password</h1>

          {step === "email" ? (
            <form onSubmit={handleSendCode} className="split-auth__form">
              <p style={hintStyle}>
                Enter your email and we&apos;ll send you a 6-digit code to reset your password.
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
                {loading ? "Sending code..." : "Send reset code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="split-auth__form">
              <p style={hintStyle}>
                If an account exists for <strong>{email}</strong>, we&apos;ve sent a 6-digit code.
                It expires in 15 minutes.
              </p>
              {USING_MOCK_API && (
                <p style={{ ...hintStyle, color: "var(--color-primary)" }}>
                  Demo mode: use the code <strong>123456</strong>.
                </p>
              )}

              <div>
                <label className="split-auth__label">Reset code <span className="required">*</span></label>
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
                <label className="split-auth__label">New password <span className="required">*</span></label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="8+ chars, 1 uppercase, 1 number, 1 symbol"
                />
              </div>

              <div>
                <label className="split-auth__label">Confirm new password <span className="required">*</span></label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              {info && <p style={{ ...hintStyle, color: "#16a34a", margin: 0 }}>{info}</p>}
              {error && <p className="split-auth__error">{error}</p>}

              <button type="submit" disabled={loading} className="split-auth__submit-btn">
                {loading ? "Updating password..." : "Reset password"}
              </button>

              <p style={{ ...hintStyle, margin: 0, textAlign: "center" }}>
                Didn&apos;t get a code?{" "}
                <button
                  type="button"
                  onClick={() => sendCode({ isResend: true })}
                  disabled={loading}
                  style={linkButtonStyle}
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
                  style={linkButtonStyle}
                >
                  Change email
                </button>
              </p>
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
