"use client";

import { Fragment, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Users,
  Wallet,
  X
} from "lucide-react";
import Badge, { BadgeVariant } from "@/components/shared/Badge/Badge";
import DeadlineAlert from "@/components/shared/DeadlineAlert/DeadlineAlert";
import RejectApplicationModal from "@/components/lead/RejectApplicationModal/RejectApplicationModal";
import { apiFetchAuth } from "@/lib/api";
import type { EventDetail, VolunteerApplicant, VolunteerRole } from "@/types/lead";
import styles from "./page.module.css";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { variant: BadgeVariant; label: string }> = {
  draft: { variant: "draft", label: "Draft" },
  submitted: { variant: "pending-admin", label: "Submitted" },
  approved: { variant: "approved", label: "Approved" },
  ongoing: { variant: "ongoing", label: "Ongoing" },
  completed: { variant: "completed", label: "Completed" },
  report_due: { variant: "report-due", label: "Report Due" },
  rejected: { variant: "rejected", label: "Rejected" },
};

const LIVE_STATUSES = new Set(["approved", "ongoing", "completed", "report_due"]);

const APP_BADGE: Record<VolunteerApplicant["status"], { variant: BadgeVariant; label: string }> = {
  pending: { variant: "pending", label: "Pending" },
  accepted: { variant: "approved", label: "Accepted" },
  rejected: { variant: "rejected", label: "Rejected" },
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
  const router  = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingVol, setTogglingVol] = useState(false);
  const [decidingApp, setDecidingApp] = useState<number | null>(null);
  const [rejectingAppId, setRejectingAppId] = useState<number | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Role management state
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRole, setNewRole] = useState({ roleName: "", description: "", slotsAvailable: 1 });
  const [addingRole, setAddingRole] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [editRoleSlots, setEditRoleSlots] = useState<number>(1);
  const [editRoleDesc, setEditRoleDesc] = useState<string>("");
  const [updatingRole, setUpdatingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
    if (!event || togglingVol) return;
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

  const handleUpdateRole = async (roleId: number) => {
    if (updatingRole) return;
    const role = event?.volunteerRoles.find(r => r.roleId === roleId);
    if (!role) return;

    if (editRoleSlots < role.slotsFilled) {
      setActionError("Cannot reduce slots below the number of currently filled slots.");
      return;
    }

    setUpdatingRole(true);
    setActionError(null);
    try {
      const updated = await apiFetchAuth<VolunteerRole>(`/volunteering/roles/${roleId}`, {
        method: "PATCH",
        body: JSON.stringify({
          slotsAvailable: editRoleSlots,
          description: editRoleDesc.trim() || null
        })
      });
      setEvent(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          volunteerRoles: prev.volunteerRoles.map(r => r.roleId === roleId ? { ...r, slotsAvailable: updated.slotsAvailable, description: updated.description } : r)
        };
      });
      setEditingRoleId(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to update role.");
    } finally {
      setUpdatingRole(false);
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
      if (decision === "rejected") setRejectingAppId(null);
      // Re-fetch the full event so slotsFilled counts and volunteeringStatus are accurate
      const refreshed = await apiFetchAuth<{ event: EventDetail }>(`/events/${eventId}`);
      setEvent(refreshed.event);
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

  const isLive = LIVE_STATUSES.has(event.status);
  const showDeadline = event.status === "report_due";
  const showReportBtn = event.status === "report_due" || event.status === "completed";

  const formattedDate = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString("en-MY", {
      year: "numeric", month: "long", day: "numeric",
    })
    : "TBD";

  const volOpen = event.volunteeringStatus === "open";


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
              onCta={() => router.push(`/lead/events/${eventId}/reports`)}
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
                <span className={styles.metaPrice}>
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
                <Link href={`/lead/events/${eventId}/reports`} className={styles.actionPrimary}>
                  <FileText size={14} />
                  Submit Report
                </Link>
              )}
            </div>
          </div>

          {isLive && (
            <div className={styles.section}>
              <div className={styles.volCard}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 19V17C15 15.9391 14.5786 14.9217 13.8284 14.1716C13.0783 13.4214 12.0609 13 11 13H5C3.93913 13 2.92172 13.4214 2.17157 14.1716C1.42143 14.9217 1 15.9391 1 17V19M21 19V17C20.9993 16.1137 20.7044 15.2528 20.1614 14.5523C19.6184 13.8519 18.8581 13.3516 18 13.13M15 1.13C15.8604 1.3503 16.623 1.8507 17.1676 2.55231C17.7122 3.25392 18.0078 4.11683 18.0078 5.005C18.0078 5.89317 17.7122 6.75608 17.1676 7.45769C16.623 8.1593 15.8604 8.6597 15 8.88M12 5C12 7.20914 10.2091 9 8 9C5.79086 9 4 7.20914 4 5C4 2.79086 5.79086 1 8 1C10.2091 1 12 2.79086 12 5Z" stroke="var(--color-ktr-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Volunteering Settings
                  </h2>
                  <div className={styles.volToggleWrap}>
                    <button
                      className={`${styles.toggleBtn} ${volOpen ? styles.toggleOpen : styles.toggleClosed}`}
                      onClick={handleToggleVolunteering}
                      disabled={togglingVol}
                      title={volOpen ? "Close Applications" : "Open Applications"}
                    >
                    </button>
                    <span className={styles.volToggleLabel}>
                      {volOpen ? "Open" : "Closed"}
                    </span>
                  </div>
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
                            {editingRoleId === role.roleId ? (
                              <input
                                className={styles.fieldInput}
                                style={{ padding: '4px', fontSize: '12px', marginTop: '4px', width: '100%' }}
                                placeholder="Role description..."
                                value={editRoleDesc}
                                onChange={e => setEditRoleDesc(e.target.value)}
                              />
                            ) : (
                              role.description && <span className={styles.roleDesc}>{role.description}</span>
                            )}
                          </div>
                          <div className={styles.roleSlots}>
                            {editingRoleId === role.roleId ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className={styles.slotsBadge}>
                                  {role.slotsFilled} /
                                  <input
                                    type="number"
                                    min={role.slotsFilled}
                                    value={editRoleSlots}
                                    onChange={(e) => setEditRoleSlots(Number(e.target.value))}
                                    style={{ width: '40px', marginLeft: '4px', padding: '2px' }}
                                  />
                                </span>
                                <button
                                  onClick={() => handleUpdateRole(role.roleId)}
                                  disabled={updatingRole}
                                  className={styles.acceptBtn}
                                  style={{ padding: '4px 8px', fontSize: '11px' }}
                                >
                                  {updatingRole ? <Loader2 size={12} className={styles.spinnerSm} /> : <Check size={12} />}
                                </button>
                                <button
                                  onClick={() => setEditingRoleId(null)}
                                  className={styles.rejectBtn}
                                  style={{ padding: '4px 8px', fontSize: '11px' }}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <span className={`${styles.slotsBadge} ${role.slotsFilled >= role.slotsAvailable ? styles.slotsFull : ""}`}>
                                {role.slotsFilled} / {role.slotsAvailable} filled
                              </span>
                            )}
                          </div>

                          {editingRoleId !== role.roleId && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                className={styles.editRoleBtn}
                                title="Edit slots"
                                onClick={() => {
                                  setEditingRoleId(role.roleId);
                                  setEditRoleSlots(role.slotsAvailable);
                                  setEditRoleDesc(role.description || "");
                                }}
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                className={styles.deleteRoleBtn}
                                disabled={deletingRoleId === role.roleId || role.slotsFilled > 0}
                                title={role.slotsFilled > 0 ? "Cannot delete a role with accepted volunteers" : "Delete role"}
                                onClick={() => handleDeleteRole(role.roleId)}
                              >
                                {deletingRoleId === role.roleId ? <Loader2 size={13} className={styles.spinnerSm} /> : <Trash2 size={13} />}
                              </button>
                            </div>
                          )}
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

                {!volOpen && event.volunteers.length === 0 && (
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
