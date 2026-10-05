const API = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function apiUrl(path) {
  return `${API}${path}`;
}

async function getJson(path) {
  const res = await fetch(apiUrl(path));
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function estimateDomain(domain) {
  return getJson(`/api/estimate?domain=${encodeURIComponent(domain)}`);
}

export function compareDomains(a, b) {
  return getJson(`/api/compare?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`);
}

export function fetchNiches() {
  return getJson("/api/niches");
}

export function fetchPopular() {
  return getJson("/api/popular");
}

export async function calculate(body) {
  const res = await fetch(apiUrl("/api/calculate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
