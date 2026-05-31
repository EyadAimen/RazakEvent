export interface SharedEvent {
  id: number;
  name: string;
  description: string;
  eventDate: string;
  status: "approved" | "ongoing" | "completed" | "report_due";
  clubName: string;
}