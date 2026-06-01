"use client";

import Navbar from "@/components/shared/navbar/navbar";
import styles from "./shared.module.css";

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <Navbar />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
