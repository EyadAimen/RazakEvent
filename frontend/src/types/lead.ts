// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardData {
  leadName: string;
  clubLabel: string;
  clubType: "club" | "community";
  alert: string | null;
  events: ApiEvent[];
  totalEvents: number;
}

// ── Events list ───────────────────────────────────────────────────────────────

export interface ApiEvent {
  id: string;
  name: string;
  clubName: string;
  clubType: string;
  eventDate: string | null;
  attendees: number;
  status: string;
}

export type EventsTab =
  | "all"
  | "draft"
  | "submitted"
  | "approved"
  | "ongoing"
  | "completed"
  | "report_due"
  | "rejected";

// ── Event detail ──────────────────────────────────────────────────────────────

export interface VolunteerApplicant {
  applicationId: number;
  studentName: string;
  studentMatricId: string | null;
  appliedAt: string;
  status: "pending" | "accepted" | "rejected";
  roleName: string;
}

export interface EventDetail {
  id: string;
  name: string;
  clubName: string;
  clubType: string;
  eventDate: string | null;
  status: string;
  venueName: string | null;
  budget: number | null;
  proposalPdfUrl: string | null;
  adminComment: string | null;
  volunteeringStatus: "open" | "closed" | "full" | null;
  volunteers: VolunteerApplicant[];
}

// ── Propose event ─────────────────────────────────────────────────────────────

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

// ── My Club ───────────────────────────────────────────────────────────────────

export interface ClubOverview {
  id: number;
  name: string;
  type: "club" | "community";
  description: string;
  createdAt: string;
  memberCount: number;
  stats: { total: number; approved: number; rejected: number };
  pendingRequests: number;
}

export interface ClubMember {
  userId: string;
  fullName: string;
  staffOrMatricId: string | null;
  role: "lead" | "committee";
  joinedAt: string;
}

export interface MembershipRequest {
  id: number;
  studentName: string;
  studentMatricId: string | null;
  submittedAt: string;
  status: "pending";
}

export type ClubTab = "members" | "requests";
