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
  date: string;
  location: string;
  fill: string;
  spots: string;
}