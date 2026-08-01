import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./auth.css";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <h2 className="auth-page__title">Log in to Fandahom</h2>

      <form onSubmit={handleSubmit} className="auth-page__form">
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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="auth-page__input"
        />

        {error && <p className="auth-page__error">{error}</p>}

        <button type="submit" disabled={loading} className="auth-page__submit-btn">
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>

      <p className="auth-page__footer-text">
        Don't have an account? <Link to="/register">Create one</Link>
      </p>
      <p className="auth-page__footer-text">
        <Link to="/forgot-password">Forgot password?</Link>
      </p>
    </div>
  );
}

export default LoginPage;