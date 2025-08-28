import { port } from "../port.interface";

const BASE_URL = port;

export async function forgotLookup(payload: {
  userRole: number;
  adminId?: number;
  driverId?: number;
}) {
  const res = await fetch(`${BASE_URL}/auth/forgot-lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Lookup failed");
  return res.json();
}

export async function forgotSendCode(userId: number) {
  const res = await fetch(`${BASE_URL}/auth/forgot-send-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });

  if (!res.ok) throw new Error("Failed to send code");
  return res.json();
}

export async function forgotVerifyCode(userId: number, code: string) {
  const res = await fetch(`${BASE_URL}/auth/forgot-verify-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, code }),
  });

  if (!res.ok) throw new Error("Invalid code");
  return res.json();
}

export async function forgotReset(resetToken: string, newPassword: string) {
  const res = await fetch(`${BASE_URL}/auth/forgot-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resetToken, newPassword }),
  });

  if (!res.ok) throw new Error("Reset failed");
  return res.json();
}
