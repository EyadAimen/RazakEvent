export interface AdminClubSummary {
  id: string;
  name: string;
  type: "club" | "community";
  category: string | null;
  description: string;
  memberCount: number;
  createdAt: string;
  lead: { id: string; fullName: string; staffOrMatricId: string | null; email: string } | null;
}

export interface AdminClubRequest {
  id: string;
  clubName: string;
  clubType: "club" | "community";
  description: string;
  category: string | null;
  supportingLetterPath: string | null;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  student: { id: string; fullName: string; staffOrMatricId: string | null } | null;
}

export interface AdminClubDetail {
  id: string;
  name: string;
  type: "club" | "community";
  category: string | null;
  description: string;
  facultyAdvisor: string | null;
  objectives: string[];
  objectiveCount: number;
  createdAt: string;
  memberCount: number;
  eventCount: number;
  lead: { id: string; fullName: string; staffOrMatricId: string | null } | null;
}

export interface AdminClubMember {
  userId: string;
  fullName: string;
  staffOrMatricId: string | null;
  email: string;
  role: "lead" | "committee";
  joinedAt: string;
}

export interface AdminClubEvent {
  id: string;
  name: string;
  eventDate: string;
  status: string;
  venueName: string | null;
  volunteeringStatus: string;
}

export interface CreateOfficialClubPayload {
  name: string;
  type: "club" | "community";
  description: string;
  category: string;
  facultyAdvisor: string;
  objectives: string[];
}

export interface UpdateClubPayload {
  name?: string;
  description?: string;
  category?: string;
  facultyAdvisor?: string;
  objectives?: string[];
  leadId?: string | null;
}
