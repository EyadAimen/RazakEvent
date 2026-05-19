import { useEffect } from "react";
import styles from "./alert.module.css";

type AlertProps = {
  /** Controls whether the alert is visible. */
  isOpen: boolean;
  /** Called when the user dismisses the alert (close button or Escape key). */
  onClose: () => void;
  /** Content rendered inside the alert card (icon, title, description, actions, etc.). */
  children: React.ReactNode;
};

export default function Alert({ isOpen, onClose, children }: AlertProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close alert"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
