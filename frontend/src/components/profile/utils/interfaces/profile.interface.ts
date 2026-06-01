export interface VolunteeringRecord {
  id: number;
  eventName: string;
  date: string;
  role: string;
  status: string;
}

export interface UpdateProfilePayload {
  fullName: string;
}
