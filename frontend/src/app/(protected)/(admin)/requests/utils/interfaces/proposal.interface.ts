export type ProposalCategory = "CLUB" | "COMMUNITY";
export type ProposalStatus = "pending" | "approved" | "rejected" | "draft" | string;

export interface Proposal {
  id: number;
  leadId?: string;
  clubId?: number;
  adminId?: string;
  venueId?: number;
  eventName: string;
  description: string;
  requesterName: string;
  category: ProposalCategory;
  status: ProposalStatus;
  estimatedBudget: string;
  proposedDate: string;
  docAttached?: string;
  adminComment?: string;
  proposalPdfUrl?: string;
  clubName?: string;
  clubType?: string;
  venueName?: string;
}