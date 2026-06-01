"use client";

import { useEffect, useState, Fragment } from "react";
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
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import Badge, { BadgeVariant } from "@/components/shared/Badge/Badge";
import DeadlineAlert from "@/components/shared/DeadlineAlert/DeadlineAlert";
import RejectApplicationModal from "@/components/lead/RejectApplicationModal/RejectApplicationModal";
import { apiFetchAuth } from "@/lib/api";
import type { EventDetail, VolunteerApplicant, VolunteerRole } from "@/types/lead";
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
  dropped:  { variant: "draft",    label: "Dropped"  },
};

const PREDEFINED_ROLES = [
  "Registration Desk",
  "Stage Setup",
  "Tech Support",
  "Event Crew",
  "Usher"
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeadEventDetailPage() {
  const params  = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent]               = useState<EventDetail | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [togglingVol, setTogglingVol]   = useState(false);
  const [decidingApp, setDecidingApp]   = useState<number | null>(null);
  const [rejectingAppId, setRejectingAppId] = useState<number | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Role management state
  const [showAddRole, setShowAddRole]   = useState(false);
  const [newRole, setNewRole]           = useState({ roleName: "", description: "", slotsAvailable: 1 });
  const [addingRole, setAddingRole]     = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null);
  const [roleError, setRoleError]       = useState<string | null>(null);
  const [actionError, setActionError]   = useState<string | null>(null);

  const toggleRow = (applicationId: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(applicationId)) {
        next.delete(applicationId);
      } else {
        next.add(applicationId);
      }
      return next;
    });
  };

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
    setActionError(null);
    try {
      await apiFetchAuth(`/events/${eventId}/volunteering`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setEvent(prev => prev ? { ...prev, volunteeringStatus: newStatus } : prev);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to update volunteering status");
    } finally {
      setTogglingVol(false);
    }
  };

  const handleAddRole = async () => {
    if (!newRole.roleName.trim()) { setRoleError("Role name is required."); return; }
    if (newRole.slotsAvailable < 1) { setRoleError("Slots must be at least 1."); return; }
    setAddingRole(true);
    setRoleError(null);
    try {
      const created = await apiFetchAuth<VolunteerRole>(`/volunteering/events/${eventId}/roles`, {
        method: "POST",
        body: JSON.stringify(newRole),
      });
      setEvent(prev => prev ? { ...prev, volunteerRoles: [...prev.volunteerRoles, created] } : prev);
      setNewRole({ roleName: "", description: "", slotsAvailable: 1 });
      setShowAddRole(false);
    } catch (err: unknown) {
      setRoleError(err instanceof Error ? err.message : "Failed to create role.");
    } finally {
      setAddingRole(false);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (deletingRoleId !== null) return;
    setDeletingRoleId(roleId);
    setActionError(null);
    try {
      await apiFetchAuth(`/volunteering/roles/${roleId}`, { method: "DELETE" });
      setEvent(prev => prev ? { ...prev, volunteerRoles: prev.volunteerRoles.filter(r => r.roleId !== roleId) } : prev);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to delete role.");
    } finally {
      setDeletingRoleId(null);
    }
  };

  const handleDecideApplication = async (applicationId: number, decision: "accepted" | "rejected", rejectionMessage?: string) => {
    if (!event || decidingApp !== null) return;
    setDecidingApp(applicationId);
    setActionError(null);
    try {
      await apiFetchAuth(`/volunteering/applications/${applicationId}/decision`, {
        method: "PATCH",
        body: JSON.stringify({ decision, rejectionMessage }),
      });
      setEvent(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          volunteers: prev.volunteers.map(v =>
            v.applicationId === applicationId ? { ...v, status: decision, rejectionMessage } : v
          ),
        };
      });
      if (decision === "rejected") {
        setRejectingAppId(null);
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to update application");
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
                  href={`http://localhost:5000${event.proposalPdfUrl}`}
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

                {/* ── Roles section ───────────────────────────────────────── */}
                <div className={styles.rolesSection}>
                  <div className={styles.rolesSectionHeader}>
                    <h3 className={styles.applicantsTitle}>
                      <Users size={15} /> Volunteer Roles
                      <span className={styles.roleCount}>{(event.volunteerRoles || []).length}</span>
                    </h3>
                    {!showAddRole && (
                      <button className={styles.addRoleBtn} onClick={() => { setShowAddRole(true); setRoleError(null); }}>
                        <Plus size={13} /> Add Role
                      </button>
                    )}
                  </div>

                  {/* Add role form */}
                  {showAddRole && (
                    <div className={styles.addRoleForm}>
                      <div className={styles.addRoleFields}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel}>Role Name *</label>
                          <select
                            className={styles.fieldInput}
                            value={newRole.roleName}
                            onChange={e => setNewRole(p => ({ ...p, roleName: e.target.value }))}
                          >
                            <option value="" disabled>Select a role...</option>
                            {PREDEFINED_ROLES.map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel}>Description</label>
                          <input
                            className={styles.fieldInput}
                            placeholder="What will this volunteer do?"
                            value={newRole.description}
                            onChange={e => setNewRole(p => ({ ...p, description: e.target.value }))}
                          />
                        </div>
                        <div className={styles.fieldGroup} style={{ maxWidth: 120 }}>
                          <label className={styles.fieldLabel}>Slots *</label>
                          <input
                            type="number"
                            min={1}
                            className={styles.fieldInput}
                            value={newRole.slotsAvailable}
                            onChange={e => setNewRole(p => ({ ...p, slotsAvailable: Number(e.target.value) }))}
                          />
                        </div>
                      </div>
                      {roleError && <p className={styles.roleError}>{roleError}</p>}
                      <div className={styles.addRoleActions}>
                        <button className={styles.acceptBtn} onClick={handleAddRole} disabled={addingRole}>
                          {addingRole ? <Loader2 size={12} className={styles.spinnerSm} /> : <Check size={12} />}
                          Save Role
                        </button>
                        <button className={styles.rejectBtn} onClick={() => { setShowAddRole(false); setRoleError(null); }}>
                          <X size={12} /> Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Roles list */}
                  {(event.volunteerRoles || []).length === 0 && !showAddRole ? (
                    <p className={styles.noApplicants}>No roles defined yet. Add a role so students can apply.</p>
                  ) : (
                    <div className={styles.rolesList}>
                      {(event.volunteerRoles || []).map(role => (
                        <div key={role.roleId} className={styles.roleRow}>
                          <div className={styles.roleInfo}>
                            <span className={styles.roleName}>{role.roleName}</span>
                            {role.description && <span className={styles.roleDesc}>{role.description}</span>}
                          </div>
                          <div className={styles.roleSlots}>
                            <span className={`${styles.slotsBadge} ${role.slotsFilled >= role.slotsAvailable ? styles.slotsFull : ""}`}>
                              {role.slotsFilled} / {role.slotsAvailable} filled
                            </span>
                          </div>
                          <button
                            className={styles.deleteRoleBtn}
                            disabled={deletingRoleId === role.roleId || role.slotsFilled > 0}
                            title={role.slotsFilled > 0 ? "Cannot delete a role with accepted volunteers" : "Delete role"}
                            onClick={() => handleDeleteRole(role.roleId)}
                          >
                            {deletingRoleId === role.roleId ? <Loader2 size={13} className={styles.spinnerSm} /> : <Trash2 size={13} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Applications table */}
                {event.volunteers.length > 0 && (
                  <div className={styles.applicantsSection}>
                    <h3 className={styles.applicantsTitle}>Applications</h3>
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Student ID</th>
                            <th>Role</th>
                            <th>Date Applied</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {event.volunteers.map(app => {
                            const badge = APP_BADGE[app.status];
                            const isExpanded = expandedRows.has(app.applicationId);
                            return (
                              <Fragment key={app.applicationId}>
                                <tr className={styles.expandableRow} onClick={() => toggleRow(app.applicationId)}>
                                  <td>{app.studentName}</td>
                                  <td>{app.studentMatricId ?? "—"}</td>
                                  <td>{app.roleName}</td>
                                  <td>
                                    {new Date(app.appliedAt).toLocaleDateString("en-MY", {
                                      year: "numeric", month: "short", day: "numeric",
                                    })}
                                  </td>
                                  <td>
                                    <Badge label={badge.label} variant={badge.variant} />
                                  </td>
                                  <td onClick={e => e.stopPropagation()}>
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
                                          onClick={() => setRejectingAppId(app.applicationId)}
                                          disabled={decidingApp === app.applicationId}
                                        >
                                          <X size={12} /> Reject
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr className={styles.expandedRow}>
                                    <td colSpan={6} className={styles.reasonContent}>
                                      <div className={styles.reasonTitle}>Reason for applying:</div>
                                      {app.reason ? app.reason : <em>No reason provided.</em>}
                                      {app.rejectionMessage && (
                                        <div style={{ marginTop: 8 }}>
                                          <div className={styles.reasonTitle}>Rejection Message:</div>
                                          {app.rejectionMessage}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
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
      
      {rejectingAppId !== null && (
        <RejectApplicationModal
          isOpen={true}
          onClose={() => setRejectingAppId(null)}
          studentName={event?.volunteers.find(v => v.applicationId === rejectingAppId)?.studentName ?? "Student"}
          onSubmit={(msg) => handleDecideApplication(rejectingAppId, "rejected", msg)}
        />
      )}
    </div>
  );
}
