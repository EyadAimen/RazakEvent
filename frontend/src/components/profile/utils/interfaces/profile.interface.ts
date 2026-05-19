export interface LeadClub {
  id: number;
  name: string;
  type: "club" | "community";
  createdAt: string;
  stats: {
    total: number;
  };
}

export interface VolunteeringRecord {
  id: string;
  eventName: string;
  date: string;
  role: string;
  status: string;
}

export interface UpdateProfilePayload {
  name: string;
}
