const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api";

export type PendingAuthFlow = "signup";

export type PendingAuthContext = {
  flow: PendingAuthFlow;
  userId: string;
  email: string;
};

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, unknown>;
};

type AuthTokenPayload = {
  access: string;
  refresh: string;
  user?: Record<string, unknown>;
};

type UserIdPayload = {
  user_id: string;
};

type ToggleGemPayload = {
  liked: boolean;
  gems_count: number;
};

type ToggleSavePayload = {
  saved: boolean;
};

export const AUTH_STORAGE_KEYS = {
  access: "accessToken",
  refresh: "refreshToken",
  user: "authUser",
  pending: "pendingAuthContext",
} as const;

export function readPendingAuthContext(): PendingAuthContext | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(AUTH_STORAGE_KEYS.pending);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PendingAuthContext;
    if (!parsed?.flow || !parsed?.userId || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePendingAuthContext(context: PendingAuthContext): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_STORAGE_KEYS.pending, JSON.stringify(context));
}

export function clearPendingAuthContext(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEYS.pending);
}

export function saveAuthTokens(payload: AuthTokenPayload): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_STORAGE_KEYS.access, payload.access);
  localStorage.setItem(AUTH_STORAGE_KEYS.refresh, payload.refresh);
  if (payload.user) {
    localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(payload.user));
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_STORAGE_KEYS.access);
}

function extractErrorMessage(
  envelope: ApiEnvelope<unknown> | null,
  fallback: string,
): string {
  if (!envelope) return fallback;

  if (typeof envelope.message === "string" && envelope.message.trim()) {
    return envelope.message;
  }

  if (envelope.errors && typeof envelope.errors === "object") {
    const values = Object.values(envelope.errors);
    if (values.length > 0) {
      const first = values[0];
      if (Array.isArray(first) && typeof first[0] === "string") {
        return first[0];
      }
      if (typeof first === "string") {
        return first;
      }
    }
  }

  return fallback;
}

async function postJson<TResponse>(
  path: string,
  body: Record<string, unknown>,
  fallbackError: string,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  let envelope: ApiEnvelope<TResponse> | null = null;
  try {
    envelope = (await response.json()) as ApiEnvelope<TResponse>;
  } catch {
    envelope = null;
  }

  if (!response.ok || !envelope?.data) {
    throw new Error(extractErrorMessage(envelope, fallbackError));
  }

  return envelope.data;
}

async function postAuthJson<TResponse>(
  path: string,
  fallbackError: string,
): Promise<TResponse> {
  const token = getAccessToken();

  if (!token) {
    throw new Error("No access token found. Please login again.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  let envelope: ApiEnvelope<TResponse> | null = null;
  try {
    envelope = (await response.json()) as ApiEnvelope<TResponse>;
  } catch {
    envelope = null;
  }

  if (!response.ok || !envelope?.data) {
    throw new Error(extractErrorMessage(envelope, fallbackError));
  }

  return envelope.data;
}

export async function registerUser(input: {
  email: string;
  password: string;
}): Promise<UserIdPayload> {
  return postJson<UserIdPayload>(
    "/auth/register/",
    input,
    "Registration failed.",
  );
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthTokenPayload> {
  return postJson<AuthTokenPayload>("/auth/login/", input, "Login failed.");
}

export async function verifySignupOtp(input: {
  userId: string;
  otpCode: string;
}): Promise<AuthTokenPayload> {
  return postJson<AuthTokenPayload>(
    "/auth/verify-email/",
    {
      user_id: input.userId,
      otp_code: input.otpCode,
    },
    "Email verification failed.",
  );
}

export async function googleAuthLogin(
  googleIdToken: string,
): Promise<AuthTokenPayload> {
  return postJson<AuthTokenPayload>(
    "/auth/google/",
    { token: googleIdToken },
    "Google authentication failed.",
  );
}

export async function togglePostGem(
  postId: string,
): Promise<ToggleGemPayload> {
  return postAuthJson<ToggleGemPayload>(
    `/posts/${postId}/gem/`,
    "Failed to toggle gem.",
  );
}

export async function togglePostSave(
  postId: string,
): Promise<ToggleSavePayload> {
  return postAuthJson<ToggleSavePayload>(
    `/posts/${postId}/save/`,
    "Failed to toggle save.",
  );
}