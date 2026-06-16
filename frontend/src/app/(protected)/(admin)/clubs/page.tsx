"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Check, X, Eye, Pencil, Trash2, Loader2, Building2, Users, FileText,
} from "lucide-react";
import Alert from "@/components/shared/alertComponent/alert";
import {
  fetchAdminClubs, fetchAdminPendingRequests, decideClubRequest, createOfficialClub,
} from "./utils/services/admin-clubs.service";
import type { AdminClubSummary, AdminClubRequest, CreateOfficialClubPayload } from "./utils/interfaces/admin-clubs.interface";
import styles from "./page.module.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

function letterUrl(storedPath: string): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace(/\/api$/, "");
  return `${base}/${storedPath.replace(/\\/g, "/")}`;
}

function daysAgo(dateStr: string) {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (d === 0) return "Today";
  if (d === 1) return "1 day ago";
  return `${d} days ago`;
}

function formatEst(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-MY", { year: "numeric", month: "short" });
}

// ── Create Club Modal ─────────────────────────────────────────────────────────

function CreateClubModal({
  isOpen, onClose, onSuccess,
}: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [type, setType]                 = useState<"club" | "community">("club");
  const [name, setName]                 = useState("");
  const [category, setCategory]         = useState("");
  const [description, setDescription]   = useState("");
  const [facultyAdvisor, setFaculty]    = useState("");
  const [errors, setErrors]             = useState<Record<string, string>>({});
  const [submitting, setSubmitting]     = useState(false);
  const [apiError, setApiError]         = useState("");

  if (!isOpen) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Club name is required";
    else if (name.trim().length < 3) e.name = "At least 3 characters";
    if (!description.trim()) e.description = "Description is required";
    else if (description.trim().length < 20) e.description = "At least 20 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const reset = () => {
    setType("club"); setName(""); setCategory(""); setDescription(""); setFaculty("");
    setErrors({}); setApiError("");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createOfficialClub({ name, type, description, category, facultyAdvisor, objectives: [] } as CreateOfficialClubPayload);
      reset();
      onSuccess();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to create club.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.modalLabel}>ADMIN ACTION</p>
            <h2 className={styles.modalTitle}>Create Official Club</h2>
            <p className={styles.modalSub}>Club is created immediately and listed as active.</p>
          </div>
          <button className={styles.modalClose} onClick={handleClose}><X size={16} /></button>
        </div>

        <form className={styles.modalBody} onSubmit={handleSubmit} noValidate>
          {apiError && <p className={styles.apiError}>{apiError}</p>}

          <div className={styles.field}>
            <label className={styles.fieldLabel}>TYPE <span className={styles.req}>*</span></label>
            <div className={styles.typeToggle}>
              <button type="button" className={`${styles.typeBtn} ${type === "club" ? styles.typeBtnActive : ""}`} onClick={() => setType("club")}>
                <Building2 size={13} /> Club
              </button>
              <button type="button" className={`${styles.typeBtn} ${type === "community" ? styles.typeBtnActive : ""}`} onClick={() => setType("community")}>
                <Users size={13} /> Community
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>NAME <span className={styles.req}>*</span></label>
            <input className={`${styles.input} ${errors.name ? styles.inputError : ""}`} value={name}
              onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: "" })); }}
              placeholder="e.g. Cybersecurity KTR" maxLength={101} />
            {errors.name && <p className={styles.fieldError}>{errors.name}</p>}
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>CATEGORY</label>
              <input className={styles.input} value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Technology" maxLength={51} />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>FACULTY ADVISOR</label>
              <input className={styles.input} value={facultyAdvisor} onChange={e => setFaculty(e.target.value)} placeholder="e.g. Dr. Azlan Rashid" />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>DESCRIPTION <span className={styles.req}>*</span></label>
            <textarea className={`${styles.textarea} ${errors.description ? styles.inputError : ""}`} value={description}
              onChange={e => { setDescription(e.target.value); setErrors(p => ({ ...p, description: "" })); }}
              placeholder="Describe the club's purpose and activities…" rows={3} maxLength={501} />
            {errors.description && <p className={styles.fieldError}>{errors.description}</p>}
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={handleClose} disabled={submitting}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? "Creating…" : "Create Club"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Reject Modal ─────────────────────────────────────────────────────────────

function RejectModal({
  clubName, isOpen, onClose, onConfirm, submitting,
}: {
  clubName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => void;
  submitting: boolean;
}) {
  const [comment, setComment] = useState("");
  const [error, setError]     = useState("");

  if (!isOpen) return null;

  const handleClose = () => { setComment(""); setError(""); onClose(); };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!comment.trim()) { setError("A reason is required when rejecting."); return; }
    onConfirm(comment.trim());
  };

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.modalLabel}>ADMIN ACTION</p>
            <h2 className={styles.modalTitle}>Reject Club Request</h2>
            <p className={styles.modalSub}>{clubName}</p>
          </div>
          <button className={styles.modalClose} onClick={handleClose}><X size={16} /></button>
        </div>
        <form className={styles.modalBody} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>REASON FOR REJECTION <span className={styles.req}>*</span></label>
            <textarea
              className={`${styles.textarea} ${error ? styles.inputError : ""}`}
              value={comment}
              onChange={e => { setComment(e.target.value); setError(""); }}
              placeholder="Explain why this request is being rejected…"
              rows={4}
              autoFocus
            />
            {error && <p className={styles.fieldError}>{error}</p>}
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={handleClose} disabled={submitting}>Cancel</button>
            <button type="submit" className={styles.rejectSubmitBtn} disabled={submitting}>
              {submitting ? "Rejecting…" : "Confirm Rejection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminClubsPage() {
  const router = useRouter();
  const [clubs, setClubs]               = useState<AdminClubSummary[]>([]);
  const [pending, setPending]           = useState<AdminClubRequest[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [deciding, setDeciding]         = useState<string | null>(null);
  const [showCreate, setShowCreate]     = useState(false);
  const [expanded, setExpanded]         = useState<Set<string>>(new Set());
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);
  const [actionError, setActionError]   = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [c, p] = await Promise.all([fetchAdminClubs(), fetchAdminPendingRequests()]);
      setClubs(c);
      setPending(p);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const handleApprove = async (id: string) => {
    if (deciding !== null) return;
    setDeciding(id);
    try {
      await decideClubRequest(id, "approved");
      setPending(prev => prev.filter(r => r.id !== id));
      setActionSuccess("Club approved and is now active.");
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setDeciding(null);
    }
  };

  const handleRejectConfirm = async (comment: string) => {
    if (!rejectTarget || deciding !== null) return;
    setDeciding(rejectTarget.id);
    try {
      await decideClubRequest(rejectTarget.id, "rejected", comment);
      setPending(prev => prev.filter(r => r.id !== rejectTarget.id));
      setRejectTarget(null);
      setActionSuccess("Club request rejected.");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setDeciding(null);
    }
  };

  const filteredClubs = clubs.filter(c => {
    if (!search) return true;
    const t = search.toLowerCase();
    return c.name.toLowerCase().includes(t) ||
      (c.lead?.fullName ?? "").toLowerCase().includes(t) ||
      (c.category ?? "").toLowerCase().includes(t);
  });

  const toggleExpand = (id: string) =>
    setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  if (loading) return (
    <div className={styles.loadingPage}>
      <Loader2 size={36} className={styles.spinner} />
      <p>Loading clubs…</p>
    </div>
  );

  return (
    <div className={styles.page}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            <p className={styles.headerLabel}>ADMIN CONTROL PANEL</p>
            <h1 className={styles.headerTitle}>Club &amp; Community Management</h1>
            <p className={styles.headerSub}>Review proposals · Manage active clubs · Oversee membership</p>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.statsRow}>
              <div className={styles.statBadge}>
                <span className={styles.statValue}>{clubs.length}</span>
                <span className={styles.statLabel}>ACTIVE CLUBS</span>
              </div>
              <div className={`${styles.statBadge} ${styles.statBadgePending}`}>
                <span className={styles.statValue}>{pending.length}</span>
                <span className={styles.statLabel}>PENDING REVIEW</span>
              </div>
            </div>
            <button className={styles.ctaBtn} onClick={() => setShowCreate(true)}>
              <Plus size={15} /> Create Official Club
            </button>
          </div>
        </div>
      </div>

      <div className={styles.content}>

        {/* ── Pending Approvals ────────────────────────────────────────── */}
        {pending.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Pending Approvals</h2>
              <span className={styles.awaitingBadge}>{pending.length} awaiting review</span>
            </div>
            <div className={styles.requestGrid}>
              {pending.map(req => {
                const isExpanded = expanded.has(req.id);
                return (
                  <div key={req.id} className={styles.requestCard}>
                    <div className={styles.cardTopRow}>
                      <span className={req.clubType === "club" ? styles.chipClub : styles.chipCommunity}>
                        {req.clubType === "club" ? <Building2 size={10} /> : <Users size={10} />}
                        {req.clubType.toUpperCase()}
                      </span>
                      <span className={styles.timeAgo}>{daysAgo(req.submittedAt)}</span>
                    </div>

                    <h3 className={styles.requestName}>{req.clubName}</h3>
                    {req.category && <p className={styles.requestCategory}>{req.category}</p>}
                    <p className={styles.requestDesc}>
                      {isExpanded ? req.description : req.description.slice(0, 120) + (req.description.length > 120 ? "…" : "")}
                    </p>
                    {req.description.length > 120 && (
                      <button className={styles.readMore} onClick={() => toggleExpand(req.id)}>
                        {isExpanded ? "Show less" : "Read more"}
                      </button>
                    )}

                    {req.supportingLetterPath && (
                      <a
                        href={letterUrl(req.supportingLetterPath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.letterLink}
                      >
                        <FileText size={13} /> View Supporting Letter
                      </a>
                    )}

                    {req.student && (
                      <div className={styles.requestorRow}>
                        <div className={styles.avatar}>{initials(req.student.fullName)}</div>
                        <div>
                          <p className={styles.requestorName}>{req.student.fullName}</p>
                          <p className={styles.requestorId}>{req.student.staffOrMatricId ?? "—"}</p>
                        </div>
                      </div>
                    )}

                    <div className={styles.cardActions}>
                      <button className={styles.approveBtn} onClick={() => handleApprove(req.id)} disabled={deciding === req.id}>
                        <Check size={13} /> Approve
                      </button>
                      <button className={styles.rejectBtn} onClick={() => setRejectTarget({ id: req.id, name: req.clubName })} disabled={deciding === req.id}>
                        <X size={13} /> Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Active Clubs Table ───────────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Active Clubs &amp; Communities</h2>
            <span className={styles.countBadge}>{filteredClubs.length}</span>
          </div>

          <div className={styles.tableCard}>
            <div className={styles.tableToolbar}>
              <div className={styles.searchWrap}>
                <Search size={14} className={styles.searchIcon} />
                <input
                  className={styles.searchInput}
                  placeholder="Search clubs, leads…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>CLUB NAME</th>
                  <th>TYPE</th>
                  <th>CATEGORY</th>
                  <th>CLUB LEAD</th>
                  <th>MEMBERS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredClubs.length === 0 ? (
                  <tr><td colSpan={6} className={styles.emptyRow}>No clubs found.</td></tr>
                ) : filteredClubs.map(club => (
                  <tr key={club.id}>
                    <td>
                      <p className={styles.clubNameMain}>{club.name}</p>
                      <p className={styles.estDate}>Est. {formatEst(club.createdAt)}</p>
                    </td>
                    <td>
                      <span className={club.type === "club" ? styles.chipClub : styles.chipCommunity}>
                        {club.type === "club" ? <Building2 size={10} /> : <Users size={10} />}
                        {club.type.toUpperCase()}
                      </span>
                    </td>
                    <td className={styles.categoryCell}>{club.category ?? "—"}</td>
                    <td>
                      {club.lead ? (
                        <div className={styles.leadCell}>
                          <div className={`${styles.avatar} ${styles.avatarSm}`}>{initials(club.lead.fullName)}</div>
                          <span>{club.lead.fullName}</span>
                        </div>
                      ) : <span className={styles.noLead}>Unassigned</span>}
                    </td>
                    <td className={styles.memberCount}>
                      <Users size={13} /> {club.memberCount}
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button className={`${styles.iconBtn} ${styles.viewBtn}`} title="View"
                          onClick={() => router.push(`/clubs/${club.id}`)}>
                          <Eye size={14} />
                        </button>
                        <button className={`${styles.iconBtn} ${styles.editBtn}`} title="Edit"
                          onClick={() => router.push(`/clubs/${club.id}`)}>
                          <Pencil size={14} />
                        </button>
                        <button className={`${styles.iconBtn} ${styles.deleteBtn}`} title="Dissolve"
                          onClick={() => router.push(`/clubs/${club.id}`)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ── Modals / Alerts ─────────────────────────────────────────────── */}
      <CreateClubModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => { setShowCreate(false); setActionSuccess("Club created successfully."); reload(); }}
      />
      <RejectModal
        clubName={rejectTarget?.name ?? ""}
        isOpen={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
        submitting={deciding !== null}
      />
      <Alert variant="loading" isOpen={deciding !== null} onClose={() => {}} message="Processing…" />
      <Alert variant="error" isOpen={actionError !== null} message={actionError ?? ""} onClose={() => setActionError(null)} />
      <Alert variant="success" isOpen={actionSuccess !== null} message={actionSuccess ?? ""} onClose={() => setActionSuccess(null)} />
    </div>
  );
}
