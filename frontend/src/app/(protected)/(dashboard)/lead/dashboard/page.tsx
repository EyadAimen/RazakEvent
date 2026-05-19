"use client";

import { useEffect, useState } from "react";
import {
  PlusCircle,
  Users,
  Award,
  ChevronRight,
  User,
  Loader2,
} from "lucide-react";
import Triangle from "@/components/shared/triangle/triangle";
import DeadlineAlert from "@/components/shared/DeadlineAlert/DeadlineAlert";
import LeadEventCard, {
  LeadEvent,
} from "@/components/lead/LeadEventCard/LeadEventCard";
import { apiFetchAuth } from "@/lib/api";
import type { DashboardData, ApiEvent } from "@/types/lead";
import styles from "./page.module.css";

/* ── Helpers ──────────────────────────────────────────── */
function toLeadEvent(e: ApiEvent): LeadEvent {
  const statusMap: Record<string, { variant: LeadEvent["status"]; label: string }> = {
    draft:       { variant: "draft",        label: "Draft" },
    submitted:   { variant: "pending-admin", label: "Pending Admin" },
    approved:    { variant: "approved",      label: "Approved" },
    rejected:    { variant: "rejected",      label: "Rejected" },
    completed:   { variant: "completed",     label: "Completed" },
    report_due:  { variant: "report-due",    label: "Report Due" },
  };
  const { variant, label } = statusMap[e.status] ?? { variant: "draft", label: e.status };

  return {
    id: e.id,
    name: e.name,
    clubName: e.clubName,
    date: e.eventDate
      ? new Date(e.eventDate).toLocaleDateString("en-MY", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "TBD",
    attendees: e.attendees ?? 0,
    status: variant,
    statusLabel: label,
    hasPendingReport: e.status === "report_due",
  };
}

const QUICK_ACTIONS = [
  {
    id: "propose",
    icon: <PlusCircle size={22} />,
    label: "Create",
    sublabel: "Propose Event",
    href: "/lead/events/new",
  },
  {
    id: "volunteers",
    icon: <Users size={22} />,
    label: "Volunteers",
    sublabel: "Applications",
    href: "/lead/events",
  },
  {
    id: "certificates",
    icon: <Award size={22} />,
    label: "Certificates",
    sublabel: "Issued",
    href: "/lead/events",
  },
];



/* ── Component ────────────────────────────────────────── */
export default function LeadDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetchAuth<DashboardData>("/events/lead/dashboard")
      .then(setData)
      .catch((err) => setError(err.message ?? "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  /* Skeleton / error states */
  if (loading) {
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

  if (error || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.body}>
          <div className={styles.inner}>
            <div className={styles.errorState}>
              <p>⚠ {error ?? "Could not load dashboard data."}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const events = data.events.map(toLeadEvent);

  return (
    <div className={styles.page}>

      <div className={styles.body}>
        {/* Decorative floating shapes */}
        <Triangle style={{ left: "0px",  top: "60px",    transform: "rotate(-20deg)", borderBottomColor: "var(--color-primary-500)" }} />
        <Triangle style={{ right: "30px", top: "40px",   transform: "rotate(10deg)",  borderBottomColor: "var(--color-secondary-500)" }} />
        <Triangle style={{ left: "20px",  bottom: "120px", transform: "rotate(-10deg)", borderBottomColor: "var(--color-semantic-red)" }} />
        <Triangle style={{ right: "0px",  bottom: "60px", transform: "rotate(20deg)",  borderBottomColor: "var(--color-primary-800)" }} />

        <div className={styles.inner}>
          {/* ── Welcome banner ── */}
          <div className={styles.welcomeBanner}>
            <div className={styles.welcomeText}>
              <p className={styles.clubLabel}>{data.clubLabel}</p>
              <h1 className={styles.welcomeHeading}>
                Welcome back, {data.leadName.split(" ")[0]}
              </h1>
            </div>
            <button className={styles.profileBtn}>
              <User size={15} />
              View Profile
            </button>
          </div>

          {/* ── Deadline alert ── */}
          {data.alert && (
            <DeadlineAlert
              message={data.alert}
              ctaLabel="Submit Report Now"
              onCta={() => {}}
            />
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

          {/* ── My Events section ── */}
          <section className={styles.eventsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>My Proposed Events</h2>
              <a href="/lead/events" className={styles.viewAll}>
                View All ({data.totalEvents}) →
              </a>
            </div>

            {events.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No events yet.</p>
                <a href="/lead/events/new" className={styles.emptyCta}>
                  + Propose your first event
                </a>
              </div>
            ) : (
              <div className={styles.eventsGrid}>
                {events.map((event) => (
                  <LeadEventCard key={event.id} event={event} onManage={() => {}} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

