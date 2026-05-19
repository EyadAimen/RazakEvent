"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Wallet,
  Download,
  FileText,
  Check,
  X,
  Loader2,
} from "lucide-react";
import Badge, { BadgeVariant } from "@/components/shared/Badge/Badge";
import DeadlineAlert from "@/components/shared/DeadlineAlert/DeadlineAlert";
import { apiFetchAuth } from "@/lib/api";
import type { EventDetail, VolunteerApplicant } from "@/types/lead";
import styles from "./page.module.css";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { variant: BadgeVariant; label: string }> = {
  draft:      { variant: "draft",         label: "Draft"      },
  submitted:  { variant: "pending-admin", label: "Submitted"  },
  approved:   { variant: "approved",      label: "Approved"   },
  ongoing:    { variant: "ongoing",       label: "Ongoing"    },
  completed:  { variant: "completed",     label: "Completed"  },
  report_due: { variant: "report-due",    label: "Report Due" },
  rejected:   { variant: "rejected",      label: "Rejected"   },
};

const LIVE_STATUSES = new Set(["approved", "ongoing", "completed", "report_due"]);

const APP_BADGE: Record<VolunteerApplicant["status"], { variant: BadgeVariant; label: string }> = {
  pending:  { variant: "pending",  label: "Pending"  },
  accepted: { variant: "approved", label: "Accepted" },
  rejected: { variant: "rejected", label: "Rejected" },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeadEventDetailPage() {
  const params  = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent]         = useState<EventDetail | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [togglingVol, setTogglingVol]   = useState(false);
  const [decidingApp, setDecidingApp]   = useState<number | null>(null);

  useEffect(() => {
    apiFetchAuth<{ event: EventDetail }>(`/events/${eventId}`)
      .then(d => setEvent(d.event))
      .catch(err => setError(err.message ?? "Failed to load event"))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleToggleVolunteering = async () => {
    if (!event || togglingVol || event.volunteeringStatus === "full") return;
    const newStatus = event.volunteeringStatus === "open" ? "closed" : "open";
    setTogglingVol(true);
    try {
      await apiFetchAuth(`/events/${eventId}/volunteering`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setEvent(prev => prev ? { ...prev, volunteeringStatus: newStatus } : prev);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update volunteering status";
      alert(msg);
    } finally {
      setTogglingVol(false);
    }
  };

  const handleDecideApplication = async (applicationId: number, decision: "accepted" | "rejected") => {
    if (!event || decidingApp !== null) return;
    setDecidingApp(applicationId);
    try {
      await apiFetchAuth(`/events/${eventId}/volunteers/${applicationId}/decision`, {
        method: "PATCH",
        body: JSON.stringify({ decision }),
      });
      setEvent(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          volunteers: prev.volunteers.map(v =>
            v.applicationId === applicationId ? { ...v, status: decision } : v
          ),
        };
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update application";
      alert(msg);
    } finally {
      setDecidingApp(null);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.loadingState}>
            <Loader2 size={32} className={styles.spinner} />
            <p>Loading event…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.errorState}>
            <p>⚠ {error ?? "Event not found."}</p>
            <Link href="/lead/events" className={styles.backLink}>
              <ArrowLeft size={14} /> Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Derived display values ────────────────────────────────────────────────

  const { variant: statusVariant, label: statusLabel } =
    STATUS_MAP[event.status] ?? { variant: "draft" as BadgeVariant, label: event.status };

  const isLive          = LIVE_STATUSES.has(event.status);
  const showDeadline    = event.status === "report_due";
  const showReportBtn   = event.status === "report_due" || event.status === "completed";

  const formattedDate = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString("en-MY", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "TBD";

  const volOpen   = event.volunteeringStatus === "open";
  const volFull   = event.volunteeringStatus === "full";
  const volClosed = event.volunteeringStatus === "closed";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <div className={styles.body}>
        <div className={styles.inner}>

          {/* Deadline alert */}
          {showDeadline && (
            <DeadlineAlert
              message="Post-Event Reports Due! Submit your event and money reports as soon as possible."
              ctaLabel="Submit Reports"
              onCta={() => {
                document.getElementById("report-section")?.scrollIntoView({ behavior: "smooth" });
              }}
            />
          )}

          {/* Back link */}
          <Link href="/lead/events" className={styles.backLink}>
            <ArrowLeft size={14} />
            Back to Events
          </Link>

          {/* ── Event info card ────────────────────────────────────────────── */}
          <div className={styles.card}>
            <div className={styles.cardTop}>
              <div>
                <span className={styles.clubTag}>{event.clubName}</span>
                <h1 className={styles.eventTitle}>{event.name}</h1>
              </div>
              <Badge label={statusLabel} variant={statusVariant} />
            </div>

            <div className={styles.metaRow}>
              <span className={styles.metaItem}>
                <Calendar size={14} />
                {formattedDate}
              </span>
              {event.venueName && (
                <span className={styles.metaItem}>
                  <MapPin size={14} />
                  {event.venueName}
                </span>
              )}
              {event.budget !== null && (
                <span className={styles.metaItem}>
                  <Wallet size={14} />
                  RM {event.budget.toLocaleString()}
                </span>
              )}
            </div>

            {event.adminComment && (
              <div className={styles.adminComment}>
                <strong>Admin note:</strong> {event.adminComment}
              </div>
            )}

            <div className={styles.cardActions}>
              {event.proposalPdfUrl && (
                <a
                  href={event.proposalPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.actionSecondary}
                >
                  <Download size={14} />
                  View Proposal PDF
                </a>
              )}
              {showReportBtn && (
                <button id="report-section" className={styles.actionPrimary}>
                  <FileText size={14} />
                  Submit Report
                </button>
              )}
            </div>
          </div>

          {/* ── Volunteering Settings ──────────────────────────────────────── */}
          {isLive && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Volunteering Settings</h2>

              <div className={styles.volCard}>
                {/* Toggle row */}
                <div className={styles.volToggleRow}>
                  <div>
                    <p className={styles.volToggleLabel}>Volunteering Status</p>
                    <p className={styles.volToggleDesc}>
                      {volOpen  ? "Applications are currently open"    :
                       volFull  ? "All volunteer slots are filled"      :
                                  "Applications are currently closed"}
                    </p>
                  </div>
                  <button
                    className={`${styles.toggleBtn} ${
                      volOpen  ? styles.toggleOpen   :
                      volFull  ? styles.toggleFull   :
                                 styles.toggleClosed
                    }`}
                    onClick={handleToggleVolunteering}
                    disabled={togglingVol || volFull}
                  >
                    {togglingVol ? <Loader2 size={13} className={styles.spinnerSm} /> : null}
                    {volOpen ? "Open" : volFull ? "Full" : "Closed"}
                  </button>
                </div>

                {/* Applications table */}
                {event.volunteers.length > 0 && (
                  <div className={styles.applicantsSection}>
                    <h3 className={styles.applicantsTitle}>Pending Applications</h3>
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Student ID</th>
                            <th>Date Applied</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {event.volunteers.map(app => {
                            const badge = APP_BADGE[app.status];
                            return (
                              <tr key={app.applicationId}>
                                <td>{app.studentName}</td>
                                <td>{app.studentMatricId ?? "—"}</td>
                                <td>
                                  {new Date(app.appliedAt).toLocaleDateString("en-MY", {
                                    year: "numeric", month: "short", day: "numeric",
                                  })}
                                </td>
                                <td>
                                  <Badge label={badge.label} variant={badge.variant} />
                                </td>
                                <td>
                                  {app.status === "pending" && (
                                    <div className={styles.appActions}>
                                      <button
                                        className={styles.acceptBtn}
                                        onClick={() => handleDecideApplication(app.applicationId, "accepted")}
                                        disabled={decidingApp === app.applicationId}
                                      >
                                        <Check size={12} /> Accept
                                      </button>
                                      <button
                                        className={styles.rejectBtn}
                                        onClick={() => handleDecideApplication(app.applicationId, "rejected")}
                                        disabled={decidingApp === app.applicationId}
                                      >
                                        <X size={12} /> Reject
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {!volClosed && event.volunteers.length === 0 && (
                  <p className={styles.noApplicants}>No volunteer applications yet.</p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
