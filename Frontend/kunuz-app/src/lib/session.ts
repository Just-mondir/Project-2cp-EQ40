import { AUTH_STORAGE_KEYS } from "@/lib/authApi";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api";

export function clearClientSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEYS.access);
  localStorage.removeItem(AUTH_STORAGE_KEYS.refresh);
  localStorage.removeItem(AUTH_STORAGE_KEYS.user);
  localStorage.removeItem(AUTH_STORAGE_KEYS.pending);
  localStorage.removeItem("username");
  localStorage.removeItem("user_username");
  localStorage.removeItem("user");
}

export async function logoutClient(): Promise<void> {
  if (typeof window === "undefined") return;

  const refresh = localStorage.getItem(AUTH_STORAGE_KEYS.refresh);
  const access = localStorage.getItem(AUTH_STORAGE_KEYS.access);

  if (refresh && access) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify({ refresh }),
      });
    } catch {
      // Logout must still clear client session even if API fails.
    }
  }

  clearClientSession();
}
