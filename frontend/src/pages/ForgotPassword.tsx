import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  forgotLookup,
  forgotSendCode,
  forgotVerifyCode,
  forgotReset,
} from "../services/authApi";

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const role: "admin" | "driver" =
    (location.state?.role as "admin" | "driver") ||
    (localStorage.getItem("role") as "admin" | "driver") ||
    "admin";

  const [step, setStep] = useState<"lookup" | "verify" | "reset">("lookup");
  const [inputId, setInputId] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const payload =
        role === "admin"
          ? { userRole: 1, adminId: Number(inputId) }
          : { userRole: 2, driverId: Number(inputId) };

      const res = await forgotLookup(payload);
      setUserId(res.userId);
      setMaskedEmail(res.maskedEmail);

      await forgotSendCode(res.userId);
      setStep("verify");
    } catch (err: any) {
      setStatus(err.message || "Data not found");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await forgotVerifyCode(userId, code);
      setResetToken(res.resetToken);
      setStep("reset");
    } catch (err: any) {
      setStatus(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) return;
    if (newPassword !== confirmPassword) {
      setStatus("Passwords do not match");
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      await forgotReset(resetToken, newPassword);
      setStatus("✅ Password reset successfully!");
      setTimeout(() => navigate("/"), 1500);
    } catch (err: any) {
      setStatus(err.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-onepage d-flex align-items-center justify-content-center">
      <div className="card p-4 shadow" style={{ maxWidth: 420, width: "100%" }}>
        <h3 className="mb-3 text-center">Forgot Password</h3>

        {step === "lookup" && (
          <form onSubmit={handleLookup}>
            <label className="form-label">
              Enter {role === "admin" ? "Admin ID" : "Driver ID"}
            </label>
            <input
              type="text"
              className="form-control mb-3"
              placeholder={`Enter your ${role} ID`}
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              required
            />
            <button className="btn btn-primary w-100" disabled={loading}>
              {loading ? "Sending..." : "Send Code"}
            </button>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={handleVerify}>
            <p className="text-muted">
              Verification code sent to: <strong>{maskedEmail}</strong>
            </p>
            <label className="form-label">Enter Code</label>
            <input
              type="text"
              className="form-control mb-3"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <button className="btn btn-primary w-100" disabled={loading}>
              {loading ? "Verifying..." : "Verify"}
            </button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleReset}>
            <label className="form-label">New Password</label>
            <div className="position-relative mb-2">
              <input
                type={showNewPassword ? "text" : "password"}
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-link eye-btn"
                onClick={() => setShowNewPassword((s) => !s)}
                aria-label={showNewPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              >
                {showNewPassword ? (
                  <i className="fa-solid fa-eye"></i>
                ) : (
                  <i className="fa-solid fa-eye-slash"></i>
                )}
              </button>
            </div>

            <label className="form-label">Confirm Password</label>
            <div className="position-relative mb-3">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-link eye-btn"
                onClick={() => setShowConfirmPassword((s) => !s)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              >
                {showConfirmPassword ? (
                  <i className="fa-solid fa-eye"></i>
                ) : (
                  <i className="fa-solid fa-eye-slash"></i>
                )}
              </button>
            </div>

            <button className="btn btn-primary w-100" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        {status && <div className="alert alert-info mt-3">{status}</div>}
      </div>
    </div>
  );
};

export default ForgotPassword;
