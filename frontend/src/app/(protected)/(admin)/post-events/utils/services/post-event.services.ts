"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  PostEvent,
  PostEventFilter,
  PostEventFilterKey,
  PostEventReportStatus,
} from "../interfaces/post-event.interface";

export const POST_EVENT_FILTERS: PostEventFilter[] = [
  { key: "all", label: "All" },
  { key: "not_submitted", label: "Awaiting Report" },
  { key: "submitted", label: "Submitted" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
];

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

function authHeaders(): HeadersInit {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDate(value?: string | null): string {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString();
}

function getReportStatus(item: any): PostEventReportStatus {
  if (item.eventReport && item.moneyReport) {
    return String(item.eventReport.status || item.moneyReport.status || "submitted").toLowerCase() as PostEventReportStatus;
  }

  if (item.completionReportPdfUrl && item.financialReportPdfUrl) return "submitted";
  if (item.reportStatus) return String(item.reportStatus).toLowerCase() as PostEventReportStatus;
  return "not_submitted";
}

function getDueDate(completedAt?: string | null): string | null {
  if (!completedAt) return null;
  const dueDate = new Date(completedAt);
  dueDate.setDate(dueDate.getDate() + 14);
  return dueDate.toISOString();
}

function getDaysLeft(completedAt?: string | null): number | undefined {
  const dueDateValue = getDueDate(completedAt);
  if (!dueDateValue) return undefined;

  const today = new Date();
  const dueDate = new Date(dueDateValue);
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  return Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getReadableReportStatus(reportStatus: string): string {
  const map: Record<string, string> = {
    not_submitted: "Awaiting Report",
    submitted: "Report Submitted",
    accepted: "Report Accepted",
    rejected: "Report Rejected",
  };

  return map[reportStatus] || reportStatus.replaceAll("_", " ");
}

export function getPdfUrl(url?: string): string {
  if (!url) return "";
  return url.startsWith("http") ? url : `http://localhost:5000${url}`;
}

function normalizePostEvent(item: any): PostEvent {

  const completedAtValue = item.completedAt || item.completed_at || null;
  const reportDueAtValue = item.reportDueAt || item.report_due_at || getDueDate(completedAtValue);
  const reportStatus = getReportStatus(item);
  const daysLeft = typeof item.daysLeft === "number" ? item.daysLeft : getDaysLeft(completedAtValue);

  return {
    id: Number(item.id),
    proposalId: item.proposalId ? Number(item.proposalId) : undefined,
    clubId: item.clubId ? Number(item.clubId) : undefined,
    venueId: item.venueId ? Number(item.venueId) : undefined,
    name: item.name || item.eventName || "Untitled Event",
    description: item.description || "No description provided.",
    clubName: item.clubName || "Unknown Club",
    clubType: item.clubType || "club",
    leadName: item.leadName || item.requesterName || "Unknown Lead",
    venueName: item.venueName || "No venue assigned",
    eventDate: formatDate(item.eventDate),
    completedAt: formatDate(completedAtValue),
    reportDueAt: formatDate(reportDueAtValue),
    reportSubmittedAt: formatDate(item.reportSubmittedAt || item.report_submitted_at),
    reportReviewedAt: formatDate(item.reportReviewedAt || item.report_reviewed_at),
    status: (item.status || "completed").toLowerCase(),
    reportStatus,
    reportPdfUrl: item.reportPdfUrl || item.completionReportPdfUrl || "",
    reportAdminComment: item.reportAdminComment || "",
    daysLeft,
    isOverdue: typeof item.isOverdue === "boolean" ? item.isOverdue : typeof daysLeft === "number" && daysLeft < 0,
    completionReportPdfUrl: item.completionReportPdfUrl || item.eventReport?.url || "",
    financialReportPdfUrl: item.financialReportPdfUrl || item.moneyReport?.url || "",
  };
}

async function fetchPostEvents(): Promise<PostEvent[]> {
  const rawData = await apiFetch<any>("/events/admin/post-events", {
    method: "GET",
    headers: authHeaders(),
  });

  const recordsArray = Array.isArray(rawData) ? rawData : rawData.events || rawData.data || [];
  return recordsArray.map(normalizePostEvent);
}

async function patchReportDecision(
  id: number,
  decision: "accepted" | "rejected",
  adminComment?: string
): Promise<void> {
  await apiFetch<void>(`/events/admin/post-events/${id}/decision`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ decision, adminComment }),
  });
}

export function usePostEvents() {
  const [postEvents, setPostEvents] = useState<PostEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<PostEventFilterKey>("all");
  const [selectedEvent, setSelectedEvent] = useState<PostEvent | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [errorContext, setErrorContext] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setErrorContext(null);
      const data = await fetchPostEvents();
      setPostEvents(data);
    } catch (err: any) {
      console.error("Failed to load post events:", err);
      setErrorContext(err.message || "Could not load post events.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleReportDecision = async (
    id: number,
    decision: "accepted" | "rejected",
    adminComment?: string
  ) => {
    try {
      setActionLoading(true);
      setErrorContext(null);
      await patchReportDecision(id, decision, adminComment);

      const nextReportStatus: PostEventReportStatus = decision;

      setPostEvents((prev) =>
        prev.map((event) =>
          event.id === id
            ? { ...event, reportStatus: nextReportStatus, reportAdminComment: adminComment || event.reportAdminComment }
            : event
        )
      );

      setSelectedEvent((prev) =>
        prev && prev.id === id
          ? { ...prev, reportStatus: nextReportStatus, reportAdminComment: adminComment || prev.reportAdminComment }
          : prev
      );

      setIsDrawerOpen(false);
      setSelectedEvent(null);
    } catch (err: any) {
      console.error(`Failed to update post event ${id}:`, err);
      setErrorContext(err.message || "Failed to update completion report.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPostEvents = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    return postEvents.filter((event) => {
      const matchesFilter = activeFilter === "all" || event.reportStatus === activeFilter;
      const matchesSearch =
        event.name.toLowerCase().includes(search) ||
        event.clubName.toLowerCase().includes(search) ||
        event.leadName.toLowerCase().includes(search);

      return matchesFilter && matchesSearch;
    });
  }, [postEvents, activeFilter, searchQuery]);

  const openDrawer = (event: PostEvent) => {
    setSelectedEvent(event);
    setIsDrawerOpen(true);
    setErrorContext(null);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedEvent(null);
    setErrorContext(null);
  };

  const openRejectionModal = () => {
    setIsRejectionModalOpen(true);
  };

  const closeRejectionModal = () => {
    setIsRejectionModalOpen(false);
    setRejectionReason("");
  };

  const submitSelectedRejection = () => {
    if (!selectedEvent) return;

    if (!rejectionReason.trim()) {
      alert("Please write a rejection reason.");
      return;
    }

    handleReportDecision(selectedEvent.id, "rejected", rejectionReason.trim());
    closeRejectionModal();
  };

  const acceptSelectedReport = () => {
    if (!selectedEvent) return;
    handleReportDecision(selectedEvent.id, "accepted", `Completion report accepted for ${selectedEvent.name}.`);
  };

  return {
    loading,
    errorContext,
    postEvents,
    filteredPostEvents,
    searchQuery,
    activeFilter,
    selectedEvent,
    isDrawerOpen,
    isRejectionModalOpen,
    rejectionReason,
    actionLoading,
    filters: POST_EVENT_FILTERS,
    setSearchQuery,
    setActiveFilter,
    setRejectionReason,
    openDrawer,
    closeDrawer,
    openRejectionModal,
    closeRejectionModal,
    submitSelectedRejection,
    acceptSelectedReport,
    getReadableReportStatus,
    getPdfUrl,
    reload: loadData,
  };
}
