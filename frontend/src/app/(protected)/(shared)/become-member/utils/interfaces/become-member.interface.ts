export interface Club {
  id: string;
  name: string;
  type: "club" | "community";
  description: string;
  category: string | null;
  lead: { id: string; fullName: string } | null;
  memberCount: number;
}

export interface MembershipRequest {
  id: string;
  clubId: string;
  clubName: string | null;
  status: "pending" | "approved" | "rejected";
  leadComment: string | null;
  submittedAt: string;
}

export interface LeadRoleRequest {
  id: string;
  clubId: string;
  status: "pending_lead" | "pending_admin" | "approved" | "rejected";
  leadComment: string | null;
  adminComment: string | null;
  submittedAt: string;
}
