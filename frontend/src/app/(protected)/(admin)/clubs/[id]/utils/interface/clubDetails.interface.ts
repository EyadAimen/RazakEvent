export interface ClubDetails {
  id: number;
  name: string;
  type: "club" | "community";
  description: string;
  leadId: string | null;
  createdAt: string;
  memberCount?: number;
}

export interface ClubMember {
  userId: string;
  fullName: string;
  staffOrMatricId: string | null;
  email: string | null;
  role: "LEADER" | "MEMBER";
  joinedAt: string;
}

export interface ClubEvent {
  id: number;
  name: string;
  description: string;
  eventDate: string;
  status: "approved" | "ongoing" | "completed" | "report_due";
  venueId: number;
}

export interface AvailableUser {
  id: string;
  fullName: string;
  email: string;
  staffOrMatricId: string | null;
}