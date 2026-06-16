"use client";

import { useState } from "react";
import { X, Info } from "lucide-react";
import styles from "./RejectApplicationModal.module.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void>;
  studentName: string;
  requireMessage?: boolean;
}

export default function RejectApplicationModal({ isOpen, onClose, onSubmit, studentName, requireMessage = false }: Props) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  if (!isOpen) return null;

  const handleClose = () => {
    setMessage("");
    setApiError("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    if (requireMessage && !message.trim()) {
      setApiError("A reason is required to reject this request.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(message);
      handleClose();
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Failed to reject application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <div>
            <p className={styles.headerLabel}>REJECT APPLICATION</p>
            <h2 className={styles.headerTitle}>Reject {studentName}</h2>
            <p className={styles.headerSubtitle}>Provide a reason for rejection (optional).</p>
          </div>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        {/* ── Body / Form ───────────────────────────────────────────── */}
        <form className={styles.body} onSubmit={handleSubmit} noValidate>
          
          {apiError && <p className={styles.apiError}>{apiError}</p>}

          {/* Description */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              REJECTION MESSAGE <span className={styles.optional}>({requireMessage ? "REQUIRED" : "OPTIONAL"})</span>
            </label>
            <textarea
              className={styles.textarea}
              placeholder="Explain why this application is being rejected..."
              value={message}
              rows={4}
              maxLength={500}
              onChange={e => setMessage(e.target.value)}
            />
            <span className={styles.charCount}>{message.length} / 500</span>
          </div>

          {/* Info note */}
          <div className={styles.infoNote}>
            <Info size={14} className={styles.infoIcon} />
            <p>
              The student will see this message when checking their application status.
            </p>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting}
            >
              {submitting ? "Rejecting…" : "Reject Application"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
