"use client";

import { useEffect } from "react";
import { CircleX, Loader2, CircleCheck } from "lucide-react";
import styles from "./alert.module.css";

type BaseProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ErrorAlert = BaseProps & {
  variant: "error";
  message: string;
  children?: never;
};

type SuccessAlert = BaseProps & {
  variant: "success";
  message: string;
  children?: never;
};

type LoadingAlert = BaseProps & {
  variant: "loading";
  message?: string;
  children?: never;
};

type CustomAlert = BaseProps & {
  variant?: never;
  message?: never;
  children: React.ReactNode;
};

type AlertProps = ErrorAlert | SuccessAlert | LoadingAlert | CustomAlert;

export default function Alert({ isOpen, onClose, ...rest }: AlertProps) {
  useEffect(() => {
    if (!isOpen || ("variant" in rest && rest.variant === "loading")) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose, rest]);

  if (!isOpen) return null;

  if ("variant" in rest && rest.variant === "loading") {
    return (
      <div className={styles.overlay}>
        <div className={styles.container}>
          <Loader2 size={40} className={styles.spinner} />
          <p className={styles.loadingMessage}>{rest.message ?? "Please wait…"}</p>
        </div>
      </div>
    );
  }

  if ("variant" in rest && rest.variant === "error") {
    return (
      <div className={styles.overlay}>
        <div className={styles.container}>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close alert">✕</button>
          <CircleX size={48} className={styles.errorIcon} />
          <h3 className={styles.errorTitle}>Something went wrong</h3>
          <p className={styles.errorMessage}>{rest.message}</p>
          <button className={styles.okButton} onClick={onClose}>OK</button>
        </div>
      </div>
    );
  }

  if ("variant" in rest && rest.variant === "success") {
    return (
      <div className={styles.overlay}>
        <div className={styles.container}>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close alert">✕</button>
          <CircleCheck size={48} className={styles.successIcon} />
          <h3 className={styles.successTitle}>Success</h3>
          <p className={styles.successMessage}>{rest.message}</p>
          <button className={styles.okButton} onClick={onClose}>OK</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close alert">✕</button>
        {"children" in rest && rest.children}
      </div>
    </div>
  );
}
