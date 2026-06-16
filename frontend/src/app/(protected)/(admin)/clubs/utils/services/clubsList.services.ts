import { apiFetchAuth } from "@/lib/api";
import type {
  ClubDecisionResponse,
  ClubListItem,
  ClubRequestItem,
  ClubRequestsResponse,
  ClubsListResponse,
} from "../interface/clubsList.interface";

export async function fetchAdminClubsDashboard(): Promise<ClubListItem[]> {
  const response = await apiFetchAuth<ClubsListResponse>("/clubs", {
    method: "GET",
  });

  return response.clubs ?? [];
}

export async function fetchPendingClubRequests(): Promise<ClubRequestItem[]> {
  const response = await apiFetchAuth<ClubRequestsResponse>("/clubs/requests?status=pending", {
    method: "GET",
  });

  return response.requests ?? [];
}

export async function submitClubRequestDecision(
  requestId: string,
  action: "approved" | "rejected",
  adminComment?: string,
): Promise<ClubDecisionResponse> {
  return apiFetchAuth<ClubDecisionResponse>(`/clubs/requests/${requestId}/decision`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action,
      adminComment,
    }),
  });
}

export async function deleteClubById(
  clubId: string,
  deleteReason: string
): Promise<{ message: string }> {
  return await apiFetchAuth<{ message: string }>(`/clubs/${clubId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deleteReason,
    }),
  });
}