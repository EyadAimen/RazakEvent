// app/(protected)/(admin)/requests/util/interfaces/proposal.interface.ts
export type ProposalCategory = "CLUB" | "COMMUNITY";
export type ProposalStatus = "pending" | "approved" | "rejected" | "draft" | string;

export interface Proposal {
  id: number;
  eventName: string;
  description: string;
  requesterName: string;
  category: ProposalCategory;
  status: ProposalStatus;
  estimatedBudget: string;
  proposedDate: string;
  docAttached?: string;
}