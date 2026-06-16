import { apiFetch, apiFetchAuth } from "@/lib/api";
import { UserRecord, UserRole, ClubMembership, ClubOption } from "../interfaces/manage-roles.interface";

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

export async function fetchUserMemberships(userId: string): Promise<ClubMembership[]> {
  const res = await apiFetchAuth<{ success: boolean; data: ClubMembership[] }>(`/clubs/admin/users/${userId}/memberships`);
  return res.data;
}

export async function changeClubMemberRole(clubId: string, userId: string, role: "lead" | "member"): Promise<string> {
  const res = await apiFetchAuth<{ message: string }>(`/clubs/admin/${clubId}/members/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
  return res.message;
}

export async function fetchAllClubs(): Promise<ClubOption[]> {
  const res = await apiFetchAuth<ClubOption[]>("/clubs");
  return Array.isArray(res) ? res : (res as any).clubs ?? [];
}

export async function addUserToClub(clubId: string, userId: string): Promise<string> {
  const res = await apiFetchAuth<{ message: string }>(`/clubs/${clubId}/members`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  return res.message;
}

export async function fetchLeadRoleRequests(): Promise<import("../interfaces/manage-roles.interface").LeadRoleRequest[]> {
  const res = await apiFetchAuth<{ requests: import("../interfaces/manage-roles.interface").LeadRoleRequest[] }>("/requests/lead-role?status=pending_admin");
  return res.requests ?? [];
}

export async function decideLeadRoleRequest(id: string, action: "approved" | "rejected", adminComment?: string): Promise<string> {
  const res = await apiFetchAuth<{ message: string }>(`/requests/lead-role/${id}/admin-decision`, {
    method: "PATCH",
    body: JSON.stringify({ action, adminComment }),
  });
  return res.message;
}