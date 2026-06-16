export interface ClubLeadInfo {
  id: string;
  fullName: string;
  staffOrMatricId?: string | null;
}

export interface ClubListItem {
  id: string;
  name: string;
  type: "club" | "community";
  description: string;

  leadId: string | null;

  lead?: {
    id: string;
    fullName: string;
    staffOrMatricId: string;
    email: string;
  } | null;

  memberCount: number;
  createdAt: string;
}

export interface ClubRequestStudent {
  id: string;
  fullName: string;
  staffOrMatricId: string;
}

export interface ClubRequestItem {
  id: string;
  clubName: string;
  clubType: "club" | "community";
  description: string;
  status: "pending" | "approved" | "rejected";
  adminComment?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  student: ClubRequestStudent | null;
}

export interface ClubsListResponse {
  clubs: ClubListItem[];
}

export interface ClubRequestsResponse {
  requests: ClubRequestItem[];
}

export interface ClubDecisionResponse {
  message: string;
}
