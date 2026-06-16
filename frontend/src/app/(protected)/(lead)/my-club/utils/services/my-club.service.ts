import { apiFetchAuth } from "@/lib/api";
import type {
  ClubItem,
  ClubMember,
  MembershipRequest,
  ClubVolunteerApplication,
  LeadRoleIncomingRequest,
} from "@/types/lead";

// ── Reads ───────────────────────────────────────────────────────────────────

export async function fetchMyClubs(): Promise<ClubItem[]> {
  const { clubs } = await apiFetchAuth<{ clubs: ClubItem[] }>("/clubs/mine/all");
  return clubs;
}

export async function fetchClubMembers(clubId: string): Promise<ClubMember[]> {
  const { members } = await apiFetchAuth<{ members: ClubMember[] }>(`/clubs/mine/members?clubId=${clubId}`);
  return members;
}

// Read-only members list for clubs the user belongs to but does not lead
export async function fetchPublicClubMembers(clubId: string): Promise<ClubMember[]> {
  const { members } = await apiFetchAuth<{ members: ClubMember[] }>(`/clubs/${clubId}/members`);
  return members;
}

export async function fetchMembershipRequests(clubId: string): Promise<MembershipRequest[]> {
  const { requests } = await apiFetchAuth<{ requests: MembershipRequest[] }>(`/clubs/mine/membership-requests?clubId=${clubId}`);
  return requests;
}

export async function fetchClubVolApplications(clubId: string): Promise<ClubVolunteerApplication[]> {
  const { applications } = await apiFetchAuth<{ applications: ClubVolunteerApplication[] }>(`/volunteering/applications/club?clubId=${clubId}`);
  return applications;
}

export async function fetchIncomingLeadRequests(): Promise<LeadRoleIncomingRequest[]> {
  const { requests } = await apiFetchAuth<{ requests: LeadRoleIncomingRequest[] }>("/requests/lead-role/incoming");
  return requests;
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function decideMembershipRequest(
  requestId: string,
  clubId: string,
  decision: "approved" | "rejected",
  leadComment?: string,
): Promise<void> {
  await apiFetchAuth(`/clubs/mine/membership-requests/${requestId}/decision?clubId=${clubId}`, {
    method: "PATCH",
    body: JSON.stringify({ decision, ...(leadComment ? { leadComment } : {}) }),
  });
}

export async function decideVolApplication(
  applicationId: string,
  decision: "accepted" | "rejected",
  rejectionMessage?: string,
): Promise<void> {
  await apiFetchAuth(`/volunteering/applications/${applicationId}/decision`, {
    method: "PATCH",
    body: JSON.stringify({ decision, rejectionMessage }),
  });
}

export async function decideLeadRequest(
  requestId: string,
  action: "approved" | "rejected",
  comment?: string,
): Promise<void> {
  await apiFetchAuth(`/requests/lead-role/${requestId}/lead-decision`, {
    method: "PATCH",
    body: JSON.stringify({ action, ...(comment ? { comment } : {}) }),
  });
}

export async function removeClubMember(clubId: string, userId: string): Promise<void> {
  await apiFetchAuth(`/clubs/mine/members/${userId}?clubId=${clubId}`, { method: "DELETE" });
}

export async function resignAsLead(clubId: string): Promise<void> {
  await apiFetchAuth(`/clubs/mine/${clubId}/resign`, { method: "POST" });
}
