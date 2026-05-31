import { apiFetchAuth } from "@/lib/api";
import type { VolunteeringRecord, UpdateProfilePayload } from "../interfaces/profile.interface";
import type { ClubItem } from "@/types/lead";
import type { AuthUser } from "@/lib/auth";

export async function fetchLeadClubs(): Promise<ClubItem[]> {
  const { clubs } = await apiFetchAuth<{ clubs: ClubItem[] }>("/clubs/mine/all");
  return clubs;
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

