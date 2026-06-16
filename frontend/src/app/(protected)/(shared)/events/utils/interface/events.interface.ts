export interface SharedEvent {
  id: string;
  name: string;
  description: string;
  eventDate: string;
  status: "approved";
  clubName: string;
  venueName?: string | null;
}

export interface SharedEventDetail extends SharedEvent {
  venueName: string | null;
  volunteeringStatus: "open" | "closed" | "full" | null;
  hasApplied?: boolean;
  canVolunteer?: boolean;
  volunteerRoles: {
    id: string;
    name: string;
    slotsAvailable: number;
    slotsFilled: number;
    remainingSlots: number;
  }[];
}