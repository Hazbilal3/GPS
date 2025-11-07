import React from "react";
import "../assets/components-css/Payroll.css";

interface PayrollViewToggleProps {
  viewMode: "weekly" | "daily";
  onChange: (mode: "weekly" | "daily") => void;
}

const PayrollViewToggle: React.FC<PayrollViewToggleProps> = ({
  viewMode,
  onChange,
}) => {
  return (
    <div className="payroll-role-switch2" role="group" aria-label="Select view">
      <span className={`switch-label2 ${viewMode === "weekly" ? "active" : ""}`}>
        Weekly
      </span>
      <label className="switch2">
        <input
          type="checkbox"
          checked={viewMode === "daily"}
          onChange={(e) => onChange(e.target.checked ? "daily" : "weekly")}
          aria-label="Toggle view mode"
        />
        <span className="slider2" />
      </label>
      <span className={`switch-label2 ${viewMode === "daily" ? "active" : ""}`}>
        Daily
      </span>
    </div>
  );
};

export default PayrollViewToggle;
