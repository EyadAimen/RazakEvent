"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Pencil, Trash2, Users, CalendarCheck, Target,
  X, Loader2, Building2,
} from "lucide-react";
import Alert from "@/components/shared/alertComponent/alert";
import { apiFetchAuth } from "@/lib/api";
import {
  fetchAdminClub, fetchAdminClubMembers, fetchAdminClubEvents,
  updateClub, dissolveClub, removeAdminClubMember,
} from "../utils/services/admin-clubs.service";
import type {
  AdminClubDetail, AdminClubMember, AdminClubEvent, UpdateClubPayload,
} from "../utils/interfaces/admin-clubs.interface";
import styles from "./page.module.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

type Tab = "about" | "members" | "events";

function initials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

function fmt(dateStr: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(dateStr).toLocaleDateString("en-MY", opts ?? { year: "numeric", month: "long" });
}

function statusColor(s: string) {
  if (s === "approved") return "#10B981";
  if (s === "ongoing") return "#3B6FD4";
  if (s === "completed") return "#6366f1";
  return "#94A3B8";
}

// ── Edit Club Modal ───────────────────────────────────────────────────────────

type UserOption = { id: string; fullName: string; role: string; staffOrMatricId: string | null };

function EditClubModal({
  club, isOpen, onClose, onSaved,
}: {
  club: AdminClubDetail;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName]               = useState(club.name);
  const [description, setDesc]        = useState(club.description);
  const [category, setCategory]       = useState(club.category ?? "");
  const [faculty, setFaculty]         = useState(club.facultyAdvisor ?? "");
  const [objText, setObjText]         = useState(club.objectives.join("\n"));
  const [leadId, setLeadId]           = useState<string>(club.lead?.id ?? "");
  const [users, setUsers]             = useState<UserOption[]>([]);
  const [userSearch, setUserSearch]   = useState("");
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [saving, setSaving]           = useState(false);
  const [apiError, setApiError]       = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(club.name); setDesc(club.description);
      setCategory(club.category ?? ""); setFaculty(club.facultyAdvisor ?? "");
      setObjText(club.objectives.join("\n")); setErrors({}); setApiError("");
      setLeadId(club.lead?.id ?? "");
      setUserSearch("");
      // Fetch all users for lead assignment
      apiFetchAuth<{ success: boolean; data: UserOption[] }>("/users")
        .then(r => setUsers(r.data))
        .catch(() => setUsers([]));
    }
  }, [isOpen, club]);

  if (!isOpen) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!description.trim()) e.description = "Description is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;
    setSaving(true);
    try {
      const objectives = objText.split("\n").map(s => s.trim()).filter(Boolean);
      const payload: UpdateClubPayload = {
        name, description,
        category: category || undefined,
        facultyAdvisor: faculty || undefined,
        objectives,
        leadId: leadId || null,
      };
      await updateClub(String(club.id), payload);
      onSaved();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = userSearch
    ? users.filter(u =>
        u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.staffOrMatricId ?? "").toLowerCase().includes(userSearch.toLowerCase())
      )
    : users;

  const selectedUser = users.find(u => u.id === leadId);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.modalLabel}>ADMIN ACTION</p>
            <h2 className={styles.modalTitle}>Edit Club</h2>
          </div>
          <button className={styles.modalClose} onClick={onClose}><X size={16} /></button>
        </div>
        <form className={styles.modalBody} onSubmit={handleSave} noValidate>
          {apiError && <p className={styles.apiError}>{apiError}</p>}

          <div className={styles.field}>
            <label className={styles.fieldLabel}>NAME <span className={styles.req}>*</span></label>
            <input className={`${styles.input} ${errors.name ? styles.inputErr : ""}`} value={name}
              onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: "" })); }} />
            {errors.name && <p className={styles.fieldError}>{errors.name}</p>}
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>CATEGORY</label>
              <input className={styles.input} value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Technology" />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>FACULTY ADVISOR</label>
              <input className={styles.input} value={faculty} onChange={e => setFaculty(e.target.value)} placeholder="e.g. Dr. Azlan Rashid" />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>DESCRIPTION <span className={styles.req}>*</span></label>
            <textarea className={`${styles.textarea} ${errors.description ? styles.inputErr : ""}`} value={description}
              onChange={e => { setDesc(e.target.value); setErrors(p => ({ ...p, description: "" })); }} rows={3} />
            {errors.description && <p className={styles.fieldError}>{errors.description}</p>}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>OBJECTIVES <span className={styles.optional}>(one per line)</span></label>
            <textarea className={styles.textarea} value={objText} onChange={e => setObjText(e.target.value)} rows={5}
              placeholder={"Host monthly events\nConduct workshops\nCollaborate with industry"} />
          </div>

          {/* ── Lead Assignment ─────────────────────────────────────── */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>CLUB LEAD</label>
            {selectedUser && (
              <p className={styles.currentLead}>
                Currently: <strong>{selectedUser.fullName}</strong>
                {selectedUser.staffOrMatricId ? ` (${selectedUser.staffOrMatricId})` : ""}
              </p>
            )}
            <input
              className={styles.input}
              placeholder="Search by name or ID…"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
            />
            <select
              className={styles.select}
              value={leadId}
              onChange={e => { setLeadId(e.target.value); setUserSearch(""); }}
              size={5}
            >
              <option value="">— Unassigned —</option>
              {filteredUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.fullName}{u.staffOrMatricId ? ` (${u.staffOrMatricId})` : ""} · {u.role}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Dissolve Confirmation ─────────────────────────────────────────────────────

function DissolveConfirm({
  clubName, isOpen, onClose, onConfirm, dissolving,
}: { clubName: string; isOpen: boolean; onClose: () => void; onConfirm: () => void; dissolving: boolean }) {
  if (!isOpen) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.confirmModal}`} onClick={e => e.stopPropagation()}>
        <div className={styles.confirmHeader}>
          <Trash2 size={28} className={styles.confirmIcon} />
          <h2 className={styles.confirmTitle}>Dissolve Club</h2>
          <p className={styles.confirmSub}>
            This will permanently delete <strong>{clubName}</strong>, remove all members, and downgrade the lead to student.
            This action cannot be undone.
          </p>
        </div>
        <div className={styles.confirmActions}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={dissolving}>Cancel</button>
          <button className={styles.dissolveConfirmBtn} onClick={onConfirm} disabled={dissolving}>
            {dissolving ? "Dissolving…" : "Yes, Dissolve"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminClubDetailPage({ params }: { params: Promise<{ clubId: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { clubId } = resolvedParams;

  const [club, setClub]           = useState<AdminClubDetail | null>(null);
  const [members, setMembers]     = useState<AdminClubMember[]>([]);
  const [events, setEvents]       = useState<AdminClubEvent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("about");
  const [showEdit, setShowEdit]   = useState(false);
  const [showDissolve, setShowDissolve] = useState(false);
  const [dissolving, setDissolving]     = useState(false);
  const [removing, setRemoving]         = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [actionError, setActionError]   = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [c, m, e] = await Promise.all([
        fetchAdminClub(clubId),
        fetchAdminClubMembers(clubId),
        fetchAdminClubEvents(clubId),
      ]);
      setClub(c); setMembers(m); setEvents(e);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load club");
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => { load(); }, [load]);

  const handleDissolve = async () => {
    setDissolving(true);
    try {
      await dissolveClub(clubId);
      router.replace("/clubs");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to dissolve club.");
      setDissolving(false);
      setShowDissolve(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (removing) return;
    setRemoving(userId);
    try {
      await removeAdminClubMember(clubId, userId);
      setMembers(prev => prev.filter(m => m.userId !== userId));
      setClub(prev => prev ? { ...prev, memberCount: prev.memberCount - 1 } : prev);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to remove member.");
    } finally {
      setRemoving(null);
    }
  };

  if (loading) return (
    <div className={styles.loadingPage}>
      <Loader2 size={36} className={styles.spinner} />
      <p>Loading club…</p>
    </div>
  );

  if (error || !club) return (
    <div className={styles.loadingPage}>
      <p className={styles.errorText}>⚠ {error ?? "Club not found."}</p>
      <button className={styles.backLinkBtn} onClick={() => router.back()}>← Go back</button>
    </div>
  );

  const typeLabel = club.type === "community" ? "COMMUNITY" : "CLUB";

  return (
    <div className={styles.page}>

      {/* ── Back link ──────────────────────────────────────────────────── */}
      <div className={styles.topBar}>
        <button className={styles.backLink} onClick={() => router.push("/clubs")}>
          <ArrowLeft size={14} /> Back to All Clubs
        </button>
      </div>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <p className={styles.adminLabel}>ADMIN VIEW</p>
            <div className={styles.headerBadges}>
              <span className={club.type === "club" ? styles.chipClub : styles.chipCommunity}>
                {club.type === "club" ? <Building2 size={10} /> : <Users size={10} />}
                {typeLabel}
              </span>
              {club.category && <span className={styles.categoryChip}>{club.category}</span>}
            </div>
            <h1 className={styles.clubName}>{club.name}</h1>
            <p className={styles.clubMeta}>
              Est. {fmt(club.createdAt, { year: "numeric", month: "long" })}
              {club.facultyAdvisor ? ` · Advisor: ${club.facultyAdvisor}` : ""}
            </p>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.headerStats}>
              <div className={styles.headerStat}>
                <span className={styles.headerStatValue}>{club.memberCount}</span>
                <span className={styles.headerStatLabel}><Users size={11} />MEMBERS</span>
              </div>
              <div className={styles.headerStatDivider} />
              <div className={styles.headerStat}>
                <span className={styles.headerStatValue}>{club.eventCount}</span>
                <span className={styles.headerStatLabel}><CalendarCheck size={11} />EVENTS</span>
              </div>
              <div className={styles.headerStatDivider} />
              <div className={styles.headerStat}>
                <span className={styles.headerStatValue}>{club.objectiveCount}</span>
                <span className={styles.headerStatLabel}><Target size={11} />OBJECTIVES</span>
              </div>
            </div>
            <button className={styles.editBtn} onClick={() => setShowEdit(true)}>
              <Pencil size={13} /> Edit Club
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className={styles.tabBar}>
        <div className={styles.tabBarInner}>
          {(["about", "members", "events"] as Tab[]).map(t => (
            <button
              key={t}
              className={`${styles.tab} ${activeTab === t ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(t)}
            >
              {t === "about" && <Building2 size={13} />}
              {t === "members" && <Users size={13} />}
              {t === "events" && <CalendarCheck size={13} />}
              {t === "about" ? "About & Info" : t.charAt(0).toUpperCase() + t.slice(1)}
              {t === "members" && (
                <span className={styles.tabCount}>{members.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className={styles.content}>

        {/* ── About & Info ─────────────────────────────────────────────── */}
        {activeTab === "about" && (
          <div className={styles.aboutGrid}>
            <div className={styles.aboutLeft}>
              <div className={styles.infoCard}>
                <div className={styles.infoCardHeader}>
                  <span className={styles.infoCardLabel}>ABOUT THIS CLUB</span>
                  <button className={styles.editInlineBtn} onClick={() => setShowEdit(true)}>
                    <Pencil size={12} /> Edit
                  </button>
                </div>
                <p className={styles.descriptionText}>{club.description}</p>
              </div>

              {club.objectives.length > 0 && (
                <div className={styles.infoCard}>
                  <span className={styles.infoCardLabel}>OBJECTIVES</span>
                  <ol className={styles.objectivesList}>
                    {club.objectives.map((obj, i) => (
                      <li key={i} className={styles.objectiveItem}>
                        <span className={styles.objectiveNum}>{i + 1}</span>
                        {obj}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            <div className={styles.aboutRight}>
              <div className={styles.detailsSidebar}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>CATEGORY</span>
                  <span className={styles.detailValue}>{club.category ?? "—"}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>TYPE</span>
                  <span className={styles.detailValue}>{club.type === "community" ? "Community" : "Club"}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>FOUNDED</span>
                  <span className={styles.detailValue}>{fmt(club.createdAt, { year: "numeric", month: "long" })}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>FACULTY ADVISOR</span>
                  <span className={styles.detailValue}>{club.facultyAdvisor ?? "—"}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>MEMBERS</span>
                  <span className={styles.detailValue}>{club.memberCount} students</span>
                </div>
                {club.lead && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>CLUB LEAD</span>
                    <span className={styles.detailValue}>{club.lead.fullName}</span>
                  </div>
                )}
              </div>

              <button className={styles.manageSettingsBtn} onClick={() => setShowEdit(true)}>
                <Pencil size={13} /> Manage Settings
              </button>
              <button className={styles.dissolveBtn} onClick={() => setShowDissolve(true)}>
                <Trash2 size={13} /> Dissolve Club
              </button>
            </div>
          </div>
        )}

        {/* ── Members ──────────────────────────────────────────────────── */}
        {activeTab === "members" && (
          <div className={styles.tableCard}>
            <div className={styles.tableToolbar}>
              <span className={styles.tableCount}>Showing {members.length} member{members.length !== 1 ? "s" : ""}</span>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>MEMBER</th>
                  <th>STUDENT ID</th>
                  <th>EMAIL</th>
                  <th>ROLE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr><td colSpan={5} className={styles.emptyRow}>No members yet.</td></tr>
                ) : members.map(m => (
                  <tr key={m.userId}>
                    <td>
                      <div className={styles.memberCell}>
                        <div className={styles.avatar}>{initials(m.fullName)}</div>
                        <div>
                          <p className={styles.memberName}>{m.fullName}</p>
                          <p className={styles.memberSub}>
                            Joined {fmt(m.joinedAt, { year: "numeric", month: "short" })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={styles.monoCell}>{m.staffOrMatricId ?? "—"}</td>
                    <td className={styles.monoCell}>{m.email}</td>
                    <td>
                      <span className={m.role === "lead" ? styles.roleLead : styles.roleMember}>
                        {m.role === "lead" ? "LEADER" : "MEMBER"}
                      </span>
                    </td>
                    <td>
                      {m.role !== "lead" && (
                        <button
                          className={styles.removeBtn}
                          onClick={() => handleRemoveMember(m.userId)}
                          disabled={removing === m.userId}
                          title="Remove member"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Events ───────────────────────────────────────────────────── */}
        {activeTab === "events" && (
          <div className={styles.tableCard}>
            <div className={styles.tableToolbar}>
              <span className={styles.tableCount}>{events.length} event{events.length !== 1 ? "s" : ""}</span>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>EVENT</th>
                  <th>DATE</th>
                  <th>LOCATION</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr><td colSpan={4} className={styles.emptyRow}>No events for this club.</td></tr>
                ) : events.map(ev => (
                  <tr key={ev.id}>
                    <td>
                      <p className={styles.eventName}>{ev.name}</p>
                      <p className={styles.eventSub}>{ev.volunteeringStatus === "open" ? "Volunteering open" : ""}</p>
                    </td>
                    <td className={styles.dateCell}>
                      {new Date(ev.eventDate).toLocaleDateString("en-MY", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className={styles.locationCell}>{ev.venueName ?? "—"}</td>
                    <td>
                      <span className={styles.statusDot} style={{ background: statusColor(ev.status) }} />
                      <span className={styles.statusText}>{ev.status.replace("_", " ")}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modals / Alerts ─────────────────────────────────────────────── */}
      {club && (
        <EditClubModal
          club={club} isOpen={showEdit}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); setActionSuccess("Club updated."); load(); }}
        />
      )}
      <DissolveConfirm
        clubName={club.name} isOpen={showDissolve}
        onClose={() => setShowDissolve(false)}
        onConfirm={handleDissolve}
        dissolving={dissolving}
      />
      <Alert variant="loading" isOpen={removing !== null} onClose={() => {}} message="Removing member…" />
      <Alert variant="error" isOpen={actionError !== null} message={actionError ?? ""} onClose={() => setActionError(null)} />
      <Alert variant="success" isOpen={actionSuccess !== null} message={actionSuccess ?? ""} onClose={() => setActionSuccess(null)} />
    </div>
  );
}
