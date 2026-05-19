"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, ShieldCheck, Users, ChevronRight, User, Loader2 } from "lucide-react";
import Triangle from "@/components/shared/triangle/triangle";
import { getUser, type AuthUser } from "@/lib/auth";
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

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.body}>
          <div className={styles.inner}>
            <div className={styles.loadingState}>
              <Loader2 size={32} className={styles.spinner} />
              <p>Loading dashboard…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.body}>
        <Triangle style={{ left: "0px",   top: "60px",    transform: "rotate(-20deg)", borderBottomColor: "var(--color-primary-500)"   }} />
        <Triangle style={{ right: "30px", top: "40px",    transform: "rotate(10deg)",  borderBottomColor: "var(--color-secondary-500)" }} />
        <Triangle style={{ left: "20px",  bottom: "120px",transform: "rotate(-10deg)", borderBottomColor: "var(--color-semantic-red)"  }} />
        <Triangle style={{ right: "0px",  bottom: "60px", transform: "rotate(20deg)",  borderBottomColor: "var(--color-primary-800)"   }} />

        <div className={styles.inner}>
          <div className={styles.welcomeBanner}>
            <div className={styles.welcomeText}>
              <p className={styles.clubLabel}>KTR Community Admin</p>
              <h1 className={styles.welcomeHeading}>
                Welcome back, {user.fullName.split(" ")[0]}
              </h1>
            </div>
            <button className={styles.profileBtn} onClick={() => router.push("/admin/profile")}>
              <User size={15} />
              View Profile
            </button>
          </div>

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

          <section className={styles.eventsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recent Activity</h2>
            </div>
            <div className={styles.emptyState}>
              <p>No recent activity.</p>
              <a href="/requests" className={styles.emptyCta}>View pending requests →</a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
