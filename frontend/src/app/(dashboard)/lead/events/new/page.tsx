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
  Calendar,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Triangle from "@/components/shared/triangle/triangle";
import InputField from "@/components/shared/input-field/input-field";
import Button from "@/components/shared/button/button";
import { apiFetchAuth } from "@/lib/api";
import type { Venue, DashboardData, BookedDate } from "@/types/lead";
import styles from "./page.module.css";

const QUICK_ACTIONS = [
  { id: "dashboard",    icon: LayoutDashboard, label: "Dashboard",    sublabel: "Overview",  href: "/lead/dashboard" },
  { id: "events",       icon: Ticket,          label: "Events",       sublabel: "My Events", href: "/lead/events"    },
  { id: "certificates", icon: Award,           label: "Certificates", sublabel: "Issued",    href: "/lead/events"    },
];

const MAX_FILE_MB = 10;

interface FormErrors {
  name?: string;
  eventDate?: string;
  venueId?: string;
  description?: string;
  estimatedBudget?: string;
}

export default function ProposeEventPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Club context
  const [clubType, setClubType] = useState<"club" | "community">("club");

  // Venue list & booked dates
  const [venues,       setVenues]       = useState<Venue[]>([]);
  const [bookedDates,  setBookedDates]  = useState<BookedDate[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);

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
  const [apiError,    setApiError]    = useState<string | null>(null);
  const [errors,      setErrors]      = useState<FormErrors>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Minimum datetime: now (for date input)
  const minDatetime = new Date(Date.now() + 60_000).toISOString().slice(0, 16);

  useEffect(() => {
    Promise.all([
      apiFetchAuth<DashboardData>("/events/lead/dashboard"),
      apiFetchAuth<{ venues: Venue[] }>("/venues"),
    ]).then(([dash, venueRes]) => {
      setClubType(dash.clubType ?? "club");
      setVenues(venueRes.venues);
    }).catch(() => {});
  }, []);

  // Fetch booked dates whenever venue changes
  useEffect(() => {
    if (!venueId) {
      setBookedDates([]);
      return;
    }
    setLoadingDates(true);
    apiFetchAuth<{ bookedDates: BookedDate[] }>(`/venues/${venueId}/booked-dates`)
      .then(res => setBookedDates(res.bookedDates))
      .catch(() => setBookedDates([]))
      .finally(() => setLoadingDates(false));
  }, [venueId]);

  // ── Validation ───────────────────────────────────────────────────────────────

  const validate = (forSubmit: boolean): FormErrors => {
    const errs: FormErrors = {};

    if (!name.trim()) {
      errs.name = "Event name is required.";
    } else if (name.trim().length < 3) {
      errs.name = "Event name must be at least 3 characters.";
    }

    if (forSubmit) {
      if (!eventDate) {
        errs.eventDate = "Event date and time is required.";
      } else if (new Date(eventDate) <= new Date()) {
        errs.eventDate = "Event date must be in the future.";
      }

      if (!venueId) {
        errs.venueId = "Please select a venue.";
      }

      if (!description.trim()) {
        errs.description = "A short description is required.";
      } else if (description.trim().length < 10) {
        errs.description = "Description must be at least 10 characters.";
      }
    }

    if (estimatedBudget !== "" && (isNaN(Number(estimatedBudget)) || Number(estimatedBudget) < 0)) {
      errs.estimatedBudget = "Budget must be a positive number.";
    }

    return errs;
  };

  // ── PDF drag & drop ──────────────────────────────────────────────────────────

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSetPdf(file);
  };

  const validateAndSetPdf = (file: File) => {
    if (file.type !== "application/pdf") {
      setApiError("Only PDF files are accepted.");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setApiError(`File is too large. Maximum size is ${MAX_FILE_MB} MB.`);
      return;
    }
    setApiError(null);
    setPdfFile(file);
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async (submitStatus: "draft" | "submitted") => {
    setApiError(null);

    const errs = validate(submitStatus === "submitted");
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
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

      if (pdfFile) {
        const formData = new FormData();
        formData.append("proposalPdf", pdfFile);
        await apiFetchAuth(`/events/${proposalId}/proposal-pdf`, {
          method: "POST",
          body: formData,
          headers: {},
        });
      }

      if (submitStatus === "submitted") {
        await apiFetchAuth(`/events/${proposalId}/submit`, { method: "POST" });
        setShowSuccess(true);
      } else {
        router.push("/lead/dashboard");
      }
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const clearError = (field: keyof FormErrors) =>
    setErrors(prev => ({ ...prev, [field]: undefined }));

  const formatBookedDate = (iso: string) =>
    new Date(iso).toLocaleString("en-MY", {
      weekday: "short", day: "numeric", month: "short",
      year: "numeric", hour: "2-digit", minute: "2-digit",
    });

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
          <Button variant="primary" className={styles.submitBtn} onClick={() => router.push("/lead/dashboard")}>
            Go to My Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.body}>
        <Triangle style={{ left: "0px",   top: "60px",     transform: "rotate(-20deg)", borderBottomColor: "var(--color-primary-500)"   }} />
        <Triangle style={{ right: "30px", top: "40px",     transform: "rotate(10deg)",  borderBottomColor: "var(--color-secondary-500)" }} />
        <Triangle style={{ left: "20px",  bottom: "120px", transform: "rotate(-10deg)", borderBottomColor: "var(--color-semantic-red)"  }} />
        <Triangle style={{ right: "0px",  bottom: "60px",  transform: "rotate(20deg)",  borderBottomColor: "var(--color-primary-800)"   }} />

        <div className={styles.inner}>
          <a href="/lead/dashboard" className={styles.backLink}>
            <ChevronLeft size={14} /> Back to Dashboard
          </a>

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

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h1 className={styles.cardTitle}>Submit Event Proposal</h1>
              <p className={styles.cardSubtitle}>
                Fill in the event details and upload the completed proposal form. Save a draft to continue later.
              </p>
            </div>

            {apiError && <p className={styles.formError}>{apiError}</p>}

            {/* ── Section 1: Event Basic Info ─────────────────────── */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Event Basic Info</h2>

              <InputField
                label="Event Name *"
                type="text"
                value={name}
                placeholder="e.g. Tech Symposium 2026"
                errorMessage={errors.name}
                onChange={v => { setName(v); clearError("name"); }}
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

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Proposed Date &amp; Time *</label>
                  <input
                    type="datetime-local"
                    className={`${styles.select} ${errors.eventDate ? styles.inputError : ""}`}
                    value={eventDate}
                    min={minDatetime}
                    onChange={e => { setEventDate(e.target.value); clearError("eventDate"); }}
                  />
                  {errors.eventDate && (
                    <p className={styles.fieldError}>
                      <AlertCircle size={12} /> {errors.eventDate}
                    </p>
                  )}
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Proposed Venue *</label>
                  <select
                    className={`${styles.select} ${errors.venueId ? styles.inputError : ""}`}
                    value={venueId}
                    onChange={e => { setVenueId(e.target.value); clearError("venueId"); }}
                  >
                    <option value="">Select venue…</option>
                    {venues.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name}{v.location ? ` — ${v.location}` : ""}
                      </option>
                    ))}
                  </select>
                  {errors.venueId && (
                    <p className={styles.fieldError}>
                      <AlertCircle size={12} /> {errors.venueId}
                    </p>
                  )}
                </div>

                <InputField
                  label="Estimated Budget (RM)"
                  type="number"
                  value={estimatedBudget}
                  placeholder="0.00"
                  errorMessage={errors.estimatedBudget}
                  onChange={v => { setEstimatedBudget(v); clearError("estimatedBudget"); }}
                />
              </div>

              {/* Booked dates panel — shown whenever a venue is selected */}
              {venueId && (
                <div className={styles.bookedPanel}>
                  <div className={styles.bookedPanelHeader}>
                    <Calendar size={14} />
                    <span>Booked dates for this venue</span>
                  </div>

                  {loadingDates ? (
                    <p className={styles.bookedLoading}>Checking availability…</p>
                  ) : bookedDates.length === 0 ? (
                    <p className={styles.bookedEmpty}>
                      <CheckCircle2 size={13} />
                      No upcoming bookings — this venue is available!
                    </p>
                  ) : (
                    <ul className={styles.bookedList}>
                      {bookedDates.map(d => (
                        <li key={d.eventId} className={styles.bookedItem}>
                          <span className={styles.bookedDate}>{formatBookedDate(d.eventDate)}</span>
                          <span className={styles.bookedEventName}>{d.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Short Description *</label>
                <textarea
                  className={`${styles.textarea} ${errors.description ? styles.inputError : ""}`}
                  placeholder="Describe the event objectives, activities, and expected outcomes…"
                  value={description}
                  rows={4}
                  onChange={e => { setDescription(e.target.value); clearError("description"); }}
                />
                {errors.description && (
                  <p className={styles.fieldError}>
                    <AlertCircle size={12} /> {errors.description}
                  </p>
                )}
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
                      Drag &amp; drop your PDF here, or <span className={styles.browseLink}>browse</span>
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
