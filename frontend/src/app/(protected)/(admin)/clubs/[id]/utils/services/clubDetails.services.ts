import { apiFetchAuth } from "@/lib/api";
import { ClubDetails } from "../interface/clubDetails.interface";

export async function fetchClubById(clubId: number): Promise<ClubDetails | null> {
  const response = await apiFetchAuth<{ clubs: ClubDetails[] }>("/clubs", {
    method: "GET",
  });

  const clubs = response.clubs ?? [];
  return clubs.find((club) => club.id === clubId) ?? null;
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

export async function fetchClubMembers(
  clubId: number
) {
  return await apiFetchAuth<{
    members: any[];
  }>(`/clubs/${clubId}/members`);
}