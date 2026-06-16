export type UserRole = "student" | "member" | "lead" | "admin" | string;

export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  staffOrMatricId: string;
  role: UserRole;
}

export interface ClubMembership {
  clubId: string;
  clubName: string;
  clubType: "club" | "community";
  role: "lead" | "member";
}

export interface ClubOption {
  id: string;
  name: string;
  type: "club" | "community";
}

export type LeadRequestStatus = "pending_lead" | "pending_admin" | "approved" | "rejected";

export interface LeadRoleRequest {
  id: string;
  status: LeadRequestStatus;
  submittedAt: string;
  club: { id: string; name: string } | null;
  student: { id: string; fullName: string; staffOrMatricId: string } | null;
}