"use client";

import Navbar from "@/components/shared/navbar/navbar";
import styles from "./profile.module.css";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <Navbar />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
