import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

async function registerUser(payload: Record<string, any>): Promise<boolean> {
  try {
    const baseUrl = "http://localhost:3000/";
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
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [driverId, setDriverId] = useState(""); // number string, will parse
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

    const userRole = role === "admin" ? 1 : 2;

    // Backend DTO wants driverId:number always. We’ll send 0 for admin.
    let driverIdNum = 0;
    if (role === "driver") {
      driverIdNum = Number(driverId);
      if (Number.isNaN(driverIdNum)) {
        setError("Driver ID must be a number.");
        return;
      }
    }

    setSubmitting(true);
    const payload = {
      driverId: driverIdNum,
      firstname,
      lastname,
      email,
      password,
      userRole,
    };

    const ok = await registerUser(payload);
    setSubmitting(false);

    if (ok) {
      navigate("/"); // go back to login
    } else {
      setError("Registration failed. Please try again.");
    }
  };

  return (
 <div className="auth-page">
    <div className="auth-card">
      <h2 className="text-center fw-bold mb-4">Sign Up</h2>

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

      <form onSubmit={handleRegister} noValidate>
        {role === "driver" && (
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Driver ID (number)"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            required
          />
        )}

        <input
          type="text"
          className="form-control mb-3"
          placeholder="First name"
          value={firstname}
          onChange={(e) => setFirstname(e.target.value)}
          required
        />

        <input
          type="text"
          className="form-control mb-3"
          placeholder="Last name"
          value={lastname}
          onChange={(e) => setLastname(e.target.value)}
          required
        />

        <input
          type="email"
          className="form-control mb-3"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
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

        {/* Confirm password */}
        <div className="position-relative mb-3">
          <input
            type={showConfirmPassword ? "text" : "password"}
            className="form-control"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
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

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <button
          type="submit"
          className="btn btn-primary w-100 mb-3"
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
