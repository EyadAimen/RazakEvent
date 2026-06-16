"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, X, XCircle } from "lucide-react";
import styles from "./CompleteEventModal.module.css";

interface Props {
  isOpen: boolean;
  eventName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

type Phase = "confirm" | "success" | "error";

export default function CompleteEventModal({ isOpen, eventName, onClose, onConfirm }: Props) {
  const [phase, setPhase] = useState<Phase>("confirm");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleClose = () => {
    setPhase("confirm");
    setErrorMessage("");
    onClose();
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      setPhase("success");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to mark event as completed.");
      setPhase("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={phase !== "confirm" ? undefined : handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {phase === "confirm" && (
          <>
            <div className={styles.header}>
              <div className={styles.headerIcon}>
                <AlertTriangle size={22} />
              </div>
              <div className={styles.headerText}>
                <p className={styles.headerLabel}>MARK AS COMPLETED</p>
                <h2 className={styles.headerTitle}>Complete Event</h2>
                <p className={styles.headerSubtitle}>This action cannot be undone.</p>
              </div>
              <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className={styles.body}>
              <p className={styles.confirmText}>
                Are you sure you want to mark <strong>{eventName}</strong> as completed?
                Volunteering will be closed and a 14-day report submission window will open.
              </p>

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
                  type="button"
                  className={styles.confirmBtn}
                  onClick={handleConfirm}
                  disabled={submitting}
                >
                  {submitting ? "Completing…" : "Yes, Complete Event"}
                </button>
              </div>
            </div>
          </>
        )}

        {phase === "success" && (
          <>
            <div className={`${styles.header} ${styles.headerSuccess}`}>
              <div className={styles.headerIcon}>
                <CheckCircle size={22} />
              </div>
              <div className={styles.headerText}>
                <p className={styles.headerLabel}>SUCCESS</p>
                <h2 className={styles.headerTitle}>Event Completed</h2>
              </div>
              <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className={styles.body}>
              <p className={styles.confirmText}>
                <strong>{eventName}</strong> has been marked as completed. You now have 14 days to submit
                your post-event report.
              </p>

              <div className={styles.footer}>
                <button type="button" className={styles.confirmBtn} onClick={handleClose}>
                  Done
                </button>
              </div>
            </div>
          </>
        )}

        {phase === "error" && (
          <>
            <div className={`${styles.header} ${styles.headerError}`}>
              <div className={styles.headerIcon}>
                <XCircle size={22} />
              </div>
              <div className={styles.headerText}>
                <p className={styles.headerLabel}>ERROR</p>
                <h2 className={styles.headerTitle}>Could Not Complete</h2>
              </div>
              <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className={styles.body}>
              <p className={styles.errorText}>{errorMessage}</p>

              <div className={styles.footer}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleClose}
                >
                  Close
                </button>
                <button
                  type="button"
                  className={styles.confirmBtn}
                  onClick={() => { setPhase("confirm"); setErrorMessage(""); }}
                >
                  Try Again
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
