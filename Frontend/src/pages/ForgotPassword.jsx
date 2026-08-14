import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setToken("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/password-reset/request",
        { email }
      );

      setMessage(response.data.message);

      if (response.data?.data?.token) {
        setToken(response.data.data.token);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to request password reset."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="simple-auth-page">
      <div className="simple-auth-card">
        <Link to="/login" className="back-link">
          ← Back to login
        </Link>

        <span className="eyebrow">PASSWORD RECOVERY</span>
        <h1>Forgot your password?</h1>

        <p>
          Enter your email and we'll generate a reset token.
        </p>

        <form onSubmit={submit} className="auth-form">
          <label>Email</label>

          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {error && <div className="form-error">{error}</div>}

          {message && (
            <div className="form-success">
              {message}
            </div>
          )}

          {token && (
            <div className="dev-token">
              <strong>Development reset token</strong>
              <code>{token}</code>

              <Link to={`/reset-password?token=${token}`}>
                Continue to reset password →
              </Link>
            </div>
          )}

          <button
            className="primary-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate reset token"}
          </button>
        </form>
      </div>
    </div>
  );
}