import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/** Inline API call for registration */
async function registerUser(
  role: "admin" | "driver",
  payload: Record<string, string>
): Promise<boolean> {
  try {
        const baseUrl = 'http://localhost:3000/'
    const res = await fetch(`${baseUrl}auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const Register: React.FC = () => {
  const navigate = useNavigate();

  const [role, setRole] = useState<"admin" | "driver">("admin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [driverId, setDriverId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);

  if (password !== confirmPassword) {
    setError("Passwords do not match.");
    return;
  }

  setSubmitting(true);

  // Build payload safely
  let payload: Record<string, string> = {
    name,
    email,
    password,
  };

  if (role === "driver") {
    payload.driverId = driverId;
  }

  const success = await registerUser(role, payload);
  setSubmitting(false);

  if (success) {
    navigate("/");
  } else {
    setError("Registration failed. Try again.");
  }
};


  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100"
      style={{
        background: "linear-gradient(135deg, #0052D4, #4364F7, #6FB1FC)",
      }}
    >
      <div
        className="bg-white p-4 p-md-5 rounded-4 shadow"
        style={{ width: "100%", maxWidth: 380 }}
      >
        <h2 className="text-center fw-bold mb-4">Sign Up</h2>

        {/* Role toggle */}
        <div className="d-flex gap-2 mb-3">
          <button
            type="button"
            className={`btn w-100 ${
              role === "admin" ? "btn-primary" : "btn-outline-secondary"
            }`}
            style={{ borderRadius: 24 }}
            onClick={() => setRole("admin")}
          >
            Admin
          </button>
          <button
            type="button"
            className={`btn w-100 ${
              role === "driver" ? "btn-primary" : "btn-outline-secondary"
            }`}
            style={{ borderRadius: 24 }}
            onClick={() => setRole("driver")}
          >
            Driver
          </button>
        </div>

        <form onSubmit={handleRegister} noValidate>
          {role === "driver" && (
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

          <input
            type="text"
            className="form-control mb-3"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ borderRadius: 12, padding: "0.75rem 1rem" }}
          />

          <input
            type="email"
            className="form-control mb-3"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ borderRadius: 12, padding: "0.75rem 1rem" }}
          />

          {/* Password */}
          <div className="position-relative mb-3">
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                borderRadius: 12,
                padding: "0.75rem 2.75rem 0.75rem 1rem",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="btn btn-link position-absolute top-50 translate-middle-y end-0 pe-3"
              style={{ textDecoration: "none" }}
            >
              {showPassword ? <i className="fa-solid fa-eye"></i> : <i className="fa-solid fa-eye-slash"></i>}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="position-relative mb-3">
            <input
              type={showConfirmPassword ? "text" : "password"}
              className="form-control"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                borderRadius: 12,
                padding: "0.75rem 2.75rem 0.75rem 1rem",
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((s) => !s)}
              className="btn btn-link position-absolute top-50 translate-middle-y end-0 pe-3"
              style={{ textDecoration: "none" }}
            >
              {showConfirmPassword ? <i className="fa-solid fa-eye"></i> : <i className="fa-solid fa-eye-slash"></i>}
            </button>
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
            {submitting ? "Signing up..." : "Sign Up"}
          </button>

          <p className="text-center mb-0">
            Already signed up? <Link to="/">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
