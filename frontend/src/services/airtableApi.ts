// src/services/airtableApi.ts
export async function listAirtableDrivers(): Promise<any[]> {
  try {
    const res = await fetch("http://localhost:3010/airtable/drivers");
    if (!res.ok) {
      throw new Error(`Failed to fetch drivers: ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("❌ Error fetching Airtable drivers:", err);
    return [];
  }
}
