export interface VolunteerRole {
  id: number;
  name: string;
  slotsAvailable: number;
  slotsFilled: number;
  remainingSlots: number;
}

export interface SharedEventDetail {
  id: string;
  name: string;
  description: string;
  clubName: string;
  clubType: string;
  eventDate: string | null;
  status: string;
  venueName: string | null;
  budget: number | null;
  proposalPdfUrl: string | null;
  adminComment: string | null;
  volunteeringStatus: "open" | "closed" | "full" | null;
  volunteerRoles: VolunteerRole[];
}