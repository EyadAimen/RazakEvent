export interface AdminEventDetail {
  id: string;
  name: string;
  description: string;
  clubName: string;
  eventDate: string | null;
  status: string;
  venueName: string | null;
  budget: number | null;
  proposalPdfUrl: string | null;
  adminComment: string | null;
}