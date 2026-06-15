"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  UploadCloud,
  FileCheck,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import Triangle from "@/components/shared/triangle/triangle";
import Alert from "@/components/shared/alertComponent/alert";
import { apiFetchAuth } from "@/lib/api";
import { getUser } from "@/lib/auth";
import styles from "./reports.module.css";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReportStatus {
  eventId:   number;
  eventName: string;
  eventDate: string | null;
  status:    string;
  eventReport: { status: string; submittedAt: string; url: string } | null;
  moneyReport: { status: string; amountSpent: number; submittedAt: string; url: string } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MAX_MB = 10;
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

function daysRemaining(eventDate: string | null): number | null {
  if (!eventDate) return null;
  const deadline = new Date(eventDate);
  deadline.setDate(deadline.getDate() + 14);
  const diff = Math.ceil((deadline.getTime() - Date.now()) / 86_400_000);
  return diff;
}

// ── Sub-component: Upload zone ────────────────────────────────────────────────

function UploadZone({
  id,
  file,
  onFile,
  onClear,
}: {
  id: string;
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const validate = (f: File): string | null => {
    if (f.type !== "application/pdf") return "Only PDF files are accepted.";
    if (f.size > MAX_MB * 1024 * 1024) return `File exceeds the ${MAX_MB} MB limit. Please compress or re-export your PDF.`;
    return null;
  };

  const handle = (f: File) => {
    const err = validate(f);
    if (err) {
      setFileError(err);
      return;
    }
    setFileError(null);
    onFile(f);
  };

  return (
    <>
      <div
        className={`${styles.dropZone} ${drag ? styles.dropZoneActive : ""} ${file ? styles.dropZoneFilled : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="application/pdf"
          className={styles.fileInput}
          onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ""; }}
        />

        {file ? (
          <div className={styles.filePreview}>
            <FileCheck size={20} className={styles.fileIcon} />
            <span className={styles.fileName}>{file.name}</span>
            <span className={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            <button
              type="button"
              className={styles.fileRemove}
              onClick={e => { e.stopPropagation(); onClear(); setFileError(null); }}
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <div className={styles.dropPrompt}>
            <UploadCloud size={24} className={styles.uploadIcon} />
            <p className={styles.dropText}>
              Drag &amp; drop PDF or <span className={styles.browseLink}>browse</span>
            </p>
            <p className={styles.dropHint}>PDF only · Max {MAX_MB} MB</p>
          </div>
        )}
      </div>

      <Alert
        variant="error"
        isOpen={fileError !== null}
        message={fileError ?? ""}
        onClose={() => setFileError(null)}
      />
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PostEventReportsPage() {
  const router  = useRouter();
  const params  = useParams();
  const eventId = params.eventId as string;

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "lead") router.replace("/unauthorized");
  }, [router]);

  const [info,    setInfo]    = useState<ReportStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [eventReportFile,  setEventReportFile]  = useState<File | null>(null);
  const [moneyReportFile,  setMoneyReportFile]  = useState<File | null>(null);
  const [amountSpent,      setAmountSpent]      = useState("");
  const [amountError,      setAmountError]      = useState("");

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitErr,  setSubmitErr]  = useState<string | null>(null);
  const [success,    setSuccess]    = useState(false);

  // Load existing status on mount — non-blocking: show the form even if fetch fails
  useEffect(() => {
    apiFetchAuth<ReportStatus>(`/reports/events/${eventId}`)
      .then(d => {
        setInfo(d);
        if (d.moneyReport) setAmountSpent(String(d.moneyReport.amountSpent));
      })
      .catch(() => {
        // Status fetch failed (e.g. no reports yet) — form still usable
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  const days   = daysRemaining(info?.eventDate ?? null);
  const canSubmit = eventReportFile !== null && moneyReportFile !== null &&
                    amountSpent.trim() !== "" && !submitting;

  const handleSubmit = async () => {
    const amt = Number(amountSpent);
    if (isNaN(amt) || amt < 0) {
      setAmountError("Enter a valid non-negative amount.");
      return;
    }
    setAmountError("");
    setSubmitErr(null);
    setSubmitting(true);

    try {
      const form = new FormData();
      form.append("eventReport",  eventReportFile!);
      form.append("moneyReport",  moneyReportFile!);
      form.append("amountSpent",  String(amt));

      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const res = await fetch(`${API_BASE}/reports/events/${eventId}`, {
        method:  "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body:    form,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Submission failed");

      setSuccess(true);
    } catch (err: unknown) {
      setSubmitErr(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / error ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.body}>
          <div className={styles.loadingState}>
            <Loader2 size={28} className={styles.spinner} />
            <p>Loading report details…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.body}>
          <div className={styles.inner}>
            <div className={styles.successCard}>
              <CheckCircle2 size={48} className={styles.successIcon} />
              <h2 className={styles.successTitle}>Reports Submitted!</h2>
              <p className={styles.successSub}>
                Both reports for <strong>{info?.eventName ?? "this event"}</strong> have been submitted
                successfully and are pending admin review.
              </p>
              <Link href={`/lead/events/${eventId}`} className={styles.successBtn}>
                Back to Event
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────

  const alreadySubmitted = info?.eventReport != null && info?.moneyReport != null;

  return (
    <div className={styles.page}>
      <div className={styles.body}>
        <Triangle style={{ left: "0px",   top: "60px",     transform: "rotate(-20deg)", borderBottomColor: "var(--color-primary-500)"   }} />
        <Triangle style={{ right: "30px", top: "40px",     transform: "rotate(10deg)",  borderBottomColor: "var(--color-secondary-500)" }} />
        <Triangle style={{ left: "20px",  bottom: "120px", transform: "rotate(-10deg)", borderBottomColor: "var(--color-semantic-red)"  }} />
        <Triangle style={{ right: "0px",  bottom: "60px",  transform: "rotate(20deg)",  borderBottomColor: "var(--color-primary-800)"   }} />

        <div className={styles.inner}>

          {/* Back link */}
          <Link href={`/lead/events/${eventId}`} className={styles.backLink}>
            <ArrowLeft size={14} /> Back to Event
          </Link>

          {/* Deadline alert */}
          {days !== null && days <= 7 && (
            <div className={`${styles.alert} ${days <= 2 ? styles.alertDanger : styles.alertWarning}`}>
              <AlertTriangle size={15} />
              {days > 0
                ? `Deadline approaching: ${days} day${days !== 1 ? "s" : ""} remaining to submit reports for "${info?.eventName}"`
                : days === 0
                ? `Reports for "${info?.eventName}" are due today!`
                : `Deadline passed for "${info?.eventName}" — submit immediately.`}
            </div>
          )}

          {/* Page heading */}
          <div className={styles.heading}>
            <h1 className={styles.title}>Submit Post-Event Reports</h1>
            <p className={styles.subtitle}>
              Both the Event Report and Money Report must be submitted within 14 days.
            </p>
          </div>

          {/* Already submitted notice */}
          {alreadySubmitted && (
            <div className={styles.resubmitNotice}>
              <CheckCircle2 size={15} />
              Reports already submitted. You can resubmit to replace the existing files.
            </div>
          )}

          {/* API error */}
          {submitErr && (
            <div className={styles.apiError}>{submitErr}</div>
          )}

          {/* ── Event Report ──────────────────────────────────────────────── */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Event Report</h2>
                <p className={styles.cardSub}>Summary of the event outcome and attendance.</p>
              </div>
              <a
                href="/templates/event-report-template.pdf"
                download="Event Report Template.pdf"
                className={styles.templateBtn}
                onClick={e => e.stopPropagation()}
              >
                <Download size={13} /> Template
              </a>
            </div>

            {info?.eventReport && (
              <div className={styles.previousSubmission}>
                <CheckCircle2 size={13} />
                Previously submitted on {new Date(info!.eventReport!.submittedAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}.
                Upload a new file below to replace it.
              </div>
            )}

            <UploadZone
              id="eventReport"
              file={eventReportFile}
              onFile={setEventReportFile}
              onClear={() => setEventReportFile(null)}
            />
          </div>

          {/* ── Money Report ───────────────────────────────────────────────── */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Money Report</h2>
                <p className={styles.cardSub}>Financial breakdown and receipts.</p>
              </div>
              <a
                href="/templates/money-report-template.pdf"
                download="Money Report Template.pdf"
                className={styles.templateBtn}
                onClick={e => e.stopPropagation()}
              >
                <Download size={13} /> Template
              </a>
            </div>

            <div className={styles.amountField}>
              <label className={styles.amountLabel} htmlFor="amountSpent">
                Total Amount Spent (RM)
              </label>
              <input
                id="amountSpent"
                type="number"
                min="0"
                step="0.01"
                className={`${styles.amountInput} ${amountError ? styles.amountInputError : ""}`}
                placeholder="0.00"
                value={amountSpent}
                onChange={e => { setAmountSpent(e.target.value); setAmountError(""); }}
              />
              {amountError && <p className={styles.fieldError}>{amountError}</p>}
            </div>

            {info?.moneyReport && (
              <div className={styles.previousSubmission}>
                <CheckCircle2 size={13} />
                Previously submitted — RM {Number(info!.moneyReport!.amountSpent).toFixed(2)} spent.
                Upload a new file below to replace it.
              </div>
            )}

            <UploadZone
              id="moneyReport"
              file={moneyReportFile}
              onFile={setMoneyReportFile}
              onClear={() => setMoneyReportFile(null)}
            />
          </div>

          {/* ── Submit ─────────────────────────────────────────────────────── */}
          <div className={styles.actions}>
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {submitting
                ? <><Loader2 size={15} className={styles.spinnerSm} /> Submitting…</>
                : "Submit All Reports"
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
