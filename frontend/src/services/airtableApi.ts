import type { Driver } from "../pages/DriversDirectory";
import { port } from "../port.interface";

// === Get all drivers ===
export async function listAirtableDrivers(): Promise<Driver[]> {
  try {
    const res = await fetch(`${port}/airtable/drivers-data`);
    if (!res.ok) throw new Error(`Failed to fetch drivers: ${res.status}`);
    const data = await res.json();

    return Array.isArray(data)
      ? data.map((d) => ({
          id: d.id,
          ["Full Name"]: d["Full Name"] || d.fullName || `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim(),
          ["First Name"]: d.firstName,
          ["Last Name"]: d.lastName,
          Status: d.Status,
          Company: "-",
          ["Phone Number"]: d.phoneNumber,
          Email: d.email,
          ["OFID Number"]: d.OFIDNumber ?? "-",
          ["Salary Type"]: d.salaryType,
          Schedule: d.schedule ?? [],
          ["Day of the Week"]: d.dayoftheweek,
          ["Driver Available Today?"]: d.driverAvailableToday ? "Yes" : "No",
        }))
      : [];
  } catch (err) {
    console.error("❌ Error fetching Airtable drivers:", err);
    return [];
  }
}

// === Add new driver ===
export async function createDriver(driver: any) {
  const res = await fetch(`${port}/airtable/add-driver`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(driver),
  });
  if (!res.ok) throw new Error("Failed to create driver");
  return res.json();
}

// === Update driver ===
export async function updateDriver(id: number, driver: any) {
  const res = await fetch(`${port}/airtable/edit-driver/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(driver),
  });
  if (!res.ok) throw new Error("Failed to update driver");
  return res.json();
}

// === Delete driver ===
export async function deleteDriver(id: number) {
  const res = await fetch(`${port}/airtable/delete-driver/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete driver");
  return res.json();
}
// ✅ Add this helper function:
export async function listAirtableDriverNames() {
  try {
    const drivers = await listAirtableDrivers();
    return drivers.map((d: any) => d["Full Name"]).filter(Boolean);
  } catch (e) {
    console.error("Failed to load Airtable driver names", e);
    return [];
  }
}