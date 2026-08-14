import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState(
    searchParams.get("token") || ""
  );

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!token || !password) {
      setError("Token and password are required.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/password-reset/confirm",
        {
          token,
          password,
        }
      );

      setMessage(response.data.message);

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="simple-auth-page">
      <div className="simple-auth-card">
        <span className="eyebrow">NEW PASSWORD</span>
        <h1>Set a new password.</h1>

        <p>
          Enter the reset token and choose your new password.
        </p>

        <form onSubmit={submit} className="auth-form">
          <label>Reset token</label>

          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your reset token"
          />

          <label>New password</label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your new password"
          />

          {error && <div className="form-error">{error}</div>}

          {message && (
            <div className="form-success">
              {message}
            </div>
          )}

          <button
            className="primary-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Updating..." : "Reset password"}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">Return to login</Link>
        </p>
      </div>
    </div>
  );
}