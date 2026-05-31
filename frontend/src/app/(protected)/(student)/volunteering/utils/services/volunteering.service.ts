import { apiFetchAuth } from "@/lib/api";

export interface VolunteeringApplication {
  applicationId: number;
  eventId: number;
  eventName: string;
  eventDate: string | null;
  roleId: number;
  roleName: string;
  status: "pending" | "accepted" | "rejected" | "dropped";
  appliedAt: string;
  reviewedAt: string | null;
}

export interface MyApplicationsResponse {
  applications: VolunteeringApplication[];
}

export async function fetchMyVolunteeringApplications(): Promise<MyApplicationsResponse> {
  return apiFetchAuth<MyApplicationsResponse>("/volunteering/applications/mine");
}
