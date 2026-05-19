import styles from "./Badge.module.css";

export type BadgeVariant =
  | "approved"
  | "pending"
  | "rejected"
  | "draft"
  | "ongoing"
  | "completed"
  | "report-due"
  | "overdue"
  | "pending-admin";

type Props = {
  label: string;
  variant: BadgeVariant;
};

export default function Badge({ label, variant }: Props) {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>{label}</span>
  );
}
