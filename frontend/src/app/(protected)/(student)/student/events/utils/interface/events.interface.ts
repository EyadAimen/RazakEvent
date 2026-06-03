export interface SharedEvent {
  id: number;
  name: string;
  description: string;
  eventDate: string;
  status: "approved" | "ongoing" | "completed" | "report_due";
  clubName: string;
}

export interface SharedEventDetail extends SharedEvent {
  venueName: string | null;
  budget: number | null;
  proposalPdfUrl: string | null;
  adminComment: string | null;
  volunteeringStatus: "open" | "closed" | "full" | null;
  hasApplied?: boolean;
  volunteerRoles: {
    id: number;
    name: string;
    slotsAvailable: number;
    slotsFilled: number;
    remainingSlots: number;
  }[];
}