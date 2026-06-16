"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Award, Loader2, CheckCircle2 } from "lucide-react";
import Triangle from "@/components/shared/triangle/triangle";
import { apiFetchAuth } from "@/lib/api";
import { getUser } from "@/lib/auth";
import type { ApiEvent } from "@/types/lead";
import styles from "./certificates.module.css";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CertVolunteer {
  applicationId: string;
  userId: string;
  name: string;
  studentMatricId: string | null;
  roleName: string;
  hasCertificate: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleDateString("en-MY", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeadCertificatesPage() {
  const router = useRouter();

  const [events,         setEvents]         = useState<ApiEvent[]>([]);
  const [loadingEvents,  setLoadingEvents]  = useState(true);

  const [selectedEvent,  setSelectedEvent]  = useState<ApiEvent | null>(null);
  const [volunteers,     setVolunteers]     = useState<CertVolunteer[]>([]);
  const [loadingVols,    setLoadingVols]    = useState(false);

  const [selected,       setSelected]       = useState<Set<string>>(new Set());
  const [issuing,        setIssuing]        = useState(false);
  const [issueSuccess,   setIssueSuccess]   = useState<string | null>(null);
  const [issueError,     setIssueError]     = useState<string | null>(null);

  // ── Guard: lead only ────────────────────────────────────────────────────

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "lead") router.replace("/unauthorized");
  }, [router]);

  // ── Fetch completed events ──────────────────────────────────────────────

  useEffect(() => {
    apiFetchAuth<{ events: ApiEvent[] }>("/events/lead?status=completed")
      .then(d => setEvents(d.events))
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));
  }, []);

  // ── Select an event → fetch volunteers ─────────────────────────────────

  const handleSelectEvent = async (event: ApiEvent) => {
    if (selectedEvent?.id === event.id) return;
    setSelectedEvent(event);
    setVolunteers([]);
    setSelected(new Set());
    setIssueSuccess(null);
    setIssueError(null);
    setLoadingVols(true);

    try {
      const res = await apiFetchAuth<{ volunteers: CertVolunteer[] }>(
        `/certificates/events/${event.id}/volunteers`
      );
      setVolunteers(res.volunteers);
    } catch {
      setVolunteers([]);
    } finally {
      setLoadingVols(false);
    }
  };

  // ── Checkbox logic ──────────────────────────────────────────────────────

  const pendingVols = volunteers.filter(v => !v.hasCertificate);

  const toggleAll = () => {
    if (selected.size === pendingVols.length && pendingVols.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingVols.map(v => v.applicationId)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allSelected = pendingVols.length > 0 && selected.size === pendingVols.length;
  const someSelected = selected.size > 0 && !allSelected;

  // ── Issue certificates ──────────────────────────────────────────────────

  const handleIssue = async () => {
    if (!selectedEvent || selected.size === 0) return;
    setIssueError(null);
    setIssueSuccess(null);
    setIssuing(true);

    try {
      const res = await apiFetchAuth<{ issued: unknown[]; skipped: unknown[] }>(
        `/certificates/events/${selectedEvent.id}/issue`,
        {
          method: "POST",
          body: JSON.stringify({ applicationIds: Array.from(selected) }),
        }
      );

      const issuedCount  = res.issued.length;
      const skippedCount = res.skipped.length;

      setIssueSuccess(
        issuedCount > 0
          ? `${issuedCount} certificate${issuedCount > 1 ? "s" : ""} issued successfully.${skippedCount > 0 ? ` ${skippedCount} already had certificates.` : ""}`
          : "No new certificates issued (all selected already have certificates)."
      );

      // Refresh volunteer list to show updated statuses
      const updated = await apiFetchAuth<{ volunteers: CertVolunteer[] }>(
        `/certificates/events/${selectedEvent.id}/volunteers`
      );
      setVolunteers(updated.volunteers);
      setSelected(new Set());
    } catch (err: unknown) {
      setIssueError(err instanceof Error ? err.message : "Failed to issue certificates.");
    } finally {
      setIssuing(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <div className={styles.body}>
        <Triangle style={{ left: "0px",   top: "60px",     transform: "rotate(-20deg)", borderBottomColor: "var(--color-primary-500)"   }} />
        <Triangle style={{ right: "30px", top: "40px",     transform: "rotate(10deg)",  borderBottomColor: "var(--color-secondary-500)" }} />
        <Triangle style={{ left: "20px",  bottom: "120px", transform: "rotate(-10deg)", borderBottomColor: "var(--color-semantic-red)"  }} />
        <Triangle style={{ right: "0px",  bottom: "60px",  transform: "rotate(20deg)",  borderBottomColor: "var(--color-primary-800)"   }} />

        <div className={styles.inner}>

          {/* ── Page header ── */}
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Certificates</h1>
            <p className={styles.pageSub}>Manage and issue certificates for volunteers of completed events.</p>
          </div>

          {/* ── Two-column layout ── */}
          <div className={styles.layout}>

            {/* ── Left: Completed events list ── */}
            <div className={styles.leftPanel}>
              <p className={styles.panelLabel}>Completed Events</p>

              {loadingEvents ? (
                <div className={styles.panelLoading}>
                  <Loader2 size={20} className={styles.spinner} />
                </div>
              ) : events.length === 0 ? (
                <div className={styles.panelEmpty}>
                  <Award size={28} className={styles.panelEmptyIcon} />
                  <p>No completed events yet.</p>
                </div>
              ) : (
                <ul className={styles.eventList}>
                  {events.map(event => (
                    <li key={event.id}>
                      <button
                        className={`${styles.eventCard} ${selectedEvent?.id === event.id ? styles.eventCardActive : ""}`}
                        onClick={() => handleSelectEvent(event)}
                      >
                        <p className={styles.eventCardName}>{event.name}</p>
                        <p className={styles.eventCardDate}>
                          <Calendar size={12} />
                          {formatDate(event.eventDate)}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ── Right: Volunteers panel ── */}
            <div className={styles.rightPanel}>
              {!selectedEvent ? (
                <div className={styles.rightEmpty}>
                  <Award size={40} className={styles.rightEmptyIcon} />
                  <p className={styles.rightEmptyTitle}>Select a completed event</p>
                  <p className={styles.rightEmptySub}>Choose an event from the list to view and issue certificates.</p>
                </div>
              ) : (
                <>
                  {/* Right header */}
                  <div className={styles.rightHeader}>
                    <div>
                      <h2 className={styles.rightTitle}>{selectedEvent.name} Volunteers</h2>
                      <p className={styles.rightSub}>Select volunteers to issue certificates.</p>
                    </div>
                    <button
                      className={styles.issueBtn}
                      onClick={handleIssue}
                      disabled={selected.size === 0 || issuing}
                    >
                      {issuing
                        ? <><Loader2 size={14} className={styles.spinnerSm} /> Issuing…</>
                        : <><CheckCircle2 size={14} /> Issue Certificates</>
                      }
                    </button>
                  </div>

                  {/* Feedback banners */}
                  {issueSuccess && (
                    <div className={styles.successBanner}>{issueSuccess}</div>
                  )}
                  {issueError && (
                    <div className={styles.errorBanner}>{issueError}</div>
                  )}

                  {/* Volunteers table */}
                  {loadingVols ? (
                    <div className={styles.tableLoading}>
                      <Loader2 size={24} className={styles.spinner} />
                      <p>Loading volunteers…</p>
                    </div>
                  ) : volunteers.length === 0 ? (
                    <div className={styles.tableEmpty}>
                      <p>No accepted volunteers for this event.</p>
                    </div>
                  ) : (
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th className={styles.thCheck}>
                            <input
                              type="checkbox"
                              className={styles.checkbox}
                              checked={allSelected}
                              ref={el => { if (el) el.indeterminate = someSelected; }}
                              onChange={toggleAll}
                              disabled={pendingVols.length === 0}
                              title="Select all pending"
                            />
                          </th>
                          <th>Volunteer</th>
                          <th>Role</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {volunteers.map(v => (
                          <tr key={v.applicationId} className={v.hasCertificate ? styles.rowIssued : ""}>
                            <td className={styles.tdCheck}>
                              <input
                                type="checkbox"
                                className={styles.checkbox}
                                checked={v.hasCertificate || selected.has(v.applicationId)}
                                disabled={v.hasCertificate}
                                onChange={() => !v.hasCertificate && toggleOne(v.applicationId)}
                              />
                            </td>
                            <td>
                              <p className={styles.volName}>{v.name}</p>
                              {v.studentMatricId && (
                                <p className={styles.volId}>{v.studentMatricId}</p>
                              )}
                            </td>
                            <td className={styles.roleCell}>{v.roleName}</td>
                            <td>
                              <span className={v.hasCertificate ? styles.badgeIssued : styles.badgePending}>
                                {v.hasCertificate ? "Issued" : "Pending"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
