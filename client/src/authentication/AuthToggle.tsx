import React from "react";
import "../App.css";

interface Props {
  active: "admin" | "driver";
  onChange: (role: "admin" | "driver") => void;
}

const AuthToggle: React.FC<Props> = ({ active, onChange }) => {
  return (
    <div className="d-flex mb-3 role-toggle">
      <button
        className={`toggle-btn ${active === "admin" ? "active" : ""}`}
        onClick={() => onChange("admin")}
        type="button"
      >
        Admin
      </button>
      <button
        className={`toggle-btn ${active === "driver" ? "active" : ""}`}
        onClick={() => onChange("driver")}
        type="button"
      >
        Driver
      </button>
    </div>
  );
};

export default AuthToggle;
