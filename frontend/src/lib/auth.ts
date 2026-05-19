import { apiFetch } from "./api";

export type UserRole = "student" | "member" | "lead" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  matricNumber: string;
  role: UserRole;
  isApproved: boolean;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface SignupResponse {
  user: AuthUser;
}

// ── Token / session storage ────────────────────────────────────────────────────

export function saveSession(data: LoginResponse) {
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  saveUser(data.user);
}

export function clearSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

// ── User storage ───────────────────────────────────────────────────────────────

export function saveUser(user: AuthUser) {
  localStorage.setItem("user", JSON.stringify(user));
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

// ── Token accessors ────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
}

export function setAccessToken(token: string) {
  localStorage.setItem("accessToken", token);
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function loginUser(
  email: string,
  password: string
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  return apiFetch<{ accessToken: string }>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function logoutUser(accessToken: string): Promise<void> {
  await apiFetch<void>("/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function resendVerificationEmail(email: string): Promise<void> {
  await apiFetch<void>("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function signupUser(data: {
  name: string;
  email: string;
  password: string;
  matricNumber: string;
  role: UserRole;
}): Promise<SignupResponse> {
  return apiFetch<SignupResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
