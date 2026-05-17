import { Calendar, Users } from "lucide-react";
import Badge, { BadgeVariant } from "@/components/shared/Badge/Badge";
import styles from "./LeadEventCard.module.css";

export type LeadEvent = {
  id: string;
  name: string;
  clubName: string;
  date: string;
  attendees: number;
  status: BadgeVariant;
  statusLabel: string;
  hasPendingReport?: boolean;
};

type Props = {
  event: LeadEvent;
  onManage?: (id: string) => void;
};

export default function LeadEventCard({ event, onManage }: Props) {
  const borderClass =
    event.status === "approved"
      ? styles.borderApproved
      : event.status === "report-due"
      ? styles.borderReportDue
      : event.status === "pending-admin"
      ? styles.borderPending
      : styles.borderDefault;

  return (
    <article className={`${styles.card} ${borderClass}`}>
      <div className={styles.header}>
        <span className={styles.clubTag}>{event.clubName}</span>
        <Badge label={event.statusLabel} variant={event.status} />
      </div>

      <h3 className={styles.eventName}>{event.name}</h3>

      <div className={styles.meta}>
        <span className={styles.metaItem}>
          <Calendar size={13} />
          {event.date}
        </span>
        <span className={styles.metaItem}>
          <Users size={13} />
          Attendees: {event.attendees}
        </span>
      </div>

      {event.hasPendingReport && (
        <p className={styles.reportWarning}>⚠ Pending Post-Event Report</p>
      )}

      <div className={styles.footer}>
        <button
          className={styles.manageBtn}
          onClick={() => onManage?.(event.id)}
        >
          Manage Event
        </button>
      </div>
    </article>
  );
}
