import { ShieldCheck } from "lucide-react";
import type { ClubOverview } from "@/types/lead";
import styles from "./LeadershipCredentials.module.css";

type Props = {
  club: ClubOverview;
};

function getTenure(createdAt: string): string {
  const year = new Date(createdAt).getFullYear();
  return `${year} – ${year + 1}`;
}

export default function LeadershipCredentials({ club }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <ShieldCheck size={16} className={styles.headerIcon} />
        <h3 className={styles.title}>Leadership Credentials</h3>
      </div>

      <div className={styles.credentialCard}>
        <div className={styles.clubRow}>
          <div>
            <p className={styles.clubName}>{club.name}</p>
            <p className={styles.clubRole}>Role: President / Lead</p>
          </div>
          <span className={styles.verifiedBadge}>
            <ShieldCheck size={12} />
            Verified Leader
          </span>
        </div>

        <div className={styles.divider} />

        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <p className={styles.statLabel}>TENURE</p>
            <p className={styles.statValue}>{getTenure(club.createdAt)}</p>
          </div>
          <div className={styles.stat}>
            <p className={styles.statLabel}>TOTAL EVENTS</p>
            <p className={styles.statValue}>{club.stats.total} Proposed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
