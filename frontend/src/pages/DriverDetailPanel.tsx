import React from "react";
import "../assets/components-css/DriversDirectory.css";
import type { Driver } from "./DriversDirectory";

interface Props {
  driver: Driver;
}

const DriverDetailPanel: React.FC<Props> = ({ driver }) => {
  const formatValue = (val?: number | string) => {
    if (!val || val === "") return "-";
    const num = Number(val);
    return isNaN(num) ? String(val) : `$${num.toFixed(2)}`;
  };

  return (
    <div className="driver-detail-panel">
      {/* Header */}
      <div className="detail-header">
        <h3 className="driver-name2">{driver["Full Name"] ?? "-"}</h3>
        <span
          className={`status-pill ${
            driver.Status === "Active" ? "active" : "inactive"
          }`}
        >
          {driver.Status ?? "-"}
        </span>
      </div>

      {/* Scrollable content */}
      <div className="detail-scroll">
        {/* Profile Section */}
        <section className="detail-card">
          <h5 className="section-title">Profile</h5>
          <div className="info-grid">
            <div className="info-item">
              <label>OFID Number</label>
              <div className="info-box">{driver["OFID Number"] ?? "-"}</div>
            </div>
            <div className="info-item">
              <label>First Name</label>
              <div className="info-box">{driver["First Name"] ?? "-"}</div>
            </div>
            <div className="info-item">
              <label>Last Name</label>
              <div className="info-box">{driver["Last Name"] ?? "-"}</div>
            </div>
            <div className="info-item">
              <label>Company</label>
              <div className="info-box">{driver.Company ?? "-"}</div>
            </div>
            <div className="info-item">
              <label>Phone Number</label>
              <div className="info-box">{driver["Phone Number"] ?? "-"}</div>
            </div>
            <div className="info-item">
              <label>Email</label>
              <div className="info-box email">
                {driver.Email ? (
                  <a href={`mailto:${driver.Email}`}>{driver.Email}</a>
                ) : (
                  "-"
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Schedule Section */}
        <section className="detail-card">
          <h5 className="section-title">Schedule</h5>
          <div className="schedule-days">
            {driver.Schedule && driver.Schedule.length > 0 ? (
              driver.Schedule.map((day, i) => (
                <div key={i} className="day-pill">
                  {day}
                </div>
              ))
            ) : (
              <p className="no-data">No schedule found</p>
            )}
          </div>
          <div className="availability">
            <label>Available Today:</label>
            <span
              className={`availability-pill ${
                driver["Driver Available Today?"] === "Yes"
                  ? "available"
                  : "unavailable"
              }`}
            >
              {driver["Driver Available Today?"] ?? "-"}
            </span>
          </div>
        </section>

        {/* Payroll Section */}
        <section className="detail-card">
          <h5 className="section-title">Payroll</h5>
          <div className="info-grid">
            <div className="info-item">
              <label>Salary Type</label>
              <div className="info-box">
                {driver["Salary Type"] ?? "-"}
              </div>
            </div>
            <div className="info-item">
              <label>Base Rate</label>
              <div className="info-box">
                {formatValue((driver as any)["Base Rate"])}
              </div>
            </div>
            <div className="info-item">
              <label>Rate per Stop</label>
              <div className="info-box">
                {formatValue((driver as any)["Rate per Stop"])}
              </div>
            </div>
            <div className="info-item">
              <label>Fixed Rate Per Stop</label>
              <div className="info-box">
                {formatValue((driver as any)["Fixed Rate Per Stop"])}
              </div>
            </div>
          </div>

          {/* Payroll table has been removed from here */}

        </section>
      </div>
    </div>
  );
};

export default DriverDetailPanel;