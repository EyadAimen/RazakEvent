"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Users, CalendarCheck, Loader2, Check, X, Trash2, Plus, Clock } from "lucide-react";
import Triangle from "@/components/shared/triangle/triangle";
import { apiFetchAuth } from "@/lib/api";
import type { ApprovedClub, PendingClubItem, ClubItem, ClubMember, MembershipRequest, ClubTab } from "@/types/lead";
import Alert from "@/components/shared/alertComponent/alert";
import CreateClubModal from "@/components/lead/CreateClubModal/CreateClubModal";
import styles from "./page.module.css";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MyClubPage() {
  const [clubs, setClubs]             = useState<ClubItem[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [members, setMembers]         = useState<ClubMember[]>([]);
  const [requests, setRequests]       = useState<MembershipRequest[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [tab, setTab]                 = useState<ClubTab>("members");
  const [search, setSearch]           = useState("");
  const [acting, setActing]           = useState<string | number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSuccess, setCreateSuccess]     = useState(false);

  // ── Derived selection ──────────────────────────────────────────────────────

  const selectedItem = clubs.find(c =>
    c.status === "approved"
      ? `club-${c.id}` === selectedKey
      : `pending-${c.requestId}` === selectedKey
  ) ?? null;

  const selectedClub = selectedItem?.status === "approved" ? selectedItem as ApprovedClub : null;

  // ── Load management data for an approved club ──────────────────────────────

  const loadClubData = useCallback(async (clubId: number) => {
    const [membersData, requestsData] = await Promise.all([
      apiFetchAuth<{ members: ClubMember[] }>(`/clubs/mine/members?clubId=${clubId}`),
      apiFetchAuth<{ requests: MembershipRequest[] }>(`/clubs/mine/membership-requests?clubId=${clubId}`),
    ]);
    setMembers(membersData.members);
    setRequests(requestsData.requests);
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
        const key = first.status === "approved" ? `club-${first.id}` : `pending-${first.requestId}`;
        setSelectedKey(key);
        if (first.status === "approved") await loadClubData(first.id);
      })
      .catch(err => setError(err.message ?? "Failed to load clubs"))
      .finally(() => setLoading(false));
  }, [fetchAllClubs, loadClubData]);

  // ── Club switcher ──────────────────────────────────────────────────────────

  const handleSelectItem = async (item: ClubItem) => {
    const key = item.status === "approved" ? `club-${item.id}` : `pending-${item.requestId}`;
    setSelectedKey(key);
    setSearch("");
    setTab("members");
    if (item.status === "approved") {
      await loadClubData(item.id).catch(() => {});
    } else {
      setMembers([]);
      setRequests([]);
    }
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleDecideRequest = async (requestId: number, decision: "approved" | "rejected") => {
    if (!selectedClub || acting !== null) return;
    setActing(requestId);
    try {
      await apiFetchAuth(`/clubs/mine/membership-requests/${requestId}/decision?clubId=${selectedClub.id}`, {
        method: "PATCH",
        body: JSON.stringify({ decision }),
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
      if (decision === "approved") loadClubData(selectedClub.id).catch(() => {});
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActing(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedClub || acting !== null) return;
    setActing(userId);
    try {
      await apiFetchAuth(`/clubs/mine/members/${userId}?clubId=${selectedClub.id}`, { method: "DELETE" });
      setMembers(prev => prev.filter(m => m.userId !== userId));
      setClubs(prev => prev.map(c =>
        c.status === "approved" && c.id === selectedClub.id
          ? { ...c, memberCount: c.memberCount - 1 }
          : c
      ));
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to remove member.");
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

        <Triangle style={{ left: "0px",   top: "60px",     transform: "rotate(-20deg)", borderBottomColor: "var(--color-semantic-red)"   }} />
        <Triangle style={{ right: "30px", top: "40px",     transform: "rotate(10deg)",  borderBottomColor: "var(--color-primary-800)"    }} />
        <Triangle style={{ left: "20px",  bottom: "120px", transform: "rotate(-10deg)", borderBottomColor: "var(--color-primary-500)"    }} />
        <Triangle style={{ right: "0px",  bottom: "60px",  transform: "rotate(20deg)",  borderBottomColor: "var(--color-secondary-500)" }} />

        <div className={styles.inner}>

          {/* ── Club selector row ──────────────────────────────────────────── */}
          <div className={styles.selectorRow}>
            <div className={styles.selectorPills}>
              {clubs.map(item => {
                const key       = item.status === "approved" ? `club-${item.id}` : `pending-${item.requestId}`;
                const isActive  = key === selectedKey;
                const isPending = item.status === "pending";
                return (
                  <button
                    key={key}
                    className={`${styles.selectorPill} ${isActive ? styles.selectorPillActive : ""} ${isPending ? styles.selectorPillPending : ""}`}
                    onClick={() => handleSelectItem(item)}
                  >
                    {isPending && <Clock size={12} />}
                    {item.name}
                    {isPending && <span className={styles.pendingBadge}>Pending</span>}
                  </button>
                );
              })}
            </div>
            <button className={styles.createClubBtn} onClick={() => setShowCreateModal(true)}>
              <Plus size={14} />
              Create New Club / Community
            </button>
          </div>

          {/* ── Pending item view ──────────────────────────────────────────── */}
          {selectedItem?.status === "pending" && (() => {
            const p = selectedItem as PendingClubItem;
            return (
              <div className={styles.pendingCard}>
                <div className={styles.pendingHeader}>
                  <Clock size={22} className={styles.pendingIcon} />
                  <div>
                    <p className={styles.pendingStatus}>Pending Admin Review</p>
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
                <p className={styles.pendingNote}>
                  Your request is being reviewed by the admin. You will be notified via your dashboard once a decision has been made.
                </p>
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
                  { value: selectedClub.eventStats.total,    label: "Total Proposed", cls: ""              },
                  { value: selectedClub.eventStats.approved, label: "Approved",       cls: styles.approved },
                  { value: selectedClub.eventStats.rejected, label: "Rejected",       cls: styles.rejected },
                  { value: pendingDraft,                     label: "Pending / Draft", cls: styles.pending },
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
                    Manage Members
                  </button>
                  <button
                    className={`${styles.tabBtn} ${tab === "requests" ? styles.tabActive : ""}`}
                    onClick={() => setTab("requests")}
                  >
                    Volunteer Applications
                    {selectedClub.pendingRequests > 0 && (
                      <span className={styles.badge}>{selectedClub.pendingRequests}</span>
                    )}
                  </button>
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
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMembers.length === 0 ? (
                          <tr>
                            <td colSpan={4} className={styles.emptyRow}>No members found.</td>
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
                            <td>
                              {m.role !== "lead" && (
                                <button
                                  className={styles.removeBtn}
                                  onClick={() => handleRemoveMember(m.userId)}
                                  disabled={acting === m.userId}
                                  title="Remove member"
                                >
                                  <Trash2 size={13} /> Remove
                                </button>
                              )}
                            </td>
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
                                    onClick={() => handleDecideRequest(r.id, "rejected")}
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
            </>
          )}

        </div>
      </div>

      <Alert variant="loading" isOpen={acting !== null} onClose={() => {}} message="Processing…" />
      <Alert variant="error" isOpen={actionError !== null} message={actionError ?? ""} onClose={() => setActionError(null)} />

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
    </div>
  );
}
