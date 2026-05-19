import { apiFetchAuth } from "@/lib/api";
import type { VolunteeringRecord, UpdateProfilePayload } from "../interfaces/profile.interface";
import type { ClubOverview } from "@/types/lead";
import type { AuthUser } from "@/lib/auth";

export async function fetchLeadClub(): Promise<ClubOverview> {
  return apiFetchAuth<ClubOverview>("/clubs/mine");
}

export async function fetchVolunteeringHistory(): Promise<VolunteeringRecord[]> {
  return apiFetchAuth<VolunteeringRecord[]>("/volunteering/history");
}

export async function updateProfileName(payload: UpdateProfilePayload): Promise<{ user: AuthUser; message: string }> {
  const res = await apiFetchAuth<{ data: AuthUser; message: string }>("/users/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return { user: res.data, message: res.message };
}

