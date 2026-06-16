"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Users, CalendarCheck, Loader2, Check, X, Trash2, Plus, UserPlus, Clock, Calendar, XCircle, LogOut } from "lucide-react";
import Link from "next/link";
import Triangle from "@/components/shared/triangle/triangle";
import { apiFetchAuth } from "@/lib/api";
import { getUser } from "@/lib/auth";
import type { ApprovedClub, PendingClubItem, ClubItem, ClubMember, MembershipRequest, ClubTab, ClubVolunteerApplication, LeadRoleIncomingRequest } from "@/types/lead";
import Alert from "@/components/shared/alertComponent/alert";
import Badge, { BadgeVariant } from "@/components/shared/Badge/Badge";
import CreateClubModal from "@/components/lead/CreateClubModal/CreateClubModal";
import RejectApplicationModal from "@/components/lead/RejectApplicationModal/RejectApplicationModal";
import styles from "./page.module.css";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MyClubPage() {
  const currentUser = getUser();
  const isUserLead = currentUser?.role === "lead";

  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [volApps, setVolApps] = useState<ClubVolunteerApplication[]>([]);
  const [leadRequests, setLeadRequests] = useState<LeadRoleIncomingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ClubTab>("members");
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [volSuccess, setVolSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [expandedVolRows, setExpandedVolRows] = useState<Set<string>>(new Set());
  const [confirmResign, setConfirmResign] = useState(false);
  const [confirmRemoveMemberId, setConfirmRemoveMemberId] = useState<string | null>(null);
  const [confirmRemoveMemberName, setConfirmRemoveMemberName] = useState("");
  const [rejectingMemberRequestId, setRejectingMemberRequestId] = useState<string | null>(null);
  const [rejectingMemberRequestName, setRejectingMemberRequestName] = useState("");
  const [rejectingLeadRequestId, setRejectingLeadRequestId] = useState<string | null>(null);
  const [rejectingLeadRequestName, setRejectingLeadRequestName] = useState("");
  const [memberSuccess, setMemberSuccess] = useState<string | null>(null);

  const VOL_BADGE: Record<ClubVolunteerApplication["status"], { variant: BadgeVariant; label: string }> = {
    pending: { variant: "pending", label: "Pending" },
    accepted: { variant: "approved", label: "Accepted" },
    rejected: { variant: "rejected", label: "Rejected" },
  };

  const toggleVolRow = (id: string) => {
    setExpandedVolRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Derived selection ──────────────────────────────────────────────────────

  const selectedItem = clubs.find(c =>
    c.status === "approved"
      ? `club-${c.id}` === selectedKey
      : `pending-${c.requestId}` === selectedKey
  ) ?? null;

  const selectedClub = selectedItem?.status === "approved" ? selectedItem as ApprovedClub : null;

  // ── Load club data — full management for leads, read-only for members ─────

  const loadClubData = useCallback(async (club: ApprovedClub) => {
    if (club.userRole === "lead") {
      const [membersData, requestsData, volData, leadReqData] = await Promise.all([
        apiFetchAuth<{ members: ClubMember[] }>(`/clubs/mine/members?clubId=${club.id}`),
        apiFetchAuth<{ requests: MembershipRequest[] }>(`/clubs/mine/membership-requests?clubId=${club.id}`),
        apiFetchAuth<{ applications: ClubVolunteerApplication[] }>(`/volunteering/applications/club?clubId=${club.id}`),
        apiFetchAuth<{ requests: LeadRoleIncomingRequest[] }>(`/requests/lead-role/incoming`),
      ]);
      setMembers(membersData.members);
      setRequests(requestsData.requests);
      setVolApps(volData.applications);
      setLeadRequests(leadReqData.requests);
    } else {
      const membersData = await apiFetchAuth<{ members: ClubMember[] }>(`/clubs/${club.id}/members`);
      setMembers(membersData.members);
      setRequests([]);
      setVolApps([]);
      setLeadRequests([]);
    }
  }, []);

  const fetchAllClubs = useCallback(async () => {
    const { clubs: data } = await apiFetchAuth<{ clubs: ClubItem[] }>("/clubs/mine/all");
    setClubs(data);
    return data;
  }, []);

  useEffect(() => {
    fetchAllClubs()
      .then(async (data) => {
        const first = data.find(c => c.status === "approved") ?? data[0] ?? null;
        if (!first) return;
        const key = first.status === "approved" ? `club-${first.id}` : `pending-${(first as PendingClubItem).requestId}`;
        setSelectedKey(key);
        if (first.status === "approved") await loadClubData(first as ApprovedClub);
      })
      .catch(err => setError(err.message ?? "Failed to load clubs"))
      .finally(() => setLoading(false));
  }, [fetchAllClubs, loadClubData]);

  // ── Club switcher ──────────────────────────────────────────────────────────

  const handleSelectItem = async (item: ClubItem) => {
    const key = item.status === "approved" ? `club-${item.id}` : `pending-${(item as PendingClubItem).requestId}`;
    setSelectedKey(key);
    setSearch("");
    setTab("members");
    setExpandedVolRows(new Set());
    if (item.status === "approved") {
      await loadClubData(item as ApprovedClub).catch(() => { });
    } else {
      setMembers([]);
      setRequests([]);
      setLeadRequests([]);
    }
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const isRoleFull = (roleId: string, slotsAvailable: number): boolean =>
    volApps.filter(a => a.roleId === roleId && a.status === "accepted").length >= slotsAvailable;

  const handleDecideVolApp = async (applicationId: string, decision: "accepted" | "rejected", rejectionMessage?: string) => {
    if (acting !== null) return;
    setActing(applicationId);
    try {
      await apiFetchAuth(`/volunteering/applications/${applicationId}/decision`, {
        method: "PATCH",
        body: JSON.stringify({ decision, rejectionMessage }),
      });
      setVolApps(prev => prev.map(a =>
        a.applicationId === applicationId
          ? { ...a, status: decision, rejectionMessage: rejectionMessage ?? null }
          : a
      ));
      if (decision === "rejected") setRejectingAppId(null);
      setVolSuccess(decision === "accepted" ? "Volunteer accepted successfully." : "Application rejected.");
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
      throw err;
    } finally {
      setActing(null);
    }
  };

  const handleDecideRequest = async (requestId: string, decision: "approved" | "rejected", leadComment?: string) => {
    if (!selectedClub || acting !== null) return;
    const req = requests.find(r => r.id === requestId);
    setActing(requestId);
    try {
      await apiFetchAuth(`/clubs/mine/membership-requests/${requestId}/decision?clubId=${selectedClub.id}`, {
        method: "PATCH",
        body: JSON.stringify({ decision, ...(leadComment ? { leadComment } : {}) }),
      });
      setRequests(prev => prev.filter(r => r.id !== requestId));
      setClubs(prev => prev.map(c =>
        c.status === "approved" && c.id === selectedClub.id
          ? {
            ...c,
            pendingRequests: c.pendingRequests - 1,
            ...(decision === "approved" ? { memberCount: c.memberCount + 1 } : {}),
          }
          : c
      ));
      if (decision === "approved") {
        await loadClubData(selectedClub);
        setMemberSuccess(`${req?.studentName ?? "Member"} has been accepted into the club.`);
      } else {
        setMemberSuccess(`${req?.studentName ?? "Member"}'s membership request has been rejected.`);
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActing(null);
    }
  };

  const handleDecideLeadRequest = async (requestId: string, action: "approved" | "rejected", comment?: string) => {
    if (acting !== null) return;
    const req = leadRequests.find(r => r.id === requestId);
    setActing(requestId);
    try {
      await apiFetchAuth(`/requests/lead-role/${requestId}/lead-decision`, {
        method: "PATCH",
        body: JSON.stringify({ action, ...(comment ? { comment } : {}) }),
      });
      setLeadRequests(prev => prev.filter(r => r.id !== requestId));
      if (action === "rejected") setRejectingLeadRequestId(null);
      setMemberSuccess(
        action === "approved"
          ? `${req?.student?.fullName ?? "Request"} approved and forwarded to the admin for final approval.`
          : `${req?.student?.fullName ?? "Request"}'s lead role request has been rejected.`
      );
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
      throw err;
    } finally {
      setActing(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedClub || acting !== null) return;
    const member = members.find(m => m.userId === userId);
    setConfirmRemoveMemberId(null);
    setActing(userId);
    try {
      await apiFetchAuth(`/clubs/mine/members/${userId}?clubId=${selectedClub.id}`, { method: "DELETE" });
      setMembers(prev => prev.filter(m => m.userId !== userId));
      setClubs(prev => prev.map(c =>
        c.status === "approved" && c.id === selectedClub.id
          ? { ...c, memberCount: c.memberCount - 1 }
          : c
      ));
      setMemberSuccess(`${member?.fullName ?? "Member"} has been removed from the club.`);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to remove member.");
    } finally {
      setActing(null);
    }
  };

  const handleResign = async () => {
    if (!selectedClub || acting !== null) return;
    const clubName = selectedClub.name;
    setConfirmResign(false);
    setActing(selectedClub.id);
    try {
      await apiFetchAuth(`/clubs/mine/${selectedClub.id}/resign`, { method: "POST" });
      // Role/membership changed server-side — refetch clubs and reselect the first one
      const data = await fetchAllClubs();
      const next = data.find(c => c.status === "approved") ?? data[0] ?? null;
      if (next) {
        const key = next.status === "approved" ? `club-${next.id}` : `pending-${(next as PendingClubItem).requestId}`;
        setSelectedKey(key);
        setTab("members");
        if (next.status === "approved") await loadClubData(next as ApprovedClub);
      } else {
        setSelectedKey(null);
      }
      setMemberSuccess(`You have resigned as lead of ${clubName}. The club is now leaderless and any pending lead-role requests have been sent to the admin.`);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to resign. Please try again.");
    } finally {
      setActing(null);
    }
  };

  const handleCreateSuccess = async () => {
    setShowCreateModal(false);
    setCreateSuccess(true);
    try {
      const data = await fetchAllClubs();
      const newPending = data.find(c => c.status === "pending") as PendingClubItem | undefined;
      if (newPending) setSelectedKey(`pending-${newPending.requestId}`);
    } catch { /* ignore */ }
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const filteredMembers = members.filter(m =>
    !search ||
    m.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (m.staffOrMatricId ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const pendingDraft = selectedClub
    ? selectedClub.eventStats.total - selectedClub.eventStats.approved - selectedClub.eventStats.rejected
    : 0;

  // ── Loading / error ────────────────────────────────────────────────────────

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.stateBox}>
          <Loader2 size={32} className={styles.spinner} />
          <p>Loading club data…</p>
        </div>
      </div>
    </div>
  );

  if (error || clubs.length === 0) return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={`${styles.stateBox} ${styles.errorBox}`}>
          <p>⚠ {error ?? "No clubs found."}</p>
        </div>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <div className={styles.body}>

        <Triangle style={{ left: "0px", top: "60px", transform: "rotate(-20deg)", borderBottomColor: "var(--color-semantic-red)" }} />
        <Triangle style={{ right: "30px", top: "40px", transform: "rotate(10deg)", borderBottomColor: "var(--color-primary-800)" }} />
        <Triangle style={{ left: "20px", bottom: "120px", transform: "rotate(-10deg)", borderBottomColor: "var(--color-primary-500)" }} />
        <Triangle style={{ right: "0px", bottom: "60px", transform: "rotate(20deg)", borderBottomColor: "var(--color-secondary-500)" }} />

        <div className={styles.inner}>

          {/* ── Club selector row ──────────────────────────────────────────── */}
          <div className={styles.selectorRow}>
            <div className={styles.selectorPills}>
              {clubs.map(item => {
                const key        = item.status === "approved" ? `club-${item.id}` : `pending-${(item as PendingClubItem).requestId}`;
                const isActive   = key === selectedKey;
                const isPending  = item.status === "pending";
                const isRejected = item.status === "rejected";
                const isMemberClub = item.status === "approved" && (item as ApprovedClub).userRole === "member";
                return (
                  <button
                    key={key}
                    className={`${styles.selectorPill} ${isActive ? styles.selectorPillActive : ""} ${isPending ? styles.selectorPillPending : ""} ${isRejected ? styles.selectorPillRejected : ""}`}
                    onClick={() => handleSelectItem(item)}
                  >
                    {isPending  && <Clock   size={12} />}
                    {isRejected && <XCircle size={12} />}
                    {item.name}
                    {isPending    && <span className={styles.pendingBadge}>Pending</span>}
                    {isRejected   && <span className={styles.rejectedBadge}>Rejected</span>}
                    {isMemberClub && <span className={styles.pendingBadge}>Member</span>}
                  </button>
                );
              })}
            </div>
            {isUserLead && (
              <>
                <Link href="/become-member" className={styles.joinClubLink}>
                  <UserPlus size={14} />
                  Join a Club
                </Link>
                <button className={styles.createClubBtn} onClick={() => setShowCreateModal(true)}>
                  <Plus size={14} />
                  Create New Club / Community
                </button>
              </>
            )}
          </div>

          {/* ── Pending / Rejected item view ───────────────────────────────── */}
          {(selectedItem?.status === "pending" || selectedItem?.status === "rejected") && (() => {
            const p          = selectedItem as PendingClubItem;
            const isRejected = p.status === "rejected";
            return (
              <div className={`${styles.pendingCard} ${isRejected ? styles.rejectedCard : ""}`}>
                <div className={styles.pendingHeader}>
                  {isRejected
                    ? <XCircle size={22} className={styles.rejectedIcon} />
                    : <Clock   size={22} className={styles.pendingIcon}  />}
                  <div>
                    <p className={isRejected ? styles.rejectedStatus : styles.pendingStatus}>
                      {isRejected ? "Request Rejected" : "Pending Admin Review"}
                    </p>
                    <h2 className={styles.pendingName}>{p.name}</h2>
                  </div>
                  <span className={styles.pendingTypeBadge}>
                    {p.type === "community" ? "Community" : "Club"}
                  </span>
                </div>

                {p.category && (
                  <p className={styles.pendingMeta}><strong>Category:</strong> {p.category}</p>
                )}
                <p className={styles.pendingMeta}>
                  <strong>Submitted:</strong>{" "}
                  {new Date(p.submittedAt).toLocaleDateString("en-MY", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </p>
                <p className={styles.pendingDescription}>{p.description}</p>

                {isRejected && p.adminComment ? (
                  <div className={styles.rejectionReasonBox}>
                    <p className={styles.rejectionReasonLabel}>Reason from admin</p>
                    <p className={styles.rejectionReasonText}>{p.adminComment}</p>
                  </div>
                ) : !isRejected && (
                  <p className={styles.pendingNote}>
                    Your request is being reviewed by the admin. You will be notified via your dashboard once a decision has been made.
                  </p>
                )}
              </div>
            );
          })()}

          {/* ── Approved club view ─────────────────────────────────────────── */}
          {selectedClub && (
            <>
              {/* Header card */}
              <div className={styles.headerCard}>
                <div className={styles.headerLeft}>
                  <span className={styles.typeTag}>
                    {selectedClub.type === "community" ? "Community" : "Club"}
                  </span>
                  <h1 className={styles.clubName}>{selectedClub.name}</h1>
                  <p className={styles.description}>{selectedClub.description}</p>
                  {selectedClub.userRole === "lead" && (
                    <button
                      className={styles.resignBtn}
                      onClick={() => setConfirmResign(true)}
                      disabled={acting !== null}
                    >
                      <LogOut size={13} /> Resign as Lead
                    </button>
                  )}
                </div>
                <div className={styles.statsRow}>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{selectedClub.memberCount}</span>
                    <span className={styles.statLabel}><Users size={12} />MEMBERS</span>
                  </div>
                  <div className={styles.statDivider} />
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{selectedClub.eventStats.total}</span>
                    <span className={styles.statLabel}><CalendarCheck size={12} />EVENTS</span>
                  </div>
                </div>
              </div>

              {/* Event summary strip */}
              <div className={styles.eventStatsRow}>
                {[
                  { value: selectedClub.eventStats.total, label: "Total Proposed", cls: "" },
                  { value: selectedClub.eventStats.approved, label: "Approved", cls: styles.approved },
                  { value: selectedClub.eventStats.rejected, label: "Rejected", cls: styles.rejected },
                  { value: pendingDraft, label: "Pending / Draft", cls: styles.pending },
                ].map(s => (
                  <div key={s.label} className={styles.eventStat}>
                    <span className={`${styles.eventStatValue} ${s.cls}`}>{s.value}</span>
                    <span className={styles.eventStatLabel}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className={styles.tabRow}>
                <div className={styles.tabBar}>
                  <button
                    className={`${styles.tabBtn} ${tab === "members" ? styles.tabActive : ""}`}
                    onClick={() => { setTab("members"); setSearch(""); }}
                  >
                    {selectedClub.userRole === "lead" ? "Manage Members" : "Members"}
                  </button>
                  {selectedClub.userRole === "lead" && (
                    <>
                      <button
                        className={`${styles.tabBtn} ${tab === "requests" ? styles.tabActive : ""}`}
                        onClick={() => setTab("requests")}
                      >
                        Membership Requests
                        {requests.length > 0 && (
                          <span className={styles.badge}>{requests.length}</span>
                        )}
                      </button>
                      <button
                        className={`${styles.tabBtn} ${tab === "volunteers" ? styles.tabActive : ""}`}
                        onClick={() => { setTab("volunteers"); setSearch(""); }}
                      >
                        Volunteer Applications
                        {volApps.filter(a => a.status === "pending").length > 0 && (
                          <span className={styles.badge}>{volApps.filter(a => a.status === "pending").length}</span>
                        )}
                      </button>
                      <button
                        className={`${styles.tabBtn} ${tab === "leadRequests" ? styles.tabActive : ""}`}
                        onClick={() => { setTab("leadRequests"); setSearch(""); }}
                      >
                        Lead Requests
                        {leadRequests.length > 0 && (
                          <span className={styles.badge}>{leadRequests.length}</span>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Members tab */}
              {tab === "members" && (
                <div className={styles.tabPanel}>
                  <div className={styles.searchWrap}>
                    <Search size={14} className={styles.searchIcon} />
                    <input
                      className={styles.searchInput}
                      placeholder="Search members…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Student ID</th>
                          <th>Role</th>
                          {selectedClub.userRole === "lead" && <th>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMembers.length === 0 ? (
                          <tr>
                            <td colSpan={selectedClub.userRole === "lead" ? 4 : 3} className={styles.emptyRow}>No members found.</td>
                          </tr>
                        ) : filteredMembers.map(m => (
                          <tr key={m.userId}>
                            <td>{m.fullName}</td>
                            <td>{m.staffOrMatricId ?? "—"}</td>
                            <td>
                              <span className={`${styles.roleBadge} ${m.role === "lead" ? styles.roleLead : styles.roleCommittee}`}>
                                {m.role === "lead" ? "Lead" : "Committee"}
                              </span>
                            </td>
                            {selectedClub.userRole === "lead" && (
                              <td>
                                {m.role !== "lead" && (
                                  <button
                                    className={styles.removeBtn}
                                    onClick={() => { setConfirmRemoveMemberId(m.userId); setConfirmRemoveMemberName(m.fullName); }}
                                    disabled={acting === m.userId}
                                    title="Remove member"
                                  >
                                    <Trash2 size={13} /> Remove
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Requests tab */}
              {tab === "requests" && (
                <div className={styles.tabPanel}>
                  {requests.length === 0 ? (
                    <div className={styles.stateBox}>
                      <p>No pending membership requests.</p>
                    </div>
                  ) : (
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Student ID</th>
                            <th>Date Applied</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {requests.map(r => (
                            <tr key={r.id}>
                              <td>{r.studentName}</td>
                              <td>{r.studentMatricId ?? "—"}</td>
                              <td>
                                {new Date(r.submittedAt).toLocaleDateString("en-MY", {
                                  year: "numeric", month: "short", day: "numeric",
                                })}
                              </td>
                              <td>
                                <div className={styles.appActions}>
                                  <button
                                    className={styles.acceptBtn}
                                    onClick={() => handleDecideRequest(r.id, "approved")}
                                    disabled={acting === r.id}
                                  >
                                    <Check size={12} /> Accept
                                  </button>
                                  <button
                                    className={styles.rejectBtn}
                                    onClick={() => { setRejectingMemberRequestId(r.id); setRejectingMemberRequestName(r.studentName); }}
                                    disabled={acting === r.id}
                                  >
                                    <X size={12} /> Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Lead Requests tab */}
              {tab === "leadRequests" && (
                <div className={styles.tabPanel}>
                  {leadRequests.length === 0 ? (
                    <div className={styles.stateBox}>
                      <p>No pending lead role requests.</p>
                    </div>
                  ) : (
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Student ID</th>
                            <th>Date Applied</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leadRequests.map(r => (
                            <tr key={r.id}>
                              <td>{r.student?.fullName ?? "—"}</td>
                              <td>{r.student?.staffOrMatricId ?? "—"}</td>
                              <td>
                                {new Date(r.submittedAt).toLocaleDateString("en-MY", {
                                  year: "numeric", month: "short", day: "numeric",
                                })}
                              </td>
                              <td>
                                <div className={styles.appActions}>
                                  <button
                                    className={styles.acceptBtn}
                                    onClick={() => handleDecideLeadRequest(r.id, "approved")}
                                    disabled={acting === r.id}
                                  >
                                    <Check size={12} /> Approve
                                  </button>
                                  <button
                                    className={styles.rejectBtn}
                                    onClick={() => { setRejectingLeadRequestId(r.id); setRejectingLeadRequestName(r.student?.fullName ?? "Student"); }}
                                    disabled={acting === r.id}
                                  >
                                    <X size={12} /> Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Volunteer Applications tab */}
              {tab === "volunteers" && (
                <div className={styles.volCardList}>
                  <div className={styles.pendingRequestsHeader}>
                    <div className={styles.pendingRequestsTitleGroup}>
                      <h3 className={styles.pendingRequestsTitle}>Pending Requests ({volApps.filter(a => a.status === 'pending').length})</h3>
                    </div>
                    <div className={styles.searchWrap} style={{ maxWidth: '320px', width: '100%' }}>
                      <Search size={14} className={styles.searchIcon} />
                      <input
                        className={styles.searchInput}
                        placeholder="Search by student or event…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  {volApps.length === 0 ? (
                    <div className={styles.stateBox} style={{ border: 'none', borderRadius: 0 }}>
                      <p>No volunteering applications yet.</p>
                    </div>
                  ) : (
                    <>
                      {volApps
                        .filter(a =>
                          !search ||
                          a.studentName.toLowerCase().includes(search.toLowerCase()) ||
                          a.eventName.toLowerCase().includes(search.toLowerCase())
                        )
                        .map(app => {
                          const badge = VOL_BADGE[app.status];
                          const isExpanded = expandedVolRows.has(app.applicationId);
                          return (
                            <div key={app.applicationId} className={styles.volAppCard} onClick={() => toggleVolRow(app.applicationId)}>
                              <div className={styles.volAppCardHeader}>
                                <div className={styles.volAppStudentInfo}>
                                  <div className={styles.volAppStudentNameRow}>
                                    <h4 className={styles.volAppStudentName}>{app.studentName}</h4>
                                    <span className={styles.volAppStudentId}>{app.studentMatricId ?? "N/A"}</span>
                                  </div>
                                  <div className={styles.volAppEventInfoRow}>
                                    <span className={styles.volAppEventName}>
                                      <Calendar size={14} /> {app.eventName}
                                    </span>
                                    <span className={styles.volAppDate}>
                                      Applied: {new Date(app.appliedAt).toLocaleDateString("en-MY", { year: "numeric", month: "short", day: "numeric" })}
                                    </span>
                                  </div>
                                </div>
                                <div onClick={e => e.stopPropagation()}>
                                  {app.status === "pending" ? (
                                    <div className={styles.appActions}>
                                      <button
                                        className={styles.acceptBtn}
                                        disabled={acting === app.applicationId || isRoleFull(app.roleId, app.slotsAvailable)}
                                        title={isRoleFull(app.roleId, app.slotsAvailable) ? "All slots for this role are filled" : undefined}
                                        onClick={() => handleDecideVolApp(app.applicationId, "accepted")}
                                      >
                                        <Check size={14} />
                                        {isRoleFull(app.roleId, app.slotsAvailable) ? "Role Full" : "Accept"}
                                      </button>
                                      <button
                                        className={styles.rejectBtn}
                                        disabled={acting === app.applicationId}
                                        onClick={() => setRejectingAppId(app.applicationId)}
                                      >
                                        <X size={14} /> Reject
                                      </button>
                                    </div>
                                  ) : (
                                    <Badge label={badge.label} variant={badge.variant} />
                                  )}
                                </div>
                              </div>
                              {isExpanded && (
                                <div className={styles.volAppExpanded} onClick={e => e.stopPropagation()}>
                                  <div>
                                    <h5 className={styles.volAppSectionTitle}>Motivation</h5>
                                    <div className={styles.volAppMotivationBox}>
                                      {app.reason ? `"${app.reason}"` : <em>No reason provided.</em>}
                                    </div>
                                  </div>
                                  {app.rejectionMessage && (
                                    <div style={{ marginTop: 8 }}>
                                      <h5 className={styles.volAppSectionTitle}>Rejection message</h5>
                                      <div className={styles.volAppMotivationBox} style={{ borderColor: 'var(--color-semantic-red-10)', backgroundColor: 'var(--color-semantic-red-10)', color: 'var(--color-semantic-red)' }}>
                                        {app.rejectionMessage}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      }
                    </>
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </div>

      <Alert variant="loading" isOpen={acting !== null} onClose={() => {}} message="Processing…" />
      <Alert variant="success" isOpen={volSuccess !== null} message={volSuccess ?? ""} onClose={() => setVolSuccess(null)} />
      <Alert variant="success" isOpen={memberSuccess !== null} message={memberSuccess ?? ""} onClose={() => setMemberSuccess(null)} />
      <Alert variant="error" isOpen={actionError !== null} message={actionError ?? ""} onClose={() => setActionError(null)} />

      <Alert isOpen={confirmResign} onClose={() => setConfirmResign(false)}>
        <h3 className={styles.confirmTitle}>Resign as Lead?</h3>
        <p className={styles.confirmText}>
          Are you sure you want to resign as lead of <strong>{selectedClub?.name}</strong>? The club will become leaderless and you will remain a regular member. Any pending lead-role requests will be forwarded to the admin. This cannot be undone.
        </p>
        <div className={styles.confirmBtns}>
          <button className={styles.btnCancel} onClick={() => setConfirmResign(false)}>Cancel</button>
          <button className={styles.btnDanger} onClick={handleResign}>Resign</button>
        </div>
      </Alert>

      <Alert isOpen={confirmRemoveMemberId !== null} onClose={() => setConfirmRemoveMemberId(null)}>
        <h3 className={styles.confirmTitle}>Remove Member?</h3>
        <p className={styles.confirmText}>
          Are you sure you want to remove <strong>{confirmRemoveMemberName}</strong> from the club? They will lose access to club activities.
        </p>
        <div className={styles.confirmBtns}>
          <button className={styles.btnCancel} onClick={() => setConfirmRemoveMemberId(null)}>Cancel</button>
          <button className={styles.btnDanger} onClick={() => handleRemoveMember(confirmRemoveMemberId!)}>Remove</button>
        </div>
      </Alert>

      {rejectingMemberRequestId !== null && (
        <RejectApplicationModal
          isOpen={true}
          onClose={() => setRejectingMemberRequestId(null)}
          studentName={rejectingMemberRequestName}
          onSubmit={(message) => handleDecideRequest(rejectingMemberRequestId, "rejected", message)}
        />
      )}

      {rejectingLeadRequestId !== null && (
        <RejectApplicationModal
          isOpen={true}
          onClose={() => setRejectingLeadRequestId(null)}
          studentName={rejectingLeadRequestName}
          requireMessage
          onSubmit={(message) => handleDecideLeadRequest(rejectingLeadRequestId, "rejected", message)}
        />
      )}

      <CreateClubModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
      <Alert
        variant="success"
        isOpen={createSuccess}
        message="Your club request has been submitted. The admin will review it and notify you via your dashboard."
        onClose={() => setCreateSuccess(false)}
      />
      {rejectingAppId !== null && (
        <RejectApplicationModal
          isOpen={true}
          onClose={() => setRejectingAppId(null)}
          studentName={volApps.find(a => a.applicationId === rejectingAppId)?.studentName ?? "Student"}
          onSubmit={(msg) => handleDecideVolApp(rejectingAppId, "rejected", msg)}
        />
      )}
    </div>
  );
}
