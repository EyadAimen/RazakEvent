"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, FilePlus, Loader2 } from "lucide-react";
import Link from "next/link";
import Triangle from "@/components/shared/triangle/triangle";
import LeadEventCard, { LeadEvent } from "@/components/lead/LeadEventCard/LeadEventCard";
import { apiFetchAuth } from "@/lib/api";
import type { ApiEvent, EventsTab } from "@/types/lead";
import styles from "./events.module.css";

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS: { label: string; value: EventsTab }[] = [
  { label: "All",        value: "all"        },
  { label: "Draft",      value: "draft"      },
  { label: "Submitted",  value: "submitted"  },
  { label: "Approved",   value: "approved"   },
  { label: "Ongoing",    value: "ongoing"    },
  { label: "Completed",  value: "completed"  },
  { label: "Report Due", value: "report_due" },
  { label: "Rejected",   value: "rejected"   },
];

const STATUS_MAP: Record<string, { variant: LeadEvent["status"]; label: string }> = {
  draft:      { variant: "draft",         label: "Draft"      },
  submitted:  { variant: "pending-admin", label: "Submitted"  },
  approved:   { variant: "approved",      label: "Approved"   },
  ongoing:    { variant: "approved",      label: "Ongoing"    },
  completed:  { variant: "completed",     label: "Completed"  },
  report_due: { variant: "report-due",    label: "Report Due" },
  rejected:   { variant: "rejected",      label: "Rejected"   },
};

function toLeadEvent(e: ApiEvent): LeadEvent {
  const { variant, label } = STATUS_MAP[e.status] ?? { variant: "draft", label: e.status };
  return {
    id:              e.id,
    name:            e.name,
    clubName:        e.clubName,
    date:            e.eventDate
      ? new Date(e.eventDate).toLocaleDateString("en-MY", {
          year: "numeric", month: "short", day: "numeric",
        })
      : "TBD",
    attendees:       e.attendees ?? 0,
    status:          variant,
    statusLabel:     label,
    hasPendingReport: e.status === "report_due",
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeadEventsPage() {
  const router = useRouter();
  const [events, setEvents]   = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [tab, setTab]         = useState<EventsTab>("all");
  const [search, setSearch]   = useState("");

  useEffect(() => {
    apiFetchAuth<{ events: ApiEvent[] }>("/events/lead")
      .then(d => setEvents(d.events))
      .catch(err => setError(err.message ?? "Failed to load events"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter(e => {
    const matchTab    = tab === "all" ? e.status !== "rejected" : e.status === tab;
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className={styles.page}>
      <div className={styles.body}>

        {/* Decorative triangles */}
        <Triangle style={{ left: "0px",   top: "60px",     transform: "rotate(-20deg)", borderBottomColor: "var(--color-primary-500)"   }} />
        <Triangle style={{ right: "30px", top: "40px",     transform: "rotate(10deg)",  borderBottomColor: "var(--color-secondary-500)" }} />
        <Triangle style={{ left: "20px",  bottom: "120px", transform: "rotate(-10deg)", borderBottomColor: "var(--color-semantic-red)"   }} />
        <Triangle style={{ right: "0px",  bottom: "60px",  transform: "rotate(20deg)",  borderBottomColor: "var(--color-primary-800)"   }} />

        <div className={styles.inner}>

          {/* Page header */}
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.title}>My Events</h1>
              <p className={styles.subtitle}>Manage your club&apos;s event proposals and activities</p>
            </div>
            <Link href="/lead/events/new" className={styles.proposeBtn}>
              <Plus size={16} />
              Propose New Event
            </Link>
          </div>

          {/* Controls: search + filter tabs */}
          <div className={styles.controls}>
            <div className={styles.searchWrap}>
              <Search size={15} className={styles.searchIcon} />
              <input
                className={styles.search}
                placeholder="Search events..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className={styles.tabs}>
              {TABS.map(t => (
                <button
                  key={t.value}
                  className={`${styles.tab} ${tab === t.value ? styles.tabActive : ""}`}
                  onClick={() => setTab(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content — key forces clean remount on tab change */}
          {loading ? (
            <div className={styles.loadingState}>
              <Loader2 size={32} className={styles.spinner} />
              <p>Loading events…</p>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <p>⚠ {error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <FilePlus size={48} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>
                {tab === "all" && !search ? "No events yet" : "No events found"}
              </p>
              <p className={styles.emptyText}>
                {tab === "all" && !search
                  ? "You haven't proposed any events yet."
                  : "Try a different filter or search term."}
              </p>
              {tab === "all" && !search && (
                <Link href="/lead/events/new" className={styles.emptyCta}>
                  + Propose your first event
                </Link>
              )}
            </div>
          ) : (
            <div key={tab} className={styles.grid}>
              {filtered.map(e => (
                <LeadEventCard
                  key={e.id}
                  event={toLeadEvent(e)}
                  onManage={id => router.push(`/lead/events/${id}`)}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
