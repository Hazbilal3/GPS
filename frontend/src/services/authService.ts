export async function loginUser(role: string, credentials: any) {
  // Replace with your backend JWT API endpoint
  const res = await fetch(`/api/${role}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.token;
}

export async function registerUser(role: string, payload: any) {
  const res = await fetch(`/api/${role}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.ok;
}
