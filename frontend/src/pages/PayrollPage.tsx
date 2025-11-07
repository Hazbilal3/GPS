import React, { useState, useEffect, useCallback, useMemo } from "react"; // Added useMemo
import { port } from "../port.interface";
import AdminLayout from "../shareable/AdminLayout";
import {
  LuX,
  LuChevronRight,
  LuChevronDown,
  LuCheck,
  LuPencil,
  LuList,
} from "react-icons/lu";
import "../assets/components-css/Payroll.css";
import DriverFilterDropdown from "../shareable/DriverFilterDropdown";
// REMOVED airtableApi import
// import { listAirtableDriverNames } from "../services/airtableApi";
import { listDrivers } from "../services/adminApi"; // ADDED this import
import PayrollViewToggle from "../components/PayrollViewToggle";

// --- Types (Unchanged) ---
type ZipBreakdown = {
  zip: string;
  stops: number;
  rate: number;
  amount: number;
};

type Driver = {
  driverId: number;
  driverName: string;
  totalStops: number;
  subtotal: number;
  totalDeduction: number;
  netPay: number;
  zipBreakdown: ZipBreakdown[];
};

type PayrollData = {
  weekNumber: number;
  payPeriod: string;
  totalStops: number;
  subtotal: number;
  totalDeductions: number;
  netPay: number;
  drivers: Driver[];
};

type DriverPayrollRecord = {
  weekNumber: number;
  payPeriod: string;
  totalStops: number;
  subtotal: number;
  totalDeduction: number;
  netPay: number;
  zipBreakdown: ZipBreakdown[];
};

// --- NEW Daily Data Type ---
type DailyPayrollRecord = {
  driverId: number;
  driverName: string;
  date: string;
  totalStops: number;
  subtotal: number; // <-- Was 'amount'
  deduction: number; // <-- NEW
  netPay: number; // <-- NEW
};

// --- Helper (Unchanged) ---
function getRoleName(): "admin" | "driver" | "" {
  const raw = (
    localStorage.getItem("userRole") ??
    localStorage.getItem("role") ??
    ""
  )
    .toString()
    .toLowerCase()
    .trim();

  if (raw === "1" || raw === "admin") return "admin";
  if (raw === "2" || raw === "driver") return "driver";
  return "";
}

const PayrollPage: React.FC = () => {
  // ADDED: Get token for adminApi
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);
  const role = getRoleName();
  const isAdmin = role === "admin";
  const [rightName, setRightName] = useState(isAdmin ? "Admin" : "Driver");

  useEffect(() => {
    const cachedName =
      localStorage.getItem("fullName") ||
      localStorage.getItem("driverName") ||
      localStorage.getItem("firstname") ||
      localStorage.getItem("firstName") ||
      (isAdmin ? "Admin" : "Driver");
    setRightName(cachedName);
  }, [isAdmin]);

  const driverId = localStorage.getItem("driverId") ?? "";
  const driverName =
    localStorage.getItem("fullName") ||
    localStorage.getItem("driverName") ||
    "Driver";

  // --- NEW: State for view mode ---
  const [viewMode, setViewMode] = useState<"weekly" | "daily">("weekly");
// existing driver filter state
const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);

// new date filter state (no duplicate names!)
const [selectedDate, setSelectedDate] = useState<string | null>(() => {
  const today = new Date();
  return today.toISOString().split("T")[0]; // default to today
});


  // --- State for Weekly View ---
  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // --- NEW: State for Daily View ---
  const [dailyPayrollData, setDailyPayrollData] = useState<
    DailyPayrollRecord[]
  >([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState<string | null>(null);

  // --- State for Filters/Editing (Unchanged) ---
  const [allDrivers, setAllDrivers] = useState<string[]>([]);

  const [editingDeduction, setEditingDeduction] = useState<{
    driverId: number;
    weekNumber: number;
  } | null>(null);
  const [currentDeductionValue, setCurrentDeductionValue] = useState<
    number | string
  >("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- Fetch for Weekly Data ---
  const fetchPayrollData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = isAdmin
        ? `${port}/uploads/payroll`
        : `${port}/uploads/payroll/${driverId}`;

      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch payroll data");
      }

      const rawData = await res.json();

      let data: PayrollData[] = [];

      if (isAdmin) {
        data = Array.isArray(rawData) ? rawData : [];
      } else {
        const driverRecords: DriverPayrollRecord[] = Array.isArray(rawData)
          ? rawData
          : [];

        data = driverRecords.map((record) => {
          const driver: Driver = {
            driverId: Number(driverId),
            driverName: driverName,
            totalStops: record.totalStops,
            subtotal: record.subtotal,
            totalDeduction: record.totalDeduction,
            netPay: record.netPay,
            zipBreakdown: record.zipBreakdown || [],
          };

          return {
            weekNumber: record.weekNumber,
            payPeriod: record.payPeriod || "",
            totalStops: record.totalStops,
            subtotal: record.subtotal,
            totalDeductions: record.totalDeduction,
            netPay: record.netPay,
            drivers: [driver],
            };
        });
      }

      const sortedData = data.sort((a, b) => b.weekNumber - a.weekNumber);
      setPayrollData(sortedData);
    } catch (err: any) {
      setError(err?.message || "Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, driverId, driverName]);

  // --- NEW: Fetch for Daily Data ---
const fetchDailyPayrollData = useCallback(async (forceRefresh = false) => {
  // Allow refetch when toggling, not just once
  if (!forceRefresh && dailyPayrollData.length > 0) return;

  setDailyLoading(true);
  setDailyError(null);
  try {
    const endpoint = isAdmin
      ? `${port}/uploads/payroll/daily`
      : `${port}/uploads/payroll/daily/${driverId}`;

    const res = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to fetch daily payroll data");
    }

    const rawData = await res.json();
    setDailyPayrollData(Array.isArray(rawData) ? rawData : []);
  } catch (err: any) {
    setDailyError(err?.message || "Failed to load daily data");
  } finally {
    setDailyLoading(false);
  }
}, [isAdmin, driverId]);


  // Initial fetch for weekly data
  useEffect(() => {
    fetchPayrollData();
  }, [fetchPayrollData]);

  // --- REPLACED: Fetch driver names for filter ---
  useEffect(() => {
    const fetchDrivers = async () => {
      if (!isAdmin) return;
      try {
        // Use the 'listDrivers' function from adminApi
        const driverData = await listDrivers(token);
        // Extract just the 'fullName' field
        const names = driverData
          .map((d: any) => d.fullName)
          .filter(Boolean) as string[];
        setAllDrivers(names.sort());
      } catch (err) {
        console.error("Failed to load driver names for filter", err);
        // Don't crash the page, just make the filter empty
        setAllDrivers([]);
      }
    };
    fetchDrivers();
  }, [isAdmin, token]); // Add token as a dependency

  // --- Event Handlers (Unchanged) ---
  const toggleWeek = (weekNumber: string) => {
    setExpandedWeek((prev) => (prev === weekNumber ? null : weekNumber));
    setEditingDeduction(null);
  };

  const handleShowDetails = (driver: Driver) => setSelectedDriver(driver);
  const closeModal = () => setSelectedDriver(null);

  const handleEditDeduction = (
    driverId: number,
    weekNumber: number,
    currentAmount: number,
  ) => {
    setEditingDeduction({ driverId, weekNumber });
    setCurrentDeductionValue(currentAmount);
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditingDeduction(null);
    setCurrentDeductionValue("");
    setEditError(null);
  };

  // --- Save Deduction (Unchanged, but now updates weekly data only) ---
  const handleSaveDeduction = async () => {
    if (!editingDeduction || isSaving) return;

    const { driverId, weekNumber } = editingDeduction;
    const totalDeduction = Number(currentDeductionValue);

    if (isNaN(totalDeduction) || totalDeduction < 0) {
      setEditError("Invalid deduction amount.");
      return;
    }

    setIsSaving(true);
    setEditError(null);

    try {
      const res = await fetch(`${port}/uploads/payroll/deduction`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          driverId,
          weekNumber,
          totalDeduction,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save deduction");
      }

      const updatedPayrollRecord = await res.json();

      setPayrollData((prevData) => {
        return prevData.map((week) => {
          if (week.weekNumber !== weekNumber) return week;

          let newWeekTotalDeductions = 0;
          let newWeekNetPay = 0;

          const newDrivers = week.drivers.map((driver) => {
            let newDriver = driver;
            if (driver.driverId === driverId) {
              newDriver = {
                ...driver,
                totalDeduction: updatedPayrollRecord.totalDeduction,
                netPay: updatedPayrollRecord.netPay,
              };
            }

            newWeekTotalDeductions += newDriver.totalDeduction;
            newWeekNetPay += newDriver.netPay;
            return newDriver;
          });

          const newWeekSubtotal = newDrivers.reduce(
            (sum, d) => sum + d.subtotal,
            0,
          );
          const newWeekTotalStops = newDrivers.reduce(
            (sum, d) => sum + d.totalStops,
            0,
          );

          return {
            ...week,
            drivers: newDrivers,
            totalStops: newWeekTotalStops,
            subtotal: newWeekSubtotal,
            totalDeductions: newWeekTotalDeductions,
            netPay: newWeekNetPay,
          };
        });
      });

      setEditingDeduction(null);
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Filter for Weekly View (FIXED) ---
  const filteredPayrollData = payrollData
    .map((weekData) => {
      const driversToShow = isAdmin
        ? weekData.drivers.filter((driver) =>
            selectedDrivers.length
              ? selectedDrivers.some((selected) => {
                  const driverName = driver.driverName?.trim().toLowerCase() || "";
                  const selectedName = selected?.trim().toLowerCase() || "";
                  // Use exact match now that sources are the same
                  return driverName === selectedName;
                })
              : true,
          )
        : weekData.drivers;

      const newTotalStops = driversToShow.reduce(
        (acc, driver) => acc + driver.totalStops,
        0,
      );
      const newSubtotal = driversToShow.reduce(
        (acc, driver) => acc + driver.subtotal,
        0,
      );
      const newTotalDeductions = driversToShow.reduce(
        (acc, driver) => acc + driver.totalDeduction,
        0,
      );
      const newNetPay = driversToShow.reduce(
        (acc, driver) => acc + driver.netPay,
        0,
      );

      return {
        ...weekData,
        drivers: driversToShow,
        totalStops: newTotalStops,
        subtotal: newSubtotal,
        totalDeductions: newTotalDeductions,
        netPay: newNetPay,
      };
    })
    .filter((week) => week.drivers.length > 0);

  // --- NEW: Filter for Daily View (FIXED) ---
const filteredDailyData = dailyPayrollData
  .filter((row) => {
    if (!isAdmin) return true; // Drivers only see their own data
    if (selectedDrivers.length === 0) return true; // No filter selected
    return selectedDrivers.some((selected) => {
      const driverName = row.driverName?.trim().toLowerCase() || "";
      const selectedName = selected?.trim().toLowerCase() || "";
      // Use exact match now that sources are the same
      return driverName === selectedName;
    });
  })
.filter((row) => {
  if (!selectedDate) return true; // if cleared, show all
  return row.date.startsWith(selectedDate);
});



  // --- NEW: Toggle Handler ---
const handleViewChange = (newMode: "weekly" | "daily") => {
  setViewMode(newMode);

  if (newMode === "daily") {
    // Always refetch daily data to ensure freshness
    fetchDailyPayrollData(true);
  } else {
    // Re-fetch weekly to sync updates back
    fetchPayrollData();
  }
};
useEffect(() => {
  if (viewMode === "daily") {
    fetchDailyPayrollData(true);
  }
}, [payrollData, viewMode, fetchDailyPayrollData]);


  // --- NEW: Reusable Render Functions for Tables ---

  const renderWeeklyTable = () => (
    <div className="table-responsive card p-3">
      {loading && <div className="p-3">Loading weekly data...</div>}
      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      )}
      {!loading && !error && (
        <table className="table table-borderless align-middle mb-0 custom-table text-center">
          <thead>
            <tr>
              <th>Week Number</th>
              <th>Pay Period</th>
              <th>Driver</th>
              <th>Total Stops</th>
         <th>Subtotal</th>
              <th>Deduction</th>
              <th>Net Pay</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayrollData.length > 0 ? (
              filteredPayrollData.map((weekData) => {
                const isExpanded =
                  expandedWeek === String(weekData.weekNumber);
                return (
                  <React.Fragment key={weekData.weekNumber}>
                    <tr
                      className="week-summary-row"
                      onClick={() => toggleWeek(String(weekData.weekNumber))}
                    >
                      <td>
                        {isExpanded ? <LuChevronDown /> : <LuChevronRight />}{" "}
                        {/* Show YYYY-WW format from key */}
                        Week{" "}
                        {String(weekData.weekNumber).slice(0, 4)}-
                        {String(weekData.weekNumber).slice(4)}
                      </td>
                      <td>{weekData.payPeriod}</td>
                      <td></td>
                      <td>
                        <span className="summary-label">total: </span>
                        {weekData.totalStops}
                      </td>
                      <td>
                        <span className="summary-label">sub total: </span>$
                        {weekData.subtotal.toFixed(2)}
                      </td>
                      <td className="text-danger">
                        <span className="summary-label">total: </span>$
                        {weekData.totalDeductions.toFixed(2)}
                      </td>
                     <td className="text-success fw-bold">
                        <span className="summary-label">sum: </span>$
                        {weekData.netPay.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>

                    {isExpanded &&
                      weekData.drivers.map((driver) => {
                        const isEditingThis =
                          isAdmin &&
                          editingDeduction?.driverId === driver.driverId &&
                          editingDeduction?.weekNumber ===
                            weekData.weekNumber;

                        return (
                          <tr key={driver.driverId}>
                            <td>
                              Week{" "}
                              {String(weekData.weekNumber).slice(0, 4)}-
                              {String(weekData.weekNumber).slice(4)}
                            </td>
                            <td>{weekData.payPeriod}</td>
                            <td>{driver.driverName}</td>
                            <td>{driver.totalStops}</td>
                            <td>${driver.subtotal.toFixed(2)}</td>

                            <td className="text-danger">
                              {isEditingThis ? (
                                <div className="deduction-edit-cell">
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="form-control form-control-sm"
                                    value={currentDeductionValue}
                                      onChange={(e) =>
                                        setCurrentDeductionValue(e.target.value)
                                    }
                                    disabled={isSaving}
                                  />
                                  {editError && (
                                    <div className="deduction-edit-error">
                                      {editError}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                `$${driver.totalDeduction.toFixed(2)}`
                              )}
                            </td>

                            <td className="text-success fw-bold">
                             ${driver.netPay.toFixed(2)}
                            </td>

                            <td className="action-cell">
                              {isAdmin ? (
                                isEditingThis ? (
                               <div className="deduction-edit-actions">
                                    <button
                                      className="btn btn-sm btn-success-soft"style={{color:"green"}}
                                      onClick={handleSaveDeduction}
                                      disabled={isSaving}
                                    >
                                        {isSaving ? "..." : <LuCheck />}
                                      </button>
                                    <button
                                     className="btn btn-sm btn-danger-soft"style={{color:"red"}}
                                      onClick={handleCancelEdit}
                                      disabled={isSaving}
                           >
                                      <LuX />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="admin-action-buttons">
                                    <button
                                      className="btn btn-sm btn-outline-pay-primary mx-2"
                                     title="Edit Deduction"
                                      onClick={() =>
                                        handleEditDeduction(
                                        driver.driverId,
                                          weekData.weekNumber,
                                         driver.totalDeduction,
                                        )
                                   }
                                    >
                                      <LuPencil />
                                    </button>
                                   <button
                                      className="btn btn-sm btn-outline-pay-primary"
                            title="View Details"
                                      onClick={() =>
                                        handleShowDetails(driver)
                           }
                                >
                                 <LuList />
                                    </button>
                                  </div>
                                )
                           ) : (
                        <button
                                  className="btn btn-outline-pay-primary"
                                  onClick={() => handleShowDetails(driver)}
                         >
                                  Details
                             </button>
                              )}
                            </td>
                         </tr>
                       );
                      })}
                  </React.Fragment>
               );
              })
            ) : (
        <tr>
                <td colSpan={8} className="text-center p-4">
                  {payrollData.length > 0
                   ? "No matching payroll data found."
                    : "No payroll data available."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );

// [REPLACE THIS FUNCTION]
const renderDailyTable = () => (
  <div className="table-responsive card p-3">
    {dailyLoading && <div className="p-3">Loading daily data...</div>}
    {dailyError && (
      <div className="alert alert-danger">
        <strong>Error:</strong> {dailyError}
      </div>
    )}
    {!dailyLoading && !dailyError && (
   <table className="table table-borderless table-striped align-middle mb-0 custom-table text-center">
        <thead>
          <tr>
            <th>Date</th>
            {isAdmin && <th>Driver</th>}
            <th>Total Stops</th>
            <th>Subtotal</th>
            <th>Deduction</th>
            <th>Net Pay</th>
          </tr>
        </thead>
        <tbody>
          {filteredDailyData.length > 0 ? (
            filteredDailyData.map((row, index) => (
              <tr key={`${row.driverId}-${row.date}-${index}`}>
                <td>{row.date}</td>
                {isAdmin && <td>{row.driverName}</td>}
                <td>{row.totalStops}</td>
                <td>${row.subtotal.toFixed(2)}</td>
             <td className="text-danger">
                  ${row.deduction.toFixed(2)}
                </td>
                <td className="text-success fw-bold">
              ${row.netPay.toFixed(2)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
              colSpan={isAdmin ? 6 : 5} // <-- Updated colspan
                  className="text-center p-4"
                >
                  {dailyPayrollData.length > 0
                    ? "No matching payroll data found."
                 : "No daily data available."}
                </td>
            </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <AdminLayout
      title="Payroll"
      variant={isAdmin ? "admin" : "driver"}
      rightNameOverride={rightName}
    >
      <div className="payroll-filter-bar">
        {isAdmin && (
          <DriverFilterDropdown
           drivers={allDrivers}
            selectedDrivers={selectedDrivers}
            onChange={setSelectedDrivers}
            title="Driver"
          />
        )}
{viewMode === "daily" && (
 <div className=" d-flex align-items-center gap-2 ">
    <input
      type="date"
      className="form-control form-control-sm payroll-date-filter"
      value={selectedDate || ""}
      max={new Date().toISOString().split("T")[0]} // restrict to today or before
      onChange={(e) => setSelectedDate(e.target.value || null)}
      // style={{
      //   borderColor: "#3b82f6",
      //   boxShadow: "0 0 4px rgba(59,130,246,0.4)",
      // }}
    />
    {/* {selectedDate && (
      <button
        className="btn btn-sm clear" 
        onClick={() => setSelectedDate(null)}
      >
        Clear
      </button>
    )} */}
  </div>
)}

        {/* --- NEW: View Mode Toggle --- */}
<div className="payroll-view-toggle ms-auto">
  <PayrollViewToggle viewMode={viewMode} onChange={handleViewChange} />
</div>

      </div>

      {/* --- NEW: Conditional Rendering --- */}
      {viewMode === "weekly" ? renderWeeklyTable() : renderDailyTable()}

      {/* Modal (Unchanged) */}
      {selectedDriver && (
        <div className="modal-overlay-pay">
          <div className="modal-content-pay">
            <button onClick={closeModal} className="btn btn-light">
              <LuX />
         </button>
            <h6 className="mb-3" style={{ color: "#3b82f6" }}>
              <span style={{ color: "#000" }}>Name:</span>{" "}
              {selectedDriver.driverName} <br />
              <span style={{ color: "#000" }}>OFID:</span>{" "}
           {selectedDriver.driverId}
            </h6>
            <table className="table table-sm table-bordered">
              <thead>
                <tr>
                  <th>Zip</th>
                  <th>Stops</th>
               <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(selectedDriver.zipBreakdown || []).map((zip, idx) => (
          <tr key={idx}>
                	<td>{zip.zip}</td>
                    <td>{zip.stops}</td>
                    <td>${zip.rate.toFixed(2)}</td>
                    <td>${zip.amount.toFixed(2)}</td>
               </tr>
                ))}
              </tbody>
           </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default PayrollPage;