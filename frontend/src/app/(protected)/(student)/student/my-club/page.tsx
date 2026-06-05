"use client";

import { useEffect, useRef, useState } from "react";
import { Users, CalendarCheck, Search, Loader2, UserCog, UploadCloud, FileCheck, X } from "lucide-react";
import Triangle from "@/components/shared/triangle/triangle";
import { apiFetchAuth } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { ClubMember } from "@/types/lead";
import styles from "./page.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
const MAX_MB   = 10;

// ── Types ─────────────────────────────────────────────────────────────────────

interface MemberClub {
  id: number;
  name: string;
  type: "club" | "community";
  description: string;
  category: string | null;
  memberCount: number;
  eventStats: { total: number; approved: number; rejected: number };
}

interface LeadRequestStatus {
  id: number;
  status: string;
  submittedAt: string;
}

// ── Apply-form modal ──────────────────────────────────────────────────────────

function ApplyLeadModal({
  clubName,
  clubId,
  onClose,
  onSuccess,
}: {
  clubName: string;
  clubId: number;
  onClose: () => void;
  onSuccess: (status: LeadRequestStatus) => void;
}) {
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const [message,     setMessage]     = useState("");
  const [docFile,     setDocFile]     = useState<File | null>(null);
  const [docError,    setDocError]    = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [formError,   setFormError]   = useState<string | null>(null);

  const handleFile = (f: File) => {
    if (f.type !== "application/pdf") { setDocError("Only PDF files are accepted."); return; }
    if (f.size > MAX_MB * 1024 * 1024) { setDocError(`Maximum file size is ${MAX_MB} MB.`); return; }
    setDocError("");
    setDocFile(f);
  };

  const handleSubmit = async () => {
    if (!message.trim()) { setFormError("Please provide a motivation message."); return; }
    setFormError(null);
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("clubId",  String(clubId));
      form.append("message", message.trim());
      if (docFile) form.append("supportingDoc", docFile);

      const token = getAccessToken();
      const res   = await fetch(`${API_BASE}/requests/lead-role`, {
        method:  "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body:    form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Submission failed");

      onSuccess({ id: data.requestId ?? 0, status: "pending_admin", submittedAt: new Date().toISOString() });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Apply to Become Club Lead</h2>
          <button className={styles.modalClose} onClick={onClose}><X size={18} /></button>
        </div>

        {/* Club info row */}
        <div className={styles.modalClubRow}>
          <span className={styles.modalClubLabel}>Club</span>
          <span className={styles.modalClubName}>{clubName}</span>
        </div>

        {/* Motivation */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Motivation / Statement of Intent *</label>
          <textarea
            className={`${styles.textarea} ${formError && !message.trim() ? styles.textareaError : ""}`}
            rows={5}
            placeholder="Explain why you want to become the club lead, your vision, and relevant experience…"
            value={message}
            onChange={e => { setMessage(e.target.value); setFormError(null); }}
          />
        </div>

        {/* Supporting document */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Supporting Document <span className={styles.optionalTag}>(Optional)</span>
          </label>
          <p className={styles.fieldHint}>
            Upload a CV, portfolio, or letter of intent as a PDF (max {MAX_MB} MB).
          </p>
          <div
            className={`${styles.dropZone} ${docFile ? styles.dropZoneFilled : ""} ${docError ? styles.dropZoneError : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className={styles.fileInput}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {docFile ? (
              <div className={styles.filePreview}>
                <FileCheck size={18} className={styles.fileIcon} />
                <span className={styles.fileName}>{docFile.name}</span>
                <span className={styles.fileSize}>{(docFile.size / 1024 / 1024).toFixed(2)} MB</span>
                <button type="button" className={styles.fileRemove}
                  onClick={e => { e.stopPropagation(); setDocFile(null); }}>
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className={styles.dropPrompt}>
                <UploadCloud size={22} className={styles.uploadIcon} />
                <p className={styles.dropText}>Drag &amp; drop or <span className={styles.browseLink}>browse</span></p>
                <p className={styles.dropHint}>PDF only · Max {MAX_MB} MB</p>
              </div>
            )}
          </div>
          {docError && <p className={styles.fieldError}>{docError}</p>}
        </div>

        {formError && <p className={styles.formError}>{formError}</p>}

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={submitting}>Cancel</button>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 size={14} className={styles.spinnerSm} /> : <UserCog size={14} />}
            Submit Application
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MemberMyClubPage() {
  const [club,        setClub]        = useState<MemberClub | null>(null);
  const [members,     setMembers]     = useState<ClubMember[]>([]);
  const [myLeadReq,   setMyLeadReq]   = useState<LeadRequestStatus | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [search,      setSearch]      = useState("");
  const [showForm,    setShowForm]    = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetchAuth<{ club: MemberClub | null }>("/clubs/member-club"),
      apiFetchAuth<{ request: LeadRequestStatus | null }>("/requests/lead-role/mine").catch(() => ({ request: null })),
    ])
      .then(([clubRes, leadReqRes]) => {
        setClub(clubRes.club);
        setMyLeadReq(leadReqRes.request);
        if (clubRes.club) {
          return apiFetchAuth<{ members: ClubMember[] }>(`/clubs/${clubRes.club.id}/members`);
        }
        return { members: [] };
      })
      .then(membersRes => setMembers(membersRes.members))
      .catch(err => setError(err.message ?? "Failed to load club data."))
      .finally(() => setLoading(false));
  }, []);

  const filteredMembers = members.filter(m =>
    !search ||
    m.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (m.staffOrMatricId ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const pendingDraft = club
    ? club.eventStats.total - club.eventStats.approved - club.eventStats.rejected
    : 0;

  const hasPendingApp = myLeadReq !== null && ["pending_lead", "pending_admin"].includes(myLeadReq.status);

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

  if (error) return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={`${styles.stateBox} ${styles.errorBox}`}>
          <p>⚠ {error}</p>
        </div>
      </div>
    </div>
  );

  if (!club) return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.stateBox}>
          <Users size={40} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>Not a club member</p>
          <p className={styles.emptyDesc}>
            You are not currently a member of any club. Join a club to see its details here.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className={styles.page}>
        <div className={styles.body}>
          <Triangle style={{ left: "0px",   top: "60px",     transform: "rotate(-20deg)", borderBottomColor: "var(--color-semantic-red)"   }} />
          <Triangle style={{ right: "30px", top: "40px",     transform: "rotate(10deg)",  borderBottomColor: "var(--color-primary-800)"    }} />
          <Triangle style={{ left: "20px",  bottom: "120px", transform: "rotate(-10deg)", borderBottomColor: "var(--color-primary-500)"    }} />
          <Triangle style={{ right: "0px",  bottom: "60px",  transform: "rotate(20deg)",  borderBottomColor: "var(--color-secondary-500)"  }} />

          <div className={styles.inner}>

            {/* Club header card */}
            <div className={styles.headerCard}>
              <div className={styles.headerLeft}>
                <span className={styles.typeTag}>
                  {club.type === "community" ? "Community" : "Club"}
                </span>
                <h1 className={styles.clubName}>{club.name}</h1>
                {club.category && <p className={styles.category}>{club.category}</p>}
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

            {/* Event stats strip */}
            <div className={styles.eventStatsRow}>
              {[
                { value: club.eventStats.total,    label: "Total Proposed", cls: ""              },
                { value: club.eventStats.approved, label: "Approved",       cls: styles.approved },
                { value: club.eventStats.rejected, label: "Rejected",       cls: styles.rejected },
                { value: pendingDraft,             label: "Pending / Draft", cls: styles.pending  },
              ].map(s => (
                <div key={s.label} className={styles.eventStat}>
                  <span className={`${styles.eventStatValue} ${s.cls}`}>{s.value}</span>
                  <span className={styles.eventStatLabel}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Become lead banner */}
            <div className={styles.becomeLeadCard}>
              <div className={styles.becomeLeadLeft}>
                <UserCog size={20} className={styles.becomeLeadIcon} />
                <div>
                  <p className={styles.becomeLeadTitle}>Interested in becoming the Club Lead?</p>
                  <p className={styles.becomeLeadSub}>
                    Submit an application with your motivation and supporting documents — admin will review and decide.
                  </p>
                </div>
              </div>
              <div className={styles.becomeLeadActions}>
                {hasPendingApp ? (
                  <span className={styles.appPendingBadge}>
                    {myLeadReq!.status === "pending_admin" ? "Awaiting admin review" : "Under review"}
                  </span>
                ) : myLeadReq?.status === "approved" ? (
                  <span className={styles.appApprovedBadge}>Application approved</span>
                ) : (
                  <button className={styles.becomeLeadBtn} onClick={() => setShowForm(true)}>
                    <UserCog size={13} />
                    Apply to Become Lead
                  </button>
                )}
              </div>
            </div>

            {/* Members table */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Club Members</h2>
                <div className={styles.searchWrap}>
                  <Search size={14} className={styles.searchIcon} />
                  <input
                    className={styles.searchInput}
                    placeholder="Search members…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Student ID</th>
                      <th>Role</th>
                      <th>Joined</th>
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
                          {new Date(m.joinedAt).toLocaleDateString("en-MY", {
                            year: "numeric", month: "short", day: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>

      {showForm && club && (
        <ApplyLeadModal
          clubName={club.name}
          clubId={club.id}
          onClose={() => setShowForm(false)}
          onSuccess={status => { setMyLeadReq(status); setShowForm(false); }}
        />
      )}
    </>
  );
}
