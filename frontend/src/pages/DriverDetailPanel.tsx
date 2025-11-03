import React, { useState, useEffect } from "react";
import type { Driver } from "./DriversDirectory";
import { useToast } from "../components/ToastManager";
import {
  LuPen,
  LuTrash2,
} from "react-icons/lu";


interface Props {
  driver: Driver;
  reloadDrivers: () => void;
  onUpdate: (id: number, driverData: Partial<Driver>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
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

const DriverDetailPanel: React.FC<Props> = ({
  driver,
  reloadDrivers,
  onUpdate,
  onDelete,
}) => {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [editedDriver, setEditedDriver] = useState(driver);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    setEditedDriver(driver);
    setEditing(false);
  }, [driver]);

  const handleChange = (key: keyof Driver, value: any) => {
    setEditedDriver({ ...editedDriver, [key]: value });
  };

  const toggleScheduleDay = (day: string) => {
    let schedule = editedDriver.Schedule || [];
    if (schedule.includes(day)) {
      schedule = schedule.filter((d) => d !== day);
    } else {
      schedule.push(day);
    }
    setEditedDriver({ ...editedDriver, Schedule: schedule });
  };

  const handleSave = async () => {
    try {
      const payload = {
        firstName: editedDriver["First Name"],
        lastName: editedDriver["Last Name"],
        Status: editedDriver.Status,
        phoneNumber: editedDriver["Phone Number"],
        email: editedDriver.Email,
        OFIDNumber: editedDriver["OFID Number"],
        salaryType: editedDriver["Salary Type"],
        schedule: editedDriver.Schedule,
        dayoftheweek: editedDriver["Day of the Week"],
        driverAvailableToday:
          editedDriver["Driver Available Today?"] === "Yes" ? true : false,
      };
      await onUpdate(driver.id!, payload);
      showToast("Driver updated successfully", "success");
      setEditing(false);
      reloadDrivers();
    } catch (e) {
      showToast("Failed to update driver", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(driver.id!);
      setShowDeleteModal(false);
      showToast("Driver deleted successfully", "success");
    } catch (e) {
      showToast("Failed to delete driver", "error");
    }
  };

  return (
    <div className="driver-detail-panel">
      <div className="detail-header">
        <h3 className="driver-name2">{driver["Full Name"]}</h3>
        <span
          className={`status-pill ${
            driver.Status === "Active" ? "active" : "inactive"
          }`}
        >
          {driver.Status}
        </span>
      </div>

      <div className="detail-scroll">
        {/* === Profile Section === */}
        <section className="detail-card">
          <h5 className="section-title">Profile</h5>
          <div className="info-grid">
            <div className="info-item">
              <label>Full Name</label>
              {editing ? (
                <input
                  className="form-control"
                  value={editedDriver["Full Name"]}
                  onChange={(e) => handleChange("Full Name", e.target.value)}
                />
              ) : (
                <span className="info-box">{driver["Full Name"]}</span>
              )}
            </div>

            <div className="info-item">
              <label>First Name</label>
              {editing ? (
                <input
                  className="form-control"
                  value={editedDriver["First Name"]}
                  onChange={(e) => handleChange("First Name", e.target.value)}
                />
              ) : (
                <span className="info-box">{driver["First Name"]}</span>
              )}
            </div>

            <div className="info-item">
              <label>Last Name</label>
              {editing ? (
                <input
                  className="form-control"
                  value={editedDriver["Last Name"]}
                  onChange={(e) => handleChange("Last Name", e.target.value)}
                />
              ) : (
                <span className="info-box">{driver["Last Name"]}</span>
              )}
            </div>

            <div className="info-item">
              <label>OFID Number</label>
              {editing ? (
                <input
                  type="number"
                  className="form-control"
                  value={editedDriver["OFID Number"] || ""}
                  onChange={(e) =>
                    handleChange("OFID Number", e.target.value)
                  }
                />
              ) : (
                <span className="info-box">{driver["OFID Number"]}</span>
              )}
            </div>

            <div className="info-item">
              <label>Email</label>
              {editing ? (
                <input
                  className="form-control"
                  value={editedDriver.Email}
                  onChange={(e) => handleChange("Email", e.target.value)}
                />
              ) : (
                <span className="info-box email">
                  <a href={`mailto:${driver.Email}`}>{driver.Email}</a>
                </span>
              )}
            </div>

            <div className="info-item">
              <label>Phone Number</label>
              {editing ? (
                <input
                  className="form-control"
                  value={editedDriver["Phone Number"]}
                  onChange={(e) =>
                    handleChange("Phone Number", e.target.value)
                  }
                />
              ) : (
                <span className="info-box">{driver["Phone Number"]}</span>
              )}
            </div>
          </div>
        </section>

        {/* === Payroll Section === */}
        <section className="detail-card">
          <h5 className="section-title">Payroll</h5>
          <div className="info-item" style={{ maxWidth: "250px" }}>
            <label>Salary Type</label>
            {editing ? (
              <select
                className="form-select"
                value={editedDriver["Salary Type"] || "Regular"}
                onChange={(e) =>
                  handleChange("Salary Type", e.target.value)
                }
              >
                <option>Regular</option>
                <option>Company Vehicle</option>
                <option>Fixed Rate</option>
              </select>
            ) : (
              <span className="info-box">{driver["Salary Type"]}</span>
            )}
          </div>
        </section>

        {/* === Schedule Section === */}
        <section className="detail-card">
          <h5 className="section-title">Schedule</h5>
          <div className="info-grid">
            <div className="info-item">
              <label>Day of the Week</label>
              {editing ? (
                <select
                  className="form-select"
                  value={editedDriver["Day of the Week"] || ""}
                  onChange={(e) =>
                    handleChange("Day of the Week", e.target.value)
                  }
                >
                  {weekdays.map((day) => (
                    <option key={day}>{day}</option>
                  ))}
                </select>
              ) : (
                <span className="info-box">{driver["Day of the Week"]}</span>
              )}
            </div>

            <div className="info-item">
              <label>Driver Available Today?</label>
              {editing ? (
                <select
                  className="form-select"
                  value={
                    editedDriver["Driver Available Today?"] === "Yes"
                      ? "Yes"
                      : "No"
                  }
                  onChange={(e) =>
                    handleChange(
                      "Driver Available Today?",
                      e.target.value === "Yes" ? "Yes" : "No"
                    )
                  }
                >
                  <option>Yes</option>
                  <option>No</option>
                </select>
              ) : (
                <span
                  className={`availability-pill ${
                    driver["Driver Available Today?"] === "Yes"
                      ? "available"
                      : "unavailable"
                  }`}
                >
                  {driver["Driver Available Today?"]}
                </span>
              )}
            </div>
          </div>

          <label className="mt-3">Weekly Schedule</label>
          <div className="schedule-wrapper mt-2">
            {weekdays.map((day) => {
              const active = editedDriver.Schedule?.includes(day);
              return editing ? (
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
              ) : (
                active && (
                  <span key={day} className="day-pill">
                    {day}
                  </span>
                )
              );
            })}
          </div>
        </section>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 d-flex justify-content-end gap-2">
        {editing ? (
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              Save
            </button>
          </>
        ) : (
          <>
            <button
              className="btn btn-outline-primary"
              onClick={() => setEditing(true)}
            >
              <i ><LuPen/></i> 
            </button>
            <button
              className="btn btn-outline-danger"
              onClick={() => setShowDeleteModal(true)}
            >
              <i ><LuTrash2/></i> 
            </button>
          </>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="driver-modal-container">
            <h5>Are you sure you want to delete this driver?</h5>
            <p>This action cannot be undone.</p>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDetailPanel;
