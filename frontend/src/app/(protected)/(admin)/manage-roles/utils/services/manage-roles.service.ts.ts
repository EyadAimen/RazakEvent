import { apiFetch } from "@/lib/api";
import { UserRecord, UserRole } from "../interfaces/manage-roles.interface";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken") || localStorage.getItem("token") || localStorage.getItem("jwt");
}

export async function fetchUserRoles(): Promise<UserRecord[]> {
  const token = getAccessToken();
  const result = await apiFetch<any>("/users", {
    method: "GET",
    headers: token ? { "Authorization": `Bearer ${token}` } : {}
  });

  return result.data || (Array.isArray(result) ? result : []);
}

export async function updateUserRole(userId: string, roleValue: UserRole): Promise<string> {
  const token = getAccessToken();
  const res = await apiFetch<{ message: string }>(`/users/${userId}/role`, {
    method: "PATCH",
    headers: token ? { "Authorization": `Bearer ${token}` } : {},
    body: JSON.stringify({ role: roleValue })
  });
  return res.message;
}