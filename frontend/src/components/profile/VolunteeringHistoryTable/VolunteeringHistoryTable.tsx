import { CalendarDays } from "lucide-react";
import Badge, { type BadgeVariant } from "@/components/shared/Badge/Badge";
import type { VolunteeringRecord } from "../utils/interfaces/profile.interface";
import styles from "./VolunteeringHistoryTable.module.css";

type Props = {
  records: VolunteeringRecord[];
};

function toVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    completed: "completed",
    ongoing: "ongoing",
    approved: "approved",
    pending: "pending",
    rejected: "rejected",
  };
  return map[status.toLowerCase()] ?? "pending";
}

function formatDate(raw: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-MY", { year: "numeric", month: "long", day: "numeric" });
}

export default function VolunteeringHistoryTable({ records }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <CalendarDays size={16} className={styles.headerIcon} />
        <h3 className={styles.title}>Volunteering History</h3>
      </div>

      {records.length === 0 ? (
        <p className={styles.empty}>No volunteering history yet.</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Date</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <tr key={rec.id}>
                  <td className={styles.eventName}>{rec.eventName}</td>
                  <td className={styles.date}>{formatDate(rec.date)}</td>
                  <td>{rec.role}</td>
                  <td>
                    <Badge label={rec.status} variant={toVariant(rec.status)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
