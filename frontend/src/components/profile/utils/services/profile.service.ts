import { apiFetchAuth } from "@/lib/api";
import type { LeadClub, VolunteeringRecord, UpdateProfilePayload } from "../interfaces/profile.interface";

export async function fetchLeadClub(): Promise<LeadClub> {
  return apiFetchAuth<LeadClub>("/clubs/mine");
}

export async function fetchVolunteeringHistory(): Promise<VolunteeringRecord[]> {
  return apiFetchAuth<VolunteeringRecord[]>("/student/volunteering/history");
}

export async function updateProfileName(payload: UpdateProfilePayload): Promise<void> {
  await apiFetchAuth<void>("/users/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

