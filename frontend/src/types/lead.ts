// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardData {
  leadName: string;
  clubLabel: string;
  clubType: "club" | "community";
  alert: string | null;
  reportDueEventId: string | null;
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
  userRole?: "lead" | "member";
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
  applicationId: string;
  studentName: string;
  studentMatricId: string | null;
  appliedAt: string;
  status: "pending" | "accepted" | "rejected";
  roleName: string;
  reason?: string;
  rejectionMessage?: string;
}

export interface VolunteerRole {
  roleId: string;
  roleName: string;
  description: string | null;
  slotsAvailable: number;
  slotsFilled: number;
}

export interface EventDetail {
  id: string;
  name: string;
  clubName: string;
  clubType: string;
  eventDate: string | null;
  status: string;
  venueId: string | null;
  venueName: string | null;
  description: string | null;
  budget: number | null;
  proposalPdfUrl: string | null;
  adminComment: string | null;
  volunteeringStatus: "open" | "closed" | "full" | null;
  volunteerRoles: VolunteerRole[];
  volunteers: VolunteerApplicant[];
}

// ── Propose event ─────────────────────────────────────────────────────────────

export interface Venue {
  id: string;
  name: string;
  location: string | null;
}

export interface CreateEventPayload {
  name: string;
  eventDate?: string;
  venueId?: string;
  description?: string;
  estimatedBudget?: number;
  status: "draft" | "submitted";
}

export interface BookedDate {
  eventId: string;
  name: string;
  eventDate: string;
  status: string;
}

// ── My Club ───────────────────────────────────────────────────────────────────

export interface ClubOverview {
  id: string;
  name: string;
  type: "club" | "community";
  description: string;
  createdAt?: string;
  memberCount: number;
  eventStats: { total: number; approved: number; rejected: number };
  pendingRequests: number;
}

export interface ApprovedClub {
  status: "approved";
  id: string;
  name: string;
  type: "club" | "community";
  description: string;
  leadId: string | null;
  memberCount: number;
  eventStats: { total: number; approved: number; rejected: number };
  pendingRequests: number;
  userRole: "lead" | "member";
}

export interface PendingClubItem {
  status: "pending" | "rejected";
  requestId: string;
  name: string;
  type: "club" | "community";
  description: string;
  category: string | null;
  submittedAt: string;
  adminComment: string | null;
}

export type ClubItem = ApprovedClub | PendingClubItem;

export interface ClubMember {
  userId: string;
  fullName: string;
  staffOrMatricId: string | null;
  role: "lead" | "committee";
  joinedAt: string;
}

export interface MembershipRequest {
  id: string;
  studentName: string;
  studentMatricId: string | null;
  submittedAt: string;
  status: "pending";
}

export type ClubTab = "members" | "requests" | "volunteers";

export interface ClubVolunteerApplication {
  applicationId: string;
  studentName: string;
  studentMatricId: string | null;
  eventId: string;
  eventName: string;
  roleId: string;
  roleName: string;
  slotsAvailable: number;
  status: "pending" | "accepted" | "rejected";
  appliedAt: string;
  reason: string | null;
  rejectionMessage: string | null;
}

