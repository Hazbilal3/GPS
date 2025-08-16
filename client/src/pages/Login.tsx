import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import cmjlLogo from "../assets/pics/bg-logo.png";
import illoLeft from "../assets/pics/left-login-img.png";
import illoRight from "../assets/pics/right-login-img.png";

async function loginUser(
  credentials: Record<string, any>
): Promise<{ token: string | null; roleFromApi: number | null }> {
  try {
    const baseUrl = "http://localhost:3006/";
    const res = await fetch(`${baseUrl}auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!res.ok) return { token: null, roleFromApi: null };
    const data = await res.json();
    return {
      token: data?.accessToken ?? null,
      roleFromApi: data?.user?.role ?? null,
    };
  } catch {
    return { token: null, roleFromApi: null };
  }
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<"admin" | "driver">("admin");
  const [email, setEmail] = useState("");
  const [driverId, setDriverId] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (role === "admin") {
      if (!email.trim()) errors.email = "Email is required.";
      else if (!/\S+@\S+\.\S+/.test(email))
        errors.email = "Invalid email format.";
    } else {
      if (!driverId.trim()) errors.driverId = "Driver ID is required.";
      else if (isNaN(Number(driverId)))
        errors.driverId = "Driver ID must be a number.";
    }
    if (!password.trim()) errors.password = "Password is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) return;
    setSubmitting(true);
    const userRole = role === "admin" ? 1 : 2;
    const payload: Record<string, any> = { password, userRole };
    if (role === "admin") payload.email = email;
    else payload.driverId = Number(driverId);
    const { token, roleFromApi } = await loginUser(payload);
    setSubmitting(false);
    if (!token) {
      setError("Invalid credentials. Please try again.");
      return;
    }
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("driverId", driverId);
    if (roleFromApi !== null)
      localStorage.setItem("roleNum", String(roleFromApi));
    navigate(role === "admin" ? "/dashboard" : "/upload");
  };

  return (
    <div className="auth-onepage">
      <img src={illoLeft} alt="" className="bg-illus bg-illus--left" />
      <img src={illoRight} alt="" className="bg-illus bg-illus--right" />

      <div className="auth-stack">
        <img src={cmjlLogo} className="stack-logo" alt="CMJL" />
        <h1 className="stack-title">Welcome back</h1>

        <div className="role-switch" role="group" aria-label="Select role">
          <span className={`switch-label ${role === "admin" ? "active" : ""}`}>
            Admin
          </span>
          <label className="switch">
            <input
              type="checkbox"
              checked={role === "driver"}
              onChange={(e) => setRole(e.target.checked ? "driver" : "admin")}
              aria-label="Toggle role"
            />
            <span className="slider" />
          </label>
          <span className={`switch-label ${role === "driver" ? "active" : ""}`}>
            Driver
          </span>
        </div>

        <form onSubmit={handleSubmit} className="stack-form" noValidate>
          {role === "admin" ? (
            <>
              <label className="form-label">Email address</label>
              <input
                type="email"
                className={`form-control ${
                  fieldErrors.email ? "is-invalid" : ""
                }`}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {fieldErrors.email && (
                <div className="text-danger small">{fieldErrors.email}</div>
              )}
            </>
          ) : (
            <>
              <label className="form-label">Driver ID</label>
              <input
                type="text"
                className={`form-control ${
                  fieldErrors.driverId ? "is-invalid" : ""
                }`}
                placeholder="Enter your Driver ID"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
              />
              {fieldErrors.driverId && (
                <div className="text-danger small">{fieldErrors.driverId}</div>
              )}
            </>
          )}

          <label className="form-label mt-2">Password</label>
          <div className="position-relative">
            <input
              type={showPassword ? "text" : "password"}
              className={`form-control ${
                fieldErrors.password ? "is-invalid" : ""
              }`}
              placeholder="Enter the Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-link eye-btn"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <i className="fa-solid fa-eye"></i>
              ) : (
                <i className="fa-solid fa-eye-slash"></i>
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <div className="text-danger small">{fieldErrors.password}</div>
          )}

          <div className="mt-2 mb-3 text-end">
            <a href="#" className="text-decoration-none">
              Forgot password?
            </a>
          </div>

          {error && <div className="alert alert-danger py-2">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={submitting}
          >
            {submitting ? "Logging in..." : "Login"}
          </button>

          <p className="text-center mb-0 mt-3">
            Not a member? <Link to="/register">Signup now</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
