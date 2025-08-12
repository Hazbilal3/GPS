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
  const [driverId, setDriverId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (role === "driver") {
      if (!driverId.trim()) errors.driverId = "Driver ID is required.";
      else if (isNaN(Number(driverId)))
        errors.driverId = "Driver ID must be a number.";
    }
    if (!firstname.trim()) errors.firstname = "First name is required.";
    if (!lastname.trim()) errors.lastname = "Last name is required.";
    if (!email.trim()) errors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email))
      errors.email = "Invalid email format.";
    if (!password.trim()) errors.password = "Password is required.";
    if (!confirmPassword.trim())
      errors.confirmPassword = "Confirm password is required.";
    else if (password !== confirmPassword)
      errors.confirmPassword = "Passwords do not match.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) return;

    const userRole = role === "admin" ? 1 : 2;
    let driverIdNum = role === "driver" ? Number(driverId) : 0;

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

    if (ok) navigate("/");
    else setError("Registration failed. Please try again.");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="text-center fw-bold mb-4">Sign Up</h2>

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

        <form onSubmit={handleRegister} noValidate>
          {role === "driver" && (
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

          <input
            type="text"
            className={`form-control mb-1 ${
              fieldErrors.firstname ? "is-invalid" : ""
            }`}
            placeholder="First name"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
          />
          {fieldErrors.firstname && (
            <div className="text-danger small mb-2">
              {fieldErrors.firstname}
            </div>
          )}

          <input
            type="text"
            className={`form-control mb-1 ${
              fieldErrors.lastname ? "is-invalid" : ""
            }`}
            placeholder="Last name"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
          />
          {fieldErrors.lastname && (
            <div className="text-danger small mb-2">{fieldErrors.lastname}</div>
          )}

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
            <div className="text-danger small mb-2">{fieldErrors.email}</div>
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

          <div className="position-relative mb-1">
            <input
              type={showConfirmPassword ? "text" : "password"}
              className={`form-control ${
                fieldErrors.confirmPassword ? "is-invalid" : ""
              }`}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((s) => !s)}
              className="btn btn-link position-absolute top-50 translate-middle-y end-0 pe-3"
              style={{ textDecoration: "none" }}
            >
              {showConfirmPassword ? (
                <i className="fa-solid fa-eye"></i>
              ) : (
                <i className="fa-solid fa-eye-slash"></i>
              )}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <div className="text-danger small mb-2">
              {fieldErrors.confirmPassword}
            </div>
          )}

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
