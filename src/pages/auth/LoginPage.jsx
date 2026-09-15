import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Home } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./split-auth.css";

const HERO_IMAGE = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const pendingWishlistId = location.state?.pendingWishlistId;
  const redirectTo = pendingWishlistId
    ? `/property/${pendingWishlistId}`
    : location.state?.from || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password, pendingWishlistId);
      navigate(redirectTo, { replace: true });
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

          <h1 className="split-auth__title">Sign in</h1>

          <form onSubmit={handleSubmit} className="split-auth__form">
            <div>
              <label className="split-auth__label">
                Email Address <span className="required">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="split-auth__input"
              />
            </div>

            <div>
              <label className="split-auth__label">
                Password <span className="required">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="split-auth__input"
              />
            </div>

            {error && <p className="split-auth__error">{error}</p>}

            <button type="submit" disabled={loading} className="split-auth__submit-btn">
              {loading ? "Signing in..." : "Continue"}
            </button>
          </form>

          <p className="split-auth__footer-text">
            New to Fandahom?{" "}
            <Link to="/register" state={{ pendingWishlistId }}>Create account</Link>
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

          <p className="split-auth__footer-text">
            <Link to="/forgot-password">Forgot password?</Link>
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

export default LoginPage;