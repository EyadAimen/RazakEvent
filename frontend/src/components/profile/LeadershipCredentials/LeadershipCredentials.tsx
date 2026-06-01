import { ShieldCheck, Clock } from "lucide-react";
import type { ClubItem, ApprovedClub, PendingClubItem } from "@/types/lead";
import styles from "./LeadershipCredentials.module.css";

type Props = {
  clubs: ClubItem[];
};

function getTenure(createdAt?: string): string {
  if (!createdAt) return "—";
  const year = new Date(createdAt).getFullYear();
  return `${year} – ${year + 1}`;
}

function ApprovedCard({ club }: { club: ApprovedClub }) {
  return (
    <div className={styles.credentialCard}>
      <div className={styles.clubRow}>
        <div>
          <p className={styles.clubName}>{club.name}</p>
          <p className={styles.clubRole}>
            {club.type === "community" ? "Community" : "Club"} · President / Lead
          </p>
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
          <p className={styles.statValue}>{getTenure((club as ApprovedClub & { createdAt?: string }).createdAt)}</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>TOTAL EVENTS</p>
          <p className={styles.statValue}>{club.eventStats.total} Proposed</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>MEMBERS</p>
          <p className={styles.statValue}>{club.memberCount}</p>
        </div>
      </div>
    </div>
  );
}

function PendingCard({ item }: { item: PendingClubItem }) {
  return (
    <div className={`${styles.credentialCard} ${styles.pendingCredentialCard}`}>
      <div className={styles.clubRow}>
        <div>
          <p className={styles.clubName}>{item.name}</p>
          <p className={styles.clubRole}>
            {item.type === "community" ? "Community" : "Club"}
            {item.category ? ` · ${item.category}` : ""}
          </p>
        </div>
        <span className={styles.pendingBadge}>
          <Clock size={12} />
          Pending Review
        </span>
      </div>

      <div className={styles.divider} />

      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <p className={styles.statLabel}>SUBMITTED</p>
          <p className={styles.statValue}>
            {new Date(item.submittedAt).toLocaleDateString("en-MY", {
              year: "numeric", month: "short", day: "numeric",
            })}
          </p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>STATUS</p>
          <p className={`${styles.statValue} ${styles.pendingText}`}>Awaiting admin approval</p>
        </div>
      </div>
    </div>
  );
}

export default function LeadershipCredentials({ clubs }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <ShieldCheck size={16} className={styles.headerIcon} />
        <h3 className={styles.title}>Leadership Credentials</h3>
      </div>

      <div className={styles.clubList}>
        {clubs.map(item =>
          item.status === "approved"
            ? <ApprovedCard key={`club-${item.id}`} club={item} />
            : <PendingCard key={`pending-${item.requestId}`} item={item} />
        )}
      </div>
    </div>
  );
}
