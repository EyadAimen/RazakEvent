export interface DashboardData {
  leadName: string;
  clubLabel: string;
  clubType: "club" | "community";
  alert: string | null;
  events: ApiEvent[];
  totalEvents: number;
}

export interface ApiEvent {
  id: string;
  name: string;
  clubName: string;
  clubType: string;
  eventDate: string | null;
  attendees: number;
  status: string;
}

export interface Venue {
  id: number;
  name: string;
  location: string | null;
}

export interface CreateEventPayload {
  name: string;
  eventDate?: string;
  venueId?: number;
  description?: string;
  estimatedBudget?: number;
  status: "draft" | "submitted";
}
