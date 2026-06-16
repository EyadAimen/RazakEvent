export interface VolunteeringApplication {
  applicationId: string;
  eventId: string;
  eventName: string;
  eventDate: string | null;
  roleId: string;
  roleName: string;
  status: "pending" | "accepted" | "rejected";
  appliedAt: string;
  reviewedAt: string | null;
}

export interface MyApplicationsResponse {
  applications: VolunteeringApplication[];
}
