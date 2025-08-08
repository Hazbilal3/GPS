import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

async function loginUser(credentials: Record<string, any>): Promise<{
  token: string | null; roleFromApi: number | null;
}> {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Backend expects: email OR driverId (number), password, userRole (1 admin / 2 driver)
    const userRole = role === "admin" ? 1 : 2;
    const payload: Record<string, any> = { password, userRole };

    if (role === "admin") {
      payload.email = email;
    } else {
      // backend expects number
      const idNum = Number(driverId);
      if (Number.isNaN(idNum)) {
        setSubmitting(false);
        setError("Driver ID must be a number.");
        return;
      }
      payload.driverId = idNum;
    }

    const { token, roleFromApi } = await loginUser(payload);
    setSubmitting(false);

    if (!token) {
      setError("Invalid credentials. Please try again.");
      return;
    }

    // Save token + roles (both string + numeric for convenience)
    localStorage.setItem("token", token);
    localStorage.setItem("role", role); // "admin" | "driver"
    if (roleFromApi !== null) localStorage.setItem("roleNum", String(roleFromApi));

    // Redirect
    if (role === "admin") {
      navigate("/dashboard");
    } else {
      navigate("/upload");
    }
  };

  return (
<div className="auth-page">
    <div className="auth-card">
      <h2 className="text-center fw-bold mb-4">Login Form</h2>

      {/* Role toggle */}
      <div className="d-flex gap-2 mb-3 role-toggle">
        <button
          type="button"
          className={`btn w-100 ${role === "admin" ? "btn-primary" : "btn-outline-secondary"}`}
          onClick={() => setRole("admin")}
        >
          Admin
        </button>
        <button
          type="button"
          className={`btn w-100 ${role === "driver" ? "btn-primary" : "btn-outline-secondary"}`}
          onClick={() => setRole("driver")}
        >
          Driver
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {role === "admin" ? (
          <input
            type="email"
            className="form-control mb-3"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        ) : (
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Driver ID (number)"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            required
          />
        )}

        {/* Password with eye icon */}
        <div className="position-relative mb-2">
          <input
            type={showPassword ? "text" : "password"}
            className="form-control"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((s) => !s)}
            className="btn btn-link position-absolute top-50 translate-middle-y end-0 pe-3"
            style={{ textDecoration: "none" }}
          >
            {showPassword ? <i className="fa-solid fa-eye"></i> : <i className="fa-solid fa-eye-slash"></i>}
          </button>
        </div>

        <div className="mb-3 text-end">
          <a href="#" className="text-decoration-none">Forgot password?</a>
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <button
          type="submit"
          className="btn btn-primary w-100 mb-3"
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
