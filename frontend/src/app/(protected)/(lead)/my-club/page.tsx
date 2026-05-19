"use client";

import { useEffect, useState } from "react";
import { Search, Users, CalendarCheck, Loader2, Check, X, Trash2 } from "lucide-react";
import Triangle from "@/components/shared/triangle/triangle";
import { apiFetchAuth } from "@/lib/api";
import type { ClubOverview, ClubMember, MembershipRequest, ClubTab } from "@/types/lead";
import Alert from "@/components/shared/alertComponent/alert";
import styles from "./page.module.css";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MyClubPage() {
  const [club, setClub]         = useState<ClubOverview | null>(null);
  const [members, setMembers]   = useState<ClubMember[]>([]);
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [tab, setTab]           = useState<ClubTab>("members");
  const [search, setSearch]     = useState("");
  const [acting, setActing]     = useState<string | number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetchAuth<ClubOverview>("/clubs/mine"),
      apiFetchAuth<{ members: ClubMember[] }>("/clubs/mine/members"),
      apiFetchAuth<{ requests: MembershipRequest[] }>("/clubs/mine/membership-requests"),
    ])
      .then(([clubData, membersData, requestsData]) => {
        setClub(clubData);
        setMembers(membersData.members);
        setRequests(requestsData.requests);
      })
      .catch(err => setError(err.message ?? "Failed to load club data"))
      .finally(() => setLoading(false));
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleDecideRequest = async (requestId: number, decision: "approved" | "rejected") => {
    if (acting !== null) return;
    setActing(requestId);
    try {
      await apiFetchAuth(`/clubs/mine/membership-requests/${requestId}/decision`, {
        method: "PATCH",
        body: JSON.stringify({ decision }),
      });
      setRequests(prev => prev.filter(r => r.id !== requestId));
      setClub(prev => {
        if (!prev) return prev;
        const delta = decision === "approved" ? { memberCount: prev.memberCount + 1 } : {};
        return { ...prev, ...delta, pendingRequests: prev.pendingRequests - 1 };
      });
      if (decision === "approved") {
        apiFetchAuth<{ members: ClubMember[] }>("/clubs/mine/members")
          .then(d => setMembers(d.members))
          .catch(() => {});
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActing(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (acting !== null) return;
    setActing(userId);
    try {
      await apiFetchAuth(`/clubs/mine/members/${userId}`, { method: "DELETE" });
      setMembers(prev => prev.filter(m => m.userId !== userId));
      setClub(prev => prev ? { ...prev, memberCount: prev.memberCount - 1 } : prev);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to remove member.");
    } finally {
      setActing(null);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const filteredMembers = members.filter(m =>
    !search ||
    m.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (m.staffOrMatricId ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // ── Loading / error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.stateBox}>
            <Loader2 size={32} className={styles.spinner} />
            <p>Loading club data…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <div className={`${styles.stateBox} ${styles.errorBox}`}>
            <p>⚠ {error ?? "Club not found."}</p>
          </div>
        </div>
      </div>
    );
  }

  const typeLabel = club.type === "community" ? "Community" : "Club";
  const pendingDraft = club.eventStats.total - club.eventStats.approved - club.eventStats.rejected;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <div className={styles.body}>

        <Triangle style={{ left: "0px",   top: "60px",     transform: "rotate(-20deg)", borderBottomColor: "var(--color-semantic-red)"   }} />
        <Triangle style={{ right: "30px", top: "40px",     transform: "rotate(10deg)",  borderBottomColor: "var(--color-primary-800)"    }} />
        <Triangle style={{ left: "20px",  bottom: "120px", transform: "rotate(-10deg)", borderBottomColor: "var(--color-primary-500)"    }} />
        <Triangle style={{ right: "0px",  bottom: "60px",  transform: "rotate(20deg)",  borderBottomColor: "var(--color-secondary-500)" }} />

        <div className={styles.inner}>

          {/* ── Club header card ──────────────────────────────────────────── */}
          <div className={styles.headerCard}>
            <div className={styles.headerLeft}>
              <span className={styles.typeTag}>{typeLabel}</span>
              <h1 className={styles.clubName}>{club.name}</h1>
              <p className={styles.description}>{club.description}</p>
            </div>
            <div className={styles.statsRow}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{club.memberCount}</span>
                <span className={styles.statLabel}><Users size={12} />MEMBERS</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statValue}>{club.eventStats.total}</span>
                <span className={styles.statLabel}><CalendarCheck size={12} />EVENTS</span>
              </div>
            </div>
          </div>

          {/* ── Event summary strip ───────────────────────────────────────── */}
          <div className={styles.eventStatsRow}>
            {[
              { value: club.eventStats.total,    label: "Total Proposed", cls: ""               },
              { value: club.eventStats.approved, label: "Approved",       cls: styles.approved  },
              { value: club.eventStats.rejected, label: "Rejected",       cls: styles.rejected  },
              { value: pendingDraft,             label: "Pending / Draft", cls: styles.pending  },
            ].map(s => (
              <div key={s.label} className={styles.eventStat}>
                <span className={`${styles.eventStatValue} ${s.cls}`}>{s.value}</span>
                <span className={styles.eventStatLabel}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* ── Tabs ──────────────────────────────────────────────────────── */}
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
              {club.pendingRequests > 0 && (
                <span className={styles.badge}>{club.pendingRequests}</span>
              )}
            </button>
          </div>

          {/* ── Members tab ───────────────────────────────────────────────── */}
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
                              <Trash2 size={13} />
                              Remove
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

          {/* ── Requests tab ──────────────────────────────────────────────── */}
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

        </div>
      </div>

      <Alert variant="loading" isOpen={acting !== null} onClose={() => {}} message="Processing…" />
      <Alert variant="error" isOpen={actionError !== null} message={actionError ?? ""} onClose={() => setActionError(null)} />
    </div>
  );
}
