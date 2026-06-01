export interface VolunteeringApplication {
  applicationId: number;
  eventId: number;
  eventName: string;
  eventDate: string | null;
  roleId: number;
  roleName: string;
  status: "pending" | "accepted" | "rejected";
  appliedAt: string;
  reviewedAt: string | null;
}

export interface MyApplicationsResponse {
  applications: VolunteeringApplication[];
}
