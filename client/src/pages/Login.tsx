import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

async function loginUser(
  credentials: Record<string, any>
): Promise<{ token: string | null; roleFromApi: number | null }> {
  try {
    const baseUrl = "http://localhost:3000/";
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
    if (roleFromApi !== null)
      localStorage.setItem("roleNum", String(roleFromApi));
    navigate(role === "admin" ? "/dashboard" : "/upload");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="text-center fw-bold mb-4">Login Form</h2>

        <div className="d-flex gap-2 mb-3 role-toggle">
          <button
            type="button"
            className={`btn w-100 ${
              role === "admin" ? "btn-primary" : "btn-outline-secondary"
            }`}
            onClick={() => setRole("admin")}
          >
            Admin
          </button>
          <button
            type="button"
            className={`btn w-100 ${
              role === "driver" ? "btn-primary" : "btn-outline-secondary"
            }`}
            onClick={() => setRole("driver")}
          >
            Driver
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {role === "admin" ? (
            <>
              <input
                type="email"
                className={`form-control mb-1 ${
                  fieldErrors.email ? "is-invalid" : ""
                }`}
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {fieldErrors.email && (
                <div className="text-danger small mb-2">
                  {fieldErrors.email}
                </div>
              )}
            </>
          ) : (
            <>
              <input
                type="text"
                className={`form-control mb-1 ${
                  fieldErrors.driverId ? "is-invalid" : ""
                }`}
                placeholder="Driver ID (number)"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
              />
              {fieldErrors.driverId && (
                <div className="text-danger small mb-2">
                  {fieldErrors.driverId}
                </div>
              )}
            </>
          )}

          <div className="position-relative mb-1">
            <input
              type={showPassword ? "text" : "password"}
              className={`form-control ${
                fieldErrors.password ? "is-invalid" : ""
              }`}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="btn btn-link position-absolute top-50 translate-middle-y end-0 pe-3"
              style={{ textDecoration: "none" }}
            >
              {showPassword ? (
                <i className="fa-solid fa-eye"></i>
              ) : (
                <i className="fa-solid fa-eye-slash"></i>
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <div className="text-danger small mb-2">{fieldErrors.password}</div>
          )}

          <div className="mb-3 text-end">
            <a href="#" className="text-decoration-none">
              Forgot password?
            </a>
          </div>

          {error && <div className="alert alert-danger py-2">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary w-100 mb-3"
            disabled={submitting}
          >
            {submitting ? "Logging in..." : "Login"}
          </button>

          <p className="text-center mb-0">
            Not a member? <Link to="/register">Signup now</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
