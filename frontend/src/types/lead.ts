export interface DashboardData {
  leadName: string;
  clubLabel: string;
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
