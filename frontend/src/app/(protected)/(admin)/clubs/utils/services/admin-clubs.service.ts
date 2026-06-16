import { apiFetchAuth } from "@/lib/api";
import type {
  AdminClubSummary, AdminClubRequest, AdminClubDetail,
  AdminClubMember, AdminClubEvent,
  CreateOfficialClubPayload, UpdateClubPayload,
} from "../interfaces/admin-clubs.interface";

export async function fetchAdminClubs(search?: string): Promise<AdminClubSummary[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  const { clubs } = await apiFetchAuth<{ clubs: AdminClubSummary[] }>(`/clubs/admin${qs}`);
  return clubs;
}

export async function fetchAdminPendingRequests(): Promise<AdminClubRequest[]> {
  const { requests } = await apiFetchAuth<{ requests: AdminClubRequest[] }>("/clubs/requests?status=pending");
  return requests;
}

export async function decideClubRequest(
  requestId: string,
  action: "approved" | "rejected",
  adminComment?: string,
): Promise<void> {
  await apiFetchAuth(`/clubs/requests/${requestId}/decision`, {
    method: "PATCH",
    body: JSON.stringify({ action, adminComment }),
  });
}

export async function createOfficialClub(payload: CreateOfficialClubPayload): Promise<{ clubId: string }> {
  return apiFetchAuth<{ clubId: string }>("/clubs/admin", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminClub(clubId: string): Promise<AdminClubDetail> {
  return apiFetchAuth<AdminClubDetail>(`/clubs/admin/${clubId}`);
}

export async function updateClub(clubId: string, payload: UpdateClubPayload): Promise<void> {
  await apiFetchAuth(`/clubs/admin/${clubId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function dissolveClub(clubId: string): Promise<void> {
  await apiFetchAuth(`/clubs/admin/${clubId}`, { method: "DELETE" });
}

export async function fetchAdminClubMembers(clubId: string): Promise<AdminClubMember[]> {
  const { members } = await apiFetchAuth<{ members: AdminClubMember[] }>(`/clubs/admin/${clubId}/members`);
  return members;
}

export async function removeAdminClubMember(clubId: string, userId: string): Promise<void> {
  await apiFetchAuth(`/clubs/admin/${clubId}/members/${userId}`, { method: "DELETE" });
}

export async function fetchAdminClubEvents(clubId: string): Promise<AdminClubEvent[]> {
  const { events } = await apiFetchAuth<{ events: AdminClubEvent[] }>(`/clubs/admin/${clubId}/events`);
  return events;
}
