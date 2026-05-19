"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Ticket,
  Award,
  Loader2,
  Download,
  UploadCloud,
  FileCheck,
  X,
} from "lucide-react";
import Triangle from "@/components/shared/triangle/triangle";
import InputField from "@/components/shared/input-field/input-field";
import Button from "@/components/shared/button/button";
import { apiFetchAuth } from "@/lib/api";
import type { Venue, DashboardData } from "@/types/lead";
import styles from "./page.module.css";

const QUICK_ACTIONS = [
  { id: "dashboard",    icon: LayoutDashboard, label: "Dashboard",    sublabel: "Overview",  href: "/lead/dashboard" },
  { id: "events",       icon: Ticket,          label: "Events",       sublabel: "My Events", href: "/lead/events"    },
  { id: "certificates", icon: Award,           label: "Certificates", sublabel: "Issued",    href: "/lead/events"    },
];

const MAX_FILE_MB = 10;

export default function ProposeEventPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Club context
  const [clubType, setClubType] = useState<"club" | "community">("club");

  // Venue list
  const [venues, setVenues] = useState<Venue[]>([]);

  // Form fields
  const [name,            setName]            = useState("");
  const [eventDate,       setEventDate]       = useState("");
  const [venueId,         setVenueId]         = useState("");
  const [description,     setDescription]     = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState("");
  const [pdfFile,         setPdfFile]         = useState<File | null>(null);
  const [dragOver,        setDragOver]        = useState(false);

  // UI state
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [nameError,   setNameError]   = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetchAuth<DashboardData>("/events/lead/dashboard"),
      apiFetchAuth<{ venues: Venue[] }>("/venues"),
    ]).then(([dash, venueRes]) => {
      setClubType(dash.clubType ?? "club");
      setVenues(venueRes.venues);
    }).catch(() => {});
  }, []);

  // ── PDF drag & drop ──────────────────────────────────────────────────────────

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSetPdf(file);
  };

  const validateAndSetPdf = (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${MAX_FILE_MB} MB.`);
      return;
    }
    setError(null);
    setPdfFile(file);
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async (submitStatus: "draft" | "submitted") => {
    setNameError("");
    setError(null);

    if (!name.trim()) {
      setNameError("Event name is required");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the proposal (JSON)
      const created = await apiFetchAuth<{ event: { id: string } }>("/events", {
        method: "POST",
        body: JSON.stringify({
          name:            name.trim(),
          status:          "draft",
          ...(eventDate       && { eventDate }),
          ...(venueId         && { venueId: Number(venueId) }),
          ...(description     && { description }),
          ...(estimatedBudget && { estimatedBudget: Number(estimatedBudget) }),
        }),
      });

      const proposalId = created.event.id;

      // 2. Upload PDF if provided
      if (pdfFile) {
        const formData = new FormData();
        formData.append("proposalPdf", pdfFile);
        await apiFetchAuth(`/events/${proposalId}/proposal-pdf`, {
          method: "POST",
          body: formData,
          headers: {},  // let browser set multipart boundary
        });
      }

      // 3. If submitting, promote draft → pending
      if (submitStatus === "submitted") {
        await apiFetchAuth(`/events/${proposalId}/submit`, { method: "POST" });
        setShowSuccess(true);
      } else {
        router.push("/lead/events");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success modal ────────────────────────────────────────────────────────────

  if (showSuccess) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <FileCheck size={48} className={styles.modalIcon} />
          <h2 className={styles.modalTitle}>Proposal Submitted!</h2>
          <p className={styles.modalBody}>
            Your event proposal has been submitted to the KTR Admin for review.
            You will be notified once a decision is made.
          </p>
          <Button variant="primary" className={styles.submitBtn} onClick={() => router.push("/lead/events")}>
            Go to My Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.body}>
        {/* Decorative shapes */}
        <Triangle style={{ left: "0px",   top: "60px",     transform: "rotate(-20deg)", borderBottomColor: "var(--color-primary-500)"   }} />
        <Triangle style={{ right: "30px", top: "40px",     transform: "rotate(10deg)",  borderBottomColor: "var(--color-secondary-500)" }} />
        <Triangle style={{ left: "20px",  bottom: "120px", transform: "rotate(-10deg)", borderBottomColor: "var(--color-semantic-red)"  }} />
        <Triangle style={{ right: "0px",  bottom: "60px",  transform: "rotate(20deg)",  borderBottomColor: "var(--color-primary-800)"   }} />

        <div className={styles.inner}>
          {/* Back link */}
          <a href="/lead/dashboard" className={styles.backLink}>
            <ChevronLeft size={14} /> Back to Dashboard
          </a>

          {/* Quick actions */}
          <div className={styles.quickActions}>
            {QUICK_ACTIONS.map(({ id, icon: Icon, label, sublabel, href }) => (
              <a key={id} href={href} className={styles.qaCard}>
                <span className={styles.qaIcon}><Icon size={20} /></span>
                <div className={styles.qaText}>
                  <span className={styles.qaLabel}>{label}</span>
                  <span className={styles.qaSublabel}>{sublabel}</span>
                </div>
                <ChevronRight size={16} className={styles.qaChevron} />
              </a>
            ))}
          </div>

          {/* Form card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h1 className={styles.cardTitle}>Submit Event Proposal</h1>
              <p className={styles.cardSubtitle}>
                Fill in the event details and upload the completed proposal form. Save a draft to continue later.
              </p>
            </div>

            {error && <p className={styles.formError}>{error}</p>}

            {/* ── Section 1: Event Basic Info ─────────────────────── */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Event Basic Info</h2>

              <InputField
                label="Event Name *"
                type="text"
                value={name}
                placeholder="e.g. Tech Symposium 2026"
                errorMessage={nameError}
                onChange={setName}
              />

              <div className={styles.row}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Event Type</label>
                  <select
                    className={styles.select}
                    value={clubType}
                    onChange={e => setClubType(e.target.value as "club" | "community")}
                  >
                    <option value="club">Club Event</option>
                    <option value="community">Community Event</option>
                  </select>
                  <p className={styles.fieldHint}>Auto-set based on your club type.</p>
                </div>

                <InputField
                  label="Proposed Date & Time"
                  type="datetime-local"
                  value={eventDate}
                  onChange={setEventDate}
                />
              </div>

              <div className={styles.row}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Proposed Venue</label>
                  <select
                    className={styles.select}
                    value={venueId}
                    onChange={e => setVenueId(e.target.value)}
                  >
                    <option value="">Select venue…</option>
                    {venues.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <InputField
                  label="Estimated Budget (RM)"
                  type="number"
                  value={estimatedBudget}
                  placeholder="0.00"
                  onChange={setEstimatedBudget}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Short Description</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Describe the event objectives, activities, and expected outcomes…"
                  value={description}
                  rows={4}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* ── Section 2: Proposal Form Upload ────────────────── */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Proposal Form Upload</h2>
              <p className={styles.sectionHint}>
                Download the official event proposal template, fill it out, and upload the completed PDF below.
              </p>

              <a
                href="/templates/event-proposal-template.pdf"
                download="Event Proposal Template.pdf"
                className={styles.downloadBtn}
              >
                <Download size={15} />
                Download Template
              </a>

              {/* Drop zone */}
              <div
                className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ""} ${pdfFile ? styles.dropZoneFilled : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className={styles.fileInput}
                  onChange={e => { const f = e.target.files?.[0]; if (f) validateAndSetPdf(f); }}
                />

                {pdfFile ? (
                  <div className={styles.filePreview}>
                    <FileCheck size={24} className={styles.fileIcon} />
                    <span className={styles.fileName}>{pdfFile.name}</span>
                    <span className={styles.fileSize}>
                      {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <button
                      className={styles.fileRemove}
                      type="button"
                      onClick={e => { e.stopPropagation(); setPdfFile(null); }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className={styles.dropPrompt}>
                    <UploadCloud size={28} className={styles.uploadIcon} />
                    <p className={styles.dropText}>
                      Drag & drop your PDF here, or <span className={styles.browseLink}>browse</span>
                    </p>
                    <p className={styles.dropHint}>PDF only · Max {MAX_FILE_MB} MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Section 3: Budget note ──────────────────────────── */}
            <div className={styles.budgetNote}>
              <p>
                Funds will be released upon approval. Submit the money report within <strong>14 days</strong> after the event.
              </p>
            </div>

            {/* ── Actions ─────────────────────────────────────────── */}
            <div className={styles.actions}>
              <a href="/lead/dashboard" className={styles.cancelLink}>Cancel</a>
              <Button
                variant="default"
                disabled={submitting}
                onClick={() => handleSubmit("draft")}
              >
                {submitting && <Loader2 size={14} className={styles.spinner} />}
                Save as Draft
              </Button>
              <Button
                variant="primary"
                disabled={submitting}
                className={styles.submitBtn}
                onClick={() => handleSubmit("submitted")}
              >
                {submitting && <Loader2 size={14} className={styles.spinner} />}
                Submit Proposal
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
