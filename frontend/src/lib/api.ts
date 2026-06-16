import { getAccessToken, getRefreshToken, setAccessToken, clearSession, refreshAccessToken } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      // Don't set Content-Type for FormData — browser sets it with the correct multipart boundary
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });

  // Try to parse JSON; fall back to empty object if body is empty
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, data.error ?? data.message ?? "An unexpected error occurred");
  }

  return data as T;
}

/** Same as apiFetch but automatically attaches the stored Bearer token.
 *  On 401, silently refreshes the access token and retries once. */
export async function apiFetchAuth<T>(path: string, init?: RequestInit): Promise<T> {
  const makeRequest = (token: string | null) => {
    const isFormData = init?.body instanceof FormData;
    return fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  };

  let res = await makeRequest(getAccessToken());

  if (res.status === 401) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const { accessToken: newToken } = await refreshAccessToken(refreshToken);
        setAccessToken(newToken);
        res = await makeRequest(newToken);
      } catch {
        clearSession();
        if (typeof window !== "undefined") window.location.replace("/login");
        throw new ApiError(401, "Session expired. Please log in again.");
      }
    } else {
      clearSession();
      if (typeof window !== "undefined") window.location.replace("/login");
      throw new ApiError(401, "Session expired. Please log in again.");
    }
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, data.error ?? data.message ?? "An unexpected error occurred");
  }

  return data as T;
}
