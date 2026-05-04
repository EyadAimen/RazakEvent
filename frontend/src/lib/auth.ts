import { apiFetch } from "./api";

export type UserRole = "student" | "member" | "lead";

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

// ── Token storage ─────────────────────────────────────────────────────────────

export function saveSession(tokens: Pick<LoginResponse, "accessToken" | "refreshToken">) {
  localStorage.setItem("accessToken", tokens.accessToken);
  localStorage.setItem("refreshToken", tokens.refreshToken);
}

export function clearSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
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
