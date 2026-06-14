import { apiFetchAuth } from "@/lib/api";
import type { Club, MembershipRequest } from "../interfaces/join-clubs.interface";

export async function fetchAllClubs(): Promise<Club[]> {
  const res = await apiFetchAuth<{ clubs: Club[] }>("/clubs");
  return res.clubs ?? [];
}

export async function fetchMyMembershipRequests(): Promise<MembershipRequest[]> {
  const res = await apiFetchAuth<{ requests: MembershipRequest[] }>("/requests/membership/mine");
  return res.requests ?? [];
}

export async function submitMembershipRequest(clubId: number): Promise<string> {
  const res = await apiFetchAuth<{ message: string }>("/requests/membership", {
    method: "POST",
    body: JSON.stringify({ clubId }),
  });
  return res.message;
}
