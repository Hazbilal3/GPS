import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import cmjlLogo from "../assets/pics/bg-logo.png";
import cornerArt from "../assets/pics/Signup-img.png";
import { port } from "../port.interface";

async function registerUser(payload: Record<string, any>): Promise<boolean> {
  try {
    const baseUrl = port;
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const digitsOnly = (s: string) => s.replace(/\D/g, "");
const isAllDigits = (s: string) => /^\d+$/.test(s);
const handleDigitKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const allowed = [
    "Backspace",
    "Delete",
    "ArrowLeft",
    "ArrowRight",
    "Tab",
    "Home",
    "End",
  ];
  if (e.ctrlKey || e.metaKey) return;
  if (allowed.includes(e.key)) return;
  if (!/^\d$/.test(e.key)) e.preventDefault();
};

const hasMinLen = (s: string) => s.length >= 8;
const hasNumber = (s: string) => /\d/.test(s);
const hasSpecial = (s: string) => /[^A-Za-z0-9]/.test(s);

const Register: React.FC = () => {
  const navigate = useNavigate();

  const [driverId, setDriverId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const passChecks = useMemo(
    () => ({
      min: hasMinLen(password),
      num: hasNumber(password),
      special: hasSpecial(password),
    }),
    [password]
  );
  const isPasswordValid =
    passChecks.min && passChecks.num && passChecks.special;

  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!driverId.trim()) errs.driverId = "Driver ID is required.";
    else if (!isAllDigits(driverId))
      errs.driverId = "Driver ID must contain digits only.";

    if (!fullName.trim()) errs.fullName = "Full name is required.";

    if (!phone.trim()) errs.phone = "Phone number is required.";
    else if (!isAllDigits(phone))
      errs.phone = "Phone number must contain digits only.";

    if (!email.trim()) errs.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Invalid email format.";

    if (!password.trim()) errs.password = "Password is required.";
    else if (!isPasswordValid)
      errs.password =
        "Password must be at least 8 characters and include a number and a special character.";

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) return;

    setSubmitting(true);
    const payload = {
      email,
      password,
      userRole: 2,
      driverId: Number(driverId),
      fullName,
      phoneNumber: String(phone),
    };

    const ok = await registerUser(payload);
    setSubmitting(false);

    if (ok) navigate("/");
    else setError("Registration failed. Please try again.");
  };

  const RuleRow: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
    <div
      className={`d-flex align-items-center gap-2 small ${
        ok ? "text-success" : "text-danger"
      }`}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-grid",
          placeItems: "center",
          width: 18,
          height: 18,
          borderRadius: 999,
          border: `1px solid ${ok ? "#16a34a" : "#dc2626"}`,
          fontSize: 11,
        }}
      >
        {ok ? "✓" : "✗"}
      </span>
      <span>{label}</span>
    </div>
  );

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
        <h1 className="stack-title">Driver sign up</h1>

        <div className="mb-3" style={{ maxWidth: 420, margin: "0 auto" }}>
          <label className="form-label" style={{ color: "#65666d" }}>
            Driver ID
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={20}
            className={`form-control ${
              fieldErrors.driverId ? "is-invalid" : ""
            }`}
            placeholder="Enter your Driver ID"
            style={{ padding: "0.75rem 1rem", borderRadius: "12px" }}
            value={driverId}
            onKeyDown={handleDigitKeyDown}
            onChange={(e) => setDriverId(digitsOnly(e.target.value))}
            onPaste={(e) => {
              e.preventDefault();
              const pasted = (
                e.clipboardData || (window as any).clipboardData
              ).getData("text");
              setDriverId(digitsOnly(pasted));
            }}
          />
          {fieldErrors.driverId && (
            <div className="text-danger small">{fieldErrors.driverId}</div>
          )}
        </div>

        <form onSubmit={handleRegister} className="stack-form" noValidate>
          <div className="grid-2">
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
                <div className="text-danger small">{fieldErrors.fullName}</div>
              )}
            </div>

            <div>
              <label className="form-label">Phone number</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={20}
                className={`form-control ${
                  fieldErrors.phone ? "is-invalid" : ""
                }`}
                placeholder="Enter your Phone Number"
                value={phone}
                onKeyDown={handleDigitKeyDown}
                onChange={(e) => setPhone(digitsOnly(e.target.value))}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = (
                    e.clipboardData || (window as any).clipboardData
                  ).getData("text");
                  setPhone(digitsOnly(pasted));
                }}
              />
              {fieldErrors.phone && (
                <div className="text-danger small">{fieldErrors.phone}</div>
              )}
            </div>
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

              {password.length > 0 && (
                <div className="mt-2">
                  <div
                    className={`d-flex align-items-center gap-2 small ${
                      passChecks.min ? "text-success" : "text-danger"
                    }`}
                  >
                    {passChecks.min ? "✓" : "✗"} At least 8 characters
                  </div>
                  <div
                    className={`d-flex align-items-center gap-2 small ${
                      passChecks.num ? "text-success" : "text-danger"
                    }`}
                  >
                    {passChecks.num ? "✓" : "✗"} Contains at least one number
                  </div>
                  <div
                    className={`d-flex align-items-center gap-2 small ${
                      passChecks.special ? "text-success" : "text-danger"
                    }`}
                  >
                    {passChecks.special ? "✓" : "✗"} Contains at least one
                    special character
                  </div>
                </div>
              )}

              {fieldErrors.password && (
                <div className="text-danger small mt-1">
                  {fieldErrors.password}
                </div>
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

          <p className="text-center mb-0 mt-3 text-black">
            Already signed up? <Link to="/">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
