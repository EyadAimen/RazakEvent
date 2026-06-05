"use client";

import Link from "next/link";
import { X } from "lucide-react";
import type { SharedEvent } from "@/app/(protected)/(shared)/events/utils/interface/events.interface";
import { MONTH_NAMES, formatTime } from "@/app/(protected)/(shared)/calendar/utils/calendar.helpers";
import styles from "./CalendarPanel.module.css";

type Props = {
  selectedDate: Date;
  events: SharedEvent[];
  dismissing: boolean;
  onClose: () => void;
};

export default function CalendarPanel({ selectedDate, events, dismissing, onClose }: Props) {
  return (
    <div className={`${styles.panel} ${dismissing ? styles.panelDismissing : ""}`}>
      <div className={styles.top}>
        <div className={styles.dateInfo}>
          <span className={styles.dayNum}>{selectedDate.getDate()}</span>
          <span className={styles.monthYear}>
            {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </span>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close panel">
          <X size={16} />
        </button>
      </div>

      <div className={styles.eventList}>
        {events.length === 0 ? (
          <p className={styles.empty}>No events on this day.</p>
        ) : events.map(e => (
          <Link key={e.id} href={`/events/${e.id}`} className={styles.eventCard}>
            <span className={styles.eventTime}>{formatTime(e.eventDate)}</span>
            <p className={styles.eventName}>{e.name}</p>
            <div className={styles.eventMeta}>
              <span className={styles.eventDot} />
              <span className={styles.eventClub}>{e.clubName}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
