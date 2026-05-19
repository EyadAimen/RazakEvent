"use client";

import { KeyRound, TriangleAlert } from "lucide-react";
import Button from "@/components/shared/button/button";
import styles from "./DangerZone.module.css";

type Props = {
  onResetPassword: () => void;
};

export default function DangerZone({ onResetPassword }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <TriangleAlert size={16} className={styles.headerIcon} />
        <h3 className={styles.title}>Danger Zone</h3>
      </div>

      <div className={styles.actions}>
        <div className={styles.actionRow}>
          <div className={styles.actionInfo}>
            <p className={styles.actionLabel}>Reset Password</p>
            <p className={styles.actionDesc}>Send a password reset link to your email.</p>
          </div>
          <Button onClick={onResetPassword} className={styles.outlineRedBtn}>
            <KeyRound size={14} />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
