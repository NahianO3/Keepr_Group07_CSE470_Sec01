import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import KeeprLogo from "../components/KeeprLogo";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const loggedInUser = await login(
        email,
        password
      );

      if (loggedInUser.role === "admin") {
        navigate("/admin");
      } else if (
        loggedInUser.role === "service_provider"
      ) {
        navigate("/provider");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to log in."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* LEFT SIDE */}

      <div className="auth-panel">

        <div className="auth-brand">
          <KeeprLogo width={150} />
        </div>

        <div className="auth-content">

          <span className="eyebrow">
            WELCOME BACK
          </span>

          <h1>
            Manage everything you own.
          </h1>

          <p>
            Keep your appliances, maintenance schedules
            and service history organized in one secure place.
          </p>

          <form
            onSubmit={submit}
            className="auth-form"
          >

            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
            />

            <div className="password-label-row">

              <label htmlFor="password">
                Password
              </label>

              <Link to="/forgot-password">
                Forgot password?
              </Link>

            </div>

            <div className="password-input">

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="current-password"
              />

              <button
                type="button"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                onClick={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>

            </div>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign in"}
            </button>

          </form>

          <p className="auth-footer">
            Don't have an account?{" "}
            <Link to="/register">
              Create one
            </Link>
          </p>

        </div>
      </div>

      {/* RIGHT SIDE */}

      <div className="auth-visual">

        <div className="visual-decoration visual-decoration-one" />

        <div className="visual-decoration visual-decoration-two" />

        <div className="visual-overlay">

          <span>
            YOUR MAINTENANCE, ORGANIZED.
          </span>

          <h2>
            Stay ahead of every repair,
            reminder and service.
          </h2>

          <p>
            Keepr gives your everyday maintenance
            a simple, trustworthy home.
          </p>

        </div>

      </div>
    </div>
  );
}