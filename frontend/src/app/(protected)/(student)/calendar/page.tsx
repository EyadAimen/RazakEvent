"use client";

import { Calendar } from "lucide-react";
import Triangle from "@/components/shared/triangle/triangle";
import styles from "./page.module.css";

export default function CalendarPage() {
  return (
    <div className={styles.page}>
      <div className={styles.body}>
        <Triangle style={{ left: "0px",   top: "60px",     transform: "rotate(-20deg)", borderBottomColor: "var(--color-primary-500)"   }} />
        <Triangle style={{ right: "30px", top: "40px",     transform: "rotate(10deg)",  borderBottomColor: "var(--color-secondary-500)" }} />
        <Triangle style={{ left: "20px",  bottom: "120px", transform: "rotate(-10deg)", borderBottomColor: "var(--color-semantic-red)"  }} />
        <Triangle style={{ right: "0px",  bottom: "60px",  transform: "rotate(20deg)",  borderBottomColor: "var(--color-primary-800)"   }} />
        <div className={styles.inner}>
          <div className={styles.heading}>
            <h1 className={styles.title}>Calendar</h1>
            <p className={styles.subtitle}>View and track upcoming events on your calendar.</p>
          </div>
          <div className={styles.emptyCard}>
            <Calendar size={40} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>No events scheduled</p>
            <p className={styles.emptyDesc}>Your upcoming events will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
