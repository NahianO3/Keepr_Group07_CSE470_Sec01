import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import KeeprLogo from "../components/KeeprLogo";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] =
    useState({
      full_name: "",
      email: "",
      password: "",
      phone: "",
      address: "",
      role: "customer",
    });

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const updateField = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const submit = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    if (
      !form.full_name ||
      !form.email ||
      !form.password
    ) {
      setError(
        "Please complete the required fields."
      );

      return;
    }

    try {
      setLoading(true);

      await register(form);

      navigate("/login", {
        state: {
          registered: true,
        },
      });
    } catch (err) {
      setError(
        err.response?.data
          ?.message ||
          "Unable to create account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel register-panel">
        <div className="auth-brand">
          <KeeprLogo width={150} />
        </div>

        <div className="auth-content">
          <span className="eyebrow">
            GET STARTED
          </span>

          <h1>
            Create your Keepr account.
          </h1>

          <p>
            Start managing your maintenance
            in one simple place.
          </p>

          <form
            onSubmit={submit}
            className="auth-form register-form"
          >
            <div className="two-column">
              <div>
                <label>
                  Full name
                </label>

                <input
                  name="full_name"
                  placeholder="Your name"
                  value={form.full_name}
                  onChange={
                    updateField
                  }
                  autoComplete="name"
                />
              </div>

              <div>
                <label>
                  Phone
                </label>

                <input
                  name="phone"
                  placeholder="01XXXXXXXXX"
                  value={form.phone}
                  onChange={
                    updateField
                  }
                  autoComplete="tel"
                />
              </div>
            </div>

            <label>
              Email
            </label>

            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={
                updateField
              }
              autoComplete="email"
            />

            <label>
              Password
            </label>

            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={form.password}
              onChange={
                updateField
              }
              autoComplete="new-password"
            />

            <label>
              Address
            </label>

            <textarea
              name="address"
              placeholder="Your address"
              value={form.address}
              onChange={
                updateField
              }
              rows="3"
            />

            <label>
              Account type
            </label>

            <select
              name="role"
              value={form.role}
              onChange={
                updateField
              }
            >
              <option value="customer">
                Customer
              </option>

              <option value="service_provider">
                Service Provider
              </option>
            </select>

            <p className="form-note">
              Administrator accounts are managed
              by the system and cannot be created
              through public registration.
            </p>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Creating..."
                : "Create account"}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{" "}
            <Link to="/login">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="auth-visual register-visual">
        <div className="visual-overlay">
          <span>
            KEEP IT TOGETHER.
          </span>

          <h2>
            Your maintenance deserves
            a better home.
          </h2>

          <p>
            Track what matters and never
            lose your service history.
          </p>
        </div>
      </div>
    </div>
  );
}