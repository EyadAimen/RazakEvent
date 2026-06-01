import Link from "next/link";
import { Calendar, ExternalLink } from "lucide-react";
import Badge, { BadgeVariant } from "@/components/shared/Badge/Badge";
import styles from "./VolunteeringCard.module.css";
import { VolunteeringApplication } from "@/app/(protected)/(student)/volunteering/utils/interfaces/volunteering.interface";

interface VolunteeringCardProps {
  application: VolunteeringApplication;
}

export default function VolunteeringCard({ application }: VolunteeringCardProps) {
  const getBadgeVariant = (status: string): BadgeVariant => {
    switch (status) {
      case "pending":
        return "pending";
      case "accepted":
        return "approved"; // Map accepted to approved badge style
      case "rejected":
        return "rejected";
      case "dropped":
        return "draft";
      default:
        return "pending";
    }
  };

  const formattedDate = application.eventDate
    ? new Date(application.eventDate).toLocaleDateString("en-MY", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "TBD";

  return (
    <Link href={`/events/${application.eventId}`} className={styles.row}>
      <div className={styles.leftContent}>
        <div className={styles.titleRow}>
          <h3 className={styles.eventName}>{application.eventName}</h3>
          <Badge
            label={application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            variant={getBadgeVariant(application.status)}
          />
        </div>
        <div className={styles.dateRow}>
          <Calendar size={14} className={styles.dateIcon} />
          <span>{formattedDate}</span>
          <span style={{ margin: "0 4px", color: "var(--color-neutral-300)" }}>•</span>
          <span>Role: {application.roleName}</span>
        </div>
      </div>
      
      <div className={styles.viewButton}>
        View Event
        <ExternalLink size={16} />
      </div>
    </Link>
  );
}

export function VolunteeringCardSkeleton() {
  return (
    <div className={`${styles.row} ${styles.skeleton}`}>
      <div className={styles.leftContent}>
        <div className={styles.titleRow}>
          <div className={`${styles.skeletonBlock} ${styles.skeletonTitle}`}></div>
          <div className={`${styles.skeletonBlock} ${styles.skeletonBadge}`}></div>
        </div>
        <div className={`${styles.skeletonBlock} ${styles.skeletonDetail}`}></div>
      </div>
      <div className={`${styles.skeletonBlock} ${styles.skeletonButton}`}></div>
    </div>
  );
}
