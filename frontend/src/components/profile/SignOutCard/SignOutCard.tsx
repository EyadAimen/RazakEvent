"use client";

import { LogOut } from "lucide-react";
import styles from "./SignOutCard.module.css";

type Props = {
  onSignOut: () => void;
};

export default function SignOutCard({ onSignOut }: Props) {
  return (
    <div className={styles.card}>
      <button className={styles.btn} onClick={onSignOut}>
        <LogOut size={16} />
        Sign Out
      </button>
    </div>
  );
}
