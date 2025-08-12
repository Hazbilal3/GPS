import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import cmjlLogo from "../assets/pics/bg-logo.png";
import cornerArt from "../assets/pics/Signup-img.png";

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

  const [driverId, setDriverId] = useState("");
  const [fullName, setFullName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (role === "admin") {
      if (!firstname.trim()) errs.firstname = "First name is required.";
      if (!lastname.trim()) errs.lastname = "Last name is required.";
    } else {
      if (!driverId.trim()) errs.driverId = "Driver ID is required.";
      else if (isNaN(Number(driverId)))
        errs.driverId = "Driver ID must be a number.";
      if (!fullName.trim()) errs.fullName = "Full name is required.";
    }

    if (!email.trim()) errs.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Invalid email format.";

    if (!password.trim()) errs.password = "Password is required.";

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) return;

    setSubmitting(true);

    let payload: Record<string, any>;

    if (role === "admin") {
      payload = {
        driverId: 0,
        firstname,
        lastname,
        email,
        password,
        userRole: 1,
      };
    } else {
      const parts = fullName.trim().split(/\s+/);
      const first = parts.shift() || "";
      const last = parts.join(" ") || "-";

      payload = {
        driverId: Number(driverId),
        firstname: first,
        lastname: last,
        email,
        password,
        userRole: 2,
      };
    }

    const ok = await registerUser(payload);
    setSubmitting(false);

    if (ok) navigate("/");
    else setError("Registration failed. Please try again.");
  };

  return (
    <div
      className="auth-onepage"
      style={{
        background: "radial-gradient(circle, #f4faff 10%, #ffffff 80%)",
      }}
    >
      <img src={cornerArt} alt="" className="corner-illus d-none d-md-block " />
      <div className="auth-stack auth-stack--wide">
        <img src={cmjlLogo} className="stack-logo" alt="CMJL" />
        <h1 className="stack-title">Create an account</h1>

        <div className="role-switch mb-5" role="group" aria-label="Select role">
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

        <form onSubmit={handleRegister} className="stack-form" noValidate>
          <div className="grid-2">
            {role === "admin" ? (
              <>
                <div>
                  <label className="form-label">First name</label>
                  <input
                    type="text"
                    className={`form-control ${
                      fieldErrors.firstname ? "is-invalid" : ""
                    }`}
                    placeholder="Enter your First Name"
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                  />
                  {fieldErrors.firstname && (
                    <div className="text-danger small">
                      {fieldErrors.firstname}
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label">Last name</label>
                  <input
                    type="text"
                    className={`form-control ${
                      fieldErrors.lastname ? "is-invalid" : ""
                    }`}
                    placeholder="Enter Your Last Name"
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                  />
                  {fieldErrors.lastname && (
                    <div className="text-danger small">
                      {fieldErrors.lastname}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
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
                    <div className="text-danger small">
                      {fieldErrors.driverId}
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label">Full name</label>
                  <input
                    type="text"
                    className={`form-control ${
                      fieldErrors.fullName ? "is-invalid" : ""
                    }`}
                    placeholder="Enter your Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  {fieldErrors.fullName && (
                    <div className="text-danger small">
                      {fieldErrors.fullName}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="grid-2">
            <div>
              <label className="form-label">Email address</label>
              <input
                type="email"
                className={`form-control ${
                  fieldErrors.email ? "is-invalid" : ""
                }`}
                placeholder="Enter your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {fieldErrors.email && (
                <div className="text-danger small">{fieldErrors.email}</div>
              )}
            </div>

            <div>
              <label className="form-label">Password</label>
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
            </div>
          </div>

          {error && <div className="alert alert-danger py-2 mt-2">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary w-100 mt-3"
            disabled={submitting}
          >
            {submitting ? "Signing up..." : "Sign Up"}
          </button>

          <p className="text-center mb-0 mt-3">
            Already signed up? <Link to="/">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
