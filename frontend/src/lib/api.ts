import { getAccessToken } from "./auth";

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

/** Same as apiFetch but automatically attaches the stored Bearer token */
export async function apiFetchAuth<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  return apiFetch<T>(path, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
}
