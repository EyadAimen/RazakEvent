export interface VolunteeringRecord {
  id: string;
  eventName: string;
  date: string;
  role: string;
  status: string;
}

export interface UpdateProfilePayload {
  fullName: string;
}
