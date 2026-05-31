import { apiFetchAuth } from "@/lib/api";
import { ClubDetails } from "../interface/clubDetails.interface";

export async function fetchClubById(
  clubId: number
): Promise<ClubDetails | null> {
  const response = await apiFetchAuth<{ clubs: ClubDetails[] }>("/clubs", {
    method: "GET",
  });

  const clubs = response.clubs ?? [];
  return clubs.find((club) => club.id === clubId) ?? null;
}

export async function fetchClubMembers(clubId: number) {
  return await apiFetchAuth<{ members: any[] }>(`/clubs/${clubId}/members`, {
    method: "GET",
  });
}

export async function fetchClubEvents(clubId: number) {
  return await apiFetchAuth<{ events: any[] }>(`/clubs/${clubId}/events`, {
    method: "GET",
  });
}

export async function fetchAvailableUsers(search: string) {
  return await apiFetchAuth<{ users: any[] }>(
    `/clubs/users/available?search=${encodeURIComponent(search)}`,
    { method: "GET" }
  );
}

export async function addClubMember(clubId: number, userId: string) {
  return await apiFetchAuth(`/clubs/${clubId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
}

export async function removeClubMember(clubId: number, userId: string) {
  return await apiFetchAuth(`/clubs/${clubId}/members/${userId}`, {
    method: "DELETE",
  });
}

export async function changeClubLead(clubId: number, newLeadId: string) {
  return await apiFetchAuth(`/clubs/${clubId}/lead`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newLeadId }),
  });
}

export async function updateApprovedEvent(
  eventId: number,
  data: {
    name: string;
    description: string;
    eventDate: string;
    venueId: number;
  }
) {
  return await apiFetchAuth(`/events/admin/${eventId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteApprovedEvent(eventId: number) {
  return await apiFetchAuth(`/events/admin/${eventId}`, {
    method: "DELETE",
  });
}

export async function updateClubDetails(
  clubId: number,
  data: {
    name: string;
    type: "club" | "community";
    description: string;
  }
) {
  return await apiFetchAuth(`/clubs/${clubId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function createApprovedEvent(data: {
  clubId: number;
  venueId: number;
  name: string;
  description: string;
  eventDate: string;
  estimatedBudget: number;
}) {
  return await apiFetchAuth(`/events/admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteClubById(
  clubId: number,
  deleteReason: string
): Promise<{ message: string }> {
  return await apiFetchAuth<{ message: string }>(`/clubs/${clubId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deleteReason }),
  });
}