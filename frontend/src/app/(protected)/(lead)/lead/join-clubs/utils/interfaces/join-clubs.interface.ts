export interface Club {
  id: number;
  name: string;
  type: "club" | "community";
  description: string;
  category: string | null;
  lead: { id: string; fullName: string } | null;
  memberCount: number;
}

export interface MembershipRequest {
  id: number;
  clubId: number;
  clubName: string | null;
  status: "pending" | "approved" | "rejected";
  leadComment: string | null;
  submittedAt: string;
}
