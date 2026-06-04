export interface VolunteerRole {
  id: number;
  name: string;
  description?: string | null;
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
  volunteeringStatus: "open" | "closed" | "full" | null;
  hasApplied?: boolean;
  canVolunteer?: boolean;
  volunteerRoles: VolunteerRole[];
}