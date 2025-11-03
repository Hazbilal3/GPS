import React, { useState } from "react";
import type { Driver } from "./DriversDirectory";

interface Props {
  onSubmit: (driver: Driver) => void;
  onCancel: () => void;
}

const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DriverFormPanel: React.FC<Props> = ({ onSubmit, onCancel }) => {
  const [form, setForm] = useState<any>({
    ["Full Name"]: "",
    ["First Name"]: "",
    ["Last Name"]: "",
    Status: "Active",
    ["Phone Number"]: "",
    Email: "",
    ["OFID Number"]: "",
    ["Salary Type"]: "Regular",
    Schedule: [],
    ["Day of the Week"]: "Monday",
    ["Driver Available Today?"]: "Yes",
  });

  const handleChange = (key: keyof Driver, value: any) => {
    setForm({ ...form, [key]: value });
  };

  const toggleScheduleDay = (day: string) => {
    let schedule = form.Schedule || [];
    if (schedule.includes(day)) {
      schedule = schedule.filter((d: string) => d !== day);
    } else {
      schedule.push(day);
    }
    setForm({ ...form, Schedule: schedule });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      firstName: form["First Name"],
      lastName: form["Last Name"],
      fullName: form["Full Name"],
      Status: form.Status,
      phoneNumber: form["Phone Number"],
      email: form.Email,
      OFIDNumber: Number(form["OFID Number"]) || null,
      salaryType: form["Salary Type"],
      schedule: form.Schedule,
      dayoftheweek: form["Day of the Week"],
      driverAvailableToday:
        form["Driver Available Today?"] === "Yes" ? true : false,
    });
  };

  return (
    <form className="driver-detail-panel" onSubmit={handleSubmit}>
      <div className="detail-header">
        <h3 className="driver-name2">Add New Driver</h3>
      </div>

      <div className="detail-scroll">
        {/* Profile */}
        <section className="detail-card">
          <h5 className="section-title">Profile</h5>
          <div className="info-grid">
            <div className="info-item">
              <label>Full Name</label>
              <input
                className="form-control"
                value={form["Full Name"]}
                onChange={(e) => handleChange("Full Name", e.target.value)}
              />
            </div>
            <div className="info-item">
              <label>First Name</label>
              <input
                className="form-control"
                value={form["First Name"]}
                onChange={(e) => handleChange("First Name", e.target.value)}
              />
            </div>
            <div className="info-item">
              <label>Last Name</label>
              <input
                className="form-control"
                value={form["Last Name"]}
                onChange={(e) => handleChange("Last Name", e.target.value)}
              />
            </div>
            <div className="info-item">
              <label>OFID Number</label>
              <input
                type="number"
                className="form-control"
                value={form["OFID Number"]}
                onChange={(e) => handleChange("OFID Number", e.target.value)}
              />
            </div>
            <div className="info-item">
              <label>Email</label>
              <input
                className="form-control"
                value={form.Email}
                onChange={(e) => handleChange("Email", e.target.value)}
              />
            </div>
            <div className="info-item">
              <label>Phone Number</label>
              <input
                className="form-control"
                value={form["Phone Number"]}
                onChange={(e) =>
                  handleChange("Phone Number", e.target.value)
                }
              />
            </div>
          </div>
        </section>

        {/* Payroll */}
        <section className="detail-card">
          <h5 className="section-title">Payroll</h5>
          <div className="info-item" style={{ maxWidth: "250px" }}>
            <label>Salary Type</label>
            <select
              className="form-select"
              value={form["Salary Type"]}
              onChange={(e) => handleChange("Salary Type", e.target.value)}
            >
              <option>Regular</option>
              <option>Company Vehicle</option>
              <option>Fixed Rate</option>
            </select>
          </div>
        </section>

        {/* Schedule */}
        <section className="detail-card">
          <h5 className="section-title">Schedule</h5>
          <div className="info-grid">
            <div className="info-item">
              <label>Day of the Week</label>
              <select
                className="form-select"
                value={form["Day of the Week"]}
                onChange={(e) =>
                  handleChange("Day of the Week", e.target.value)
                }
              >
                {weekdays.map((day) => (
                  <option key={day}>{day}</option>
                ))}
              </select>
            </div>
            <div className="info-item">
              <label>Driver Available Today?</label>
              <select
                className="form-select"
                value={form["Driver Available Today?"]}
                onChange={(e) =>
                  handleChange("Driver Available Today?", e.target.value)
                }
              >
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>
          </div>

          <label className="mt-3">Weekly Schedule</label>
          <div className="schedule-wrapper mt-2">
            {weekdays.map((day) => {
              const active = form.Schedule?.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleScheduleDay(day)}
                  className={`day-pill ${
                    active ? "bg-primary text-white" : ""
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mt-3 d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Create
        </button>
      </div>
    </form>
  );
};

export default DriverFormPanel;
