export const API_ROOT = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api\/?$/, "") ||
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

export const API_BASE_URL = `${API_ROOT}/api`;

export function getClientAuthToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") || process.env.NEXT_PUBLIC_TOKEN || "";
}

export function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getClientAuthToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra ?? {}),
  };
}

export function resolveApiUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/api/")) return `${API_ROOT}${url}`;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(resolveApiUrl(url), {
    ...init,
    headers: authHeaders(init?.headers),
  });

  if (response.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authUser");
    window.location.href = "/login";
  }

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}
