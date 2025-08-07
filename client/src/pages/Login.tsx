import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/** Inline API call (feel free to move to services/authService.ts later) */
async function loginUser(
  role: "admin" | "driver",
  credentials: Record<string, string>
): Promise<string | null> {
  try {
    const baseUrl = 'http://localhost:3000/'
    const res = await fetch( `${baseUrl}auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) return null;
    const data = await res.json();
    console.log(data)
    return data?.ac ?? null;
  } catch {
    return null;
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

  // Build payload safely so no undefined values exist
  let payload: Record<string, string> = { password };
  if (role === "admin") {
    payload.email = email;
  } else {
    payload.driverId = driverId;
  }

  const token = await loginUser(role, payload);
  setSubmitting(false);

//   if (!token) {
//     setError("Invalid credentials. Please try again.");
//     return;
//   }

//   localStorage.setItem("token", token);
  localStorage.setItem("role", role);

  if (role === "admin") {
    navigate("/dashboard");
  } else {
    navigate("/upload");
  }
};


  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100"
         style={{ background: "linear-gradient(135deg, #0052D4, #4364F7, #6FB1FC)" }}>
      <div className="bg-white p-4 p-md-5 rounded-4 shadow" style={{ width: "100%", maxWidth: 380 }}>
        <h2 className="text-center fw-bold mb-4">Login Form</h2>

        {/* Role toggle */}
        <div className="d-flex gap-2 mb-3">
          <button
            type="button"
            className={`btn w-100 ${role === "admin" ? "btn-primary" : "btn-outline-secondary"}`}
            style={{ borderRadius: 24 }}
            onClick={() => setRole("admin")}
            // value={1}
          >
            Admin
          </button>
          <button
            type="button"
            className={`btn w-100 ${role === "driver" ? "btn-primary" : "btn-outline-secondary"}`}
            style={{ borderRadius: 24 }}
            onClick={() => setRole("driver")}
            // value={2}
          >
            Driver
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Admin: email, Driver: driverId */}
          {role === "admin" ? (
            <input
              type="email"
              className="form-control mb-3"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ borderRadius: 12, padding: "0.75rem 1rem" }}
            />
          ) : (
            <input
              type="text"
              className="form-control mb-3"
              placeholder="Driver ID"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              required
              style={{ borderRadius: 12, padding: "0.75rem 1rem" }}
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
              style={{ borderRadius: 12, padding: "0.75rem 2.75rem 0.75rem 1rem" }}
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

          {/* Forgot password (login only) */}
          <div className="mb-3 text-end">
            <a href="#" className="text-decoration-none">Forgot password?</a>
          </div>

          {error && (
            <div className="alert alert-danger py-2" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-100 mb-3"
            style={{ borderRadius: 12, padding: "0.75rem 1rem" }}
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
