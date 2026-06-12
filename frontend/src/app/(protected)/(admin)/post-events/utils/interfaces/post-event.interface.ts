export type PostEventReportStatus =
  | "not_submitted"
  | "submitted"
  | "accepted"
  | "rejected";

export interface PostEvent {
  id: number;
  proposalId?: number;
  clubId?: number;
  venueId?: number;
  name: string;
  description: string;
  clubName: string;
  clubType: string;
  leadName: string;
  venueName: string;
  eventDate: string;
  completedAt: string;
  reportDueAt: string;
  reportSubmittedAt: string;
  reportReviewedAt: string;
  status: "completed" | string;
  reportStatus: PostEventReportStatus;
  reportPdfUrl: string;
  reportAdminComment: string;
  daysLeft?: number;
  isOverdue: boolean;
}

export type PostEventFilterKey =
  | "all"
  | "not_submitted"
  | "submitted"
  | "accepted"
  | "rejected";

export interface PostEventFilter {
  key: PostEventFilterKey;
  label: string;
}
