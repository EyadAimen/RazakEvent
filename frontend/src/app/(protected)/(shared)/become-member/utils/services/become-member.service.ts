import { apiFetchAuth } from "@/lib/api";
import type { Club, MembershipRequest, LeadRoleRequest } from "../interfaces/become-member.interface";

export async function fetchClubs(): Promise<Club[]> {
  const res = await apiFetchAuth<Club[]>("/clubs");
  return Array.isArray(res) ? res : [];
}

export async function fetchMyMembershipRequests(): Promise<MembershipRequest[]> {
  const res = await apiFetchAuth<{ requests: MembershipRequest[] }>("/requests/membership/mine");
  return res.requests ?? [];
}

export async function fetchMyLeadRequest(): Promise<LeadRoleRequest | null> {
  const res = await apiFetchAuth<{ request: LeadRoleRequest | null }>("/requests/lead-role/mine");
  return res.request ?? null;
}

export async function submitMembershipRequest(clubId: string): Promise<string> {
  const res = await apiFetchAuth<{ message: string }>("/requests/membership", {
    method: "POST",
    body: JSON.stringify({ clubId }),
  });
  return res.message;
}

export async function submitLeadRoleRequest(clubId: string): Promise<string> {
  const res = await apiFetchAuth<{ message: string }>("/requests/lead-role", {
    method: "POST",
    body: JSON.stringify({ clubId }),
  });
  return res.message;
}

export async function createClubRequest(data: {
  clubName: string;
  clubType: "club" | "community";
  description: string;
  category: string;
  supportingLetter?: File | null;
}): Promise<string> {
  const form = new FormData();
  form.append("clubName", data.clubName);
  form.append("clubType", data.clubType);
  form.append("description", data.description);
  form.append("category", data.category);
  if (data.supportingLetter) form.append("supportingLetter", data.supportingLetter);

  const res = await apiFetchAuth<{ message: string }>("/clubs/requests", {
    method: "POST",
    body: form,
  });
  return res.message ?? "Club request submitted successfully.";
}
