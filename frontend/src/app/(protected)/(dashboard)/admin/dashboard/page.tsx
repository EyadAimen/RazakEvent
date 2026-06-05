"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  ShieldCheck,
  Users,
  ChevronRight,
  User,
  Building2,
  UsersRound,
  FileWarning,
  FileCheck2,
} from "lucide-react";
import Triangle from "@/components/shared/triangle/triangle";
import Alert from "@/components/shared/alertComponent/alert";
import { getUser, type AuthUser } from "@/lib/auth";
import { getAdminDashboard } from "./utils/services/dashboard.service";
import type { AdminDashboardData } from "./utils/interfaces/dashboard.interface";
import styles from "./page.module.css";

const QUICK_ACTIONS = [
  {
    id: "requests",
    icon: <ClipboardList size={22} />,
    label: "Review",
    sublabel: "Requests",
    href: "/requests",
  },
  {
    id: "roles",
    icon: <ShieldCheck size={22} />,
    label: "Manage",
    sublabel: "Roles",
    href: "/manage-roles",
  },
  {
    id: "users",
    icon: <Users size={22} />,
    label: "All",
    sublabel: "Users",
    href: "/manage-roles",
  },
];

type StatCard = {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  colorClass: string;
  href: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [data, setData]       = useState<AdminDashboardData | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getUser());
    getAdminDashboard()
      .then(setData)
      .catch(err => setError(err.message ?? "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const stats: StatCard[] = data
    ? [
        { label: "Active Users",      value: data.activeUsers,      icon: <UsersRound size={20} />,  colorClass: styles.statBlue,   href: "/manage-roles" },
        { label: "Total Clubs",       value: data.totalClubs,       icon: <Building2 size={20} />,   colorClass: styles.statNavy,   href: "/clubs"        },
        { label: "Communities",       value: data.totalCommunities, icon: <Users size={20} />,       colorClass: styles.statPurple, href: "/clubs"        },
        { label: "Pending Proposals", value: data.pendingProposals, icon: <FileCheck2 size={20} />,  colorClass: styles.statYellow, href: "/requests"     },
        { label: "Reports Due",       value: data.reportsDue,       icon: <FileWarning size={20} />, colorClass: styles.statRed,    href: "/requests"     },
      ]
    : [];

  return (
    <>
    <Alert variant="loading" isOpen={loading} onClose={() => {}} message="Loading dashboard…" />
    <div className={styles.page}>
      <div className={styles.body}>
        <Triangle style={{ left: "0px",    top: "60px",     transform: "rotate(-20deg)", borderBottomColor: "var(--color-primary-500)"   }} />
        <Triangle style={{ right: "30px",  top: "40px",     transform: "rotate(10deg)",  borderBottomColor: "var(--color-secondary-500)" }} />
        <Triangle style={{ left: "20px",   bottom: "120px", transform: "rotate(-10deg)", borderBottomColor: "var(--color-semantic-red)"  }} />
        <Triangle style={{ right: "0px",   bottom: "60px",  transform: "rotate(20deg)",  borderBottomColor: "var(--color-primary-800)"   }} />

        <div className={styles.inner}>
          {/* ── Welcome banner ── */}
          <div className={styles.welcomeBanner}>
            <div className={styles.welcomeText}>
              <p className={styles.clubLabel}>KTR Community Admin</p>
              <h1 className={styles.welcomeHeading}>
                Welcome back, {user?.fullName.split(" ")[0]}
              </h1>
            </div>
            <button className={styles.profileBtn} onClick={() => router.push("/admin/profile")}>
              <User size={15} />
              View Profile
            </button>
          </div>

          {/* ── Stat cards ── */}
          {error ? (
            <p className={styles.errorState}>⚠ {error}</p>
          ) : !data ? (
            <div className={styles.statsGrid}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`${styles.statCard} ${styles.statSkeleton}`} />
              ))}
            </div>
          ) : (
            <div className={styles.statsGrid}>
              {stats.map(s => (
                <a key={s.label} href={s.href} className={`${styles.statCard} ${s.colorClass}`}>
                  <div className={styles.statIcon}>{s.icon}</div>
                  <div className={styles.statBody}>
                    <span className={styles.statValue}>{s.value}</span>
                    <span className={styles.statLabel}>{s.label}</span>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* ── Club / Community requests banner ── */}
          {data && (
            <a href="/clubs" className={styles.reviewQueue}>
              <div className={styles.reviewQueueLeft}>
                <ClipboardList size={18} className={styles.reviewQueueIcon} />
                <div>
                  <p className={styles.reviewQueueLabel}>Review Queue</p>
                  <p className={styles.reviewQueueTitle}>Club / Community Requests</p>
                </div>
              </div>
              <div className={styles.reviewQueueRight}>
                <span className={styles.reviewQueueBadge}>{data.clubRequests} Pending</span>
                <ChevronRight size={16} />
              </div>
            </a>
          )}

          {/* ── Quick actions ── */}
          <div className={styles.quickActions}>
            {QUICK_ACTIONS.map((action) => (
              <a key={action.id} href={action.href} className={styles.qaCard}>
                <span className={styles.qaIcon}>{action.icon}</span>
                <div className={styles.qaText}>
                  <span className={styles.qaLabel}>{action.label}</span>
                  <span className={styles.qaSublabel}>{action.sublabel}</span>
                </div>
                <ChevronRight size={16} className={styles.qaChevron} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
