"use client";

import { Award } from "lucide-react";
import Triangle from "@/components/shared/triangle/triangle";
import styles from "./page.module.css";

export default function CertificatesPage() {
  return (
    <div className={styles.page}>
      <div className={styles.body}>
        <Triangle style={{ left: "0px",   top: "60px",     transform: "rotate(-20deg)", borderBottomColor: "var(--color-primary-500)"   }} />
        <Triangle style={{ right: "30px", top: "40px",     transform: "rotate(10deg)",  borderBottomColor: "var(--color-secondary-500)" }} />
        <Triangle style={{ left: "20px",  bottom: "120px", transform: "rotate(-10deg)", borderBottomColor: "var(--color-semantic-red)"  }} />
        <Triangle style={{ right: "0px",  bottom: "60px",  transform: "rotate(20deg)",  borderBottomColor: "var(--color-primary-800)"   }} />
        <div className={styles.inner}>
          <div className={styles.heading}>
            <h1 className={styles.title}>Certificates</h1>
            <p className={styles.subtitle}>View and download your earned certificates.</p>
          </div>
          <div className={styles.emptyCard}>
            <Award size={40} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>No certificates yet</p>
            <p className={styles.emptyDesc}>Certificates from completed events will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
