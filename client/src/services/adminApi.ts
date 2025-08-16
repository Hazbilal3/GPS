export type DriverReportRow = {
  barcode?: string;
  address?: string;
  lastGpsLocation?: string;
  expectedLocation?: string;
  distanceKm?: number | string | null;
  status?: string;
  mapsUrl?: string;
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3006";

export async function getDriverReport(opts: {
  driverId: number;
  date?: string;
  page?: number;
  limit?: number;
  token: string;
}): Promise<{ rows: DriverReportRow[]; total?: number }> {
  const { driverId, date, page = 1, limit = 20, token } = opts;

  const url = new URL("/report", BASE_URL);
  url.searchParams.set("driverId", String(driverId));
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit ?? 20));
  url.searchParams.set("date", date ?? "");


  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    let msg = `Failed to fetch report (${res.status})`;
    try {
      const j = await res.json();
      if (j?.message)
        msg = Array.isArray(j.message) ? j.message.join(", ") : j.message;
    } catch {}
    throw new Error(msg);
  }

  const payload = await res.json();

  const raw: any[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
    ? payload.data
    : [];

  const rows: DriverReportRow[] = raw.map((r: any) => ({
    barcode: r.barcode ?? "",
    address: r.address ?? "",
    lastGpsLocation: r.gpsLocation ?? "",
    expectedLocation:
      r.expectedLat != null && r.expectedLng != null
        ? `${r.expectedLat}, ${r.expectedLng}`
        : "",
    distanceKm: r.distanceKm ?? "",
    status: r.status ?? "",
    mapsUrl: r.googleMapsLink ?? r.googleMapLink ?? r.mapsUrl ?? "",
  }));

  const total: number | undefined = payload?.meta?.total ?? payload?.total;
  return { rows, total };
}

export async function exportDriverReport(opts: {
  driverId: number;
  date: string;
  token: string;
}): Promise<Blob> {
  const { driverId, date, token } = opts;

  const url = new URL(
    "/report/export",
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3006"
  );
  url.searchParams.set("driverId", String(driverId));
  url.searchParams.set("date", date);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    let msg = `Export failed (${res.status})`;
    try {
      const j = await res.json();
      if (j?.message)
        msg = Array.isArray(j.message) ? j.message.join(", ") : j.message;
    } catch {}
    throw new Error(msg);
  }

  return await res.blob();
}
