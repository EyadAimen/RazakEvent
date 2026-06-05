"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket, HandHeart, Award, ChevronRight, User, Calendar, MapPin } from "lucide-react";
import Triangle from "@/components/shared/triangle/triangle";
import Alert from "@/components/shared/alertComponent/alert";
import { getUser, type AuthUser } from "@/lib/auth";
import { getUpcomingEvents } from "./utils/services/dashboard.service";
import type { UpcomingEvent } from "./utils/interfaces/dashboard.interface";
import styles from "./page.module.css";

const QUICK_ACTIONS = [
  {
    id: "events",
    icon: <Ticket size={22} />,
    label: "Browse",
    sublabel: "Events",
    href: "/student/events",
  },
  {
    id: "volunteering",
    icon: <HandHeart size={22} />,
    label: "My",
    sublabel: "Volunteering",
    href: "/volunteering",
  },
  {
    id: "certificates",
    icon: <Award size={22} />,
    label: "My",
    sublabel: "Certificates",
    href: "/certificates",
  },
];

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser]           = useState<AuthUser | null>(null);
  const [events, setEvents]       = useState<UpcomingEvent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    setUser(getUser());
    getUpcomingEvents()
      .then(setEvents)
      .catch(err => setError(err.message ?? "Failed to load events"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Alert variant="loading" isOpen={loading} onClose={() => {}} message="Loading dashboard…" />
      <div className={styles.page}>
        <div className={styles.body}>
          <Triangle style={{ left: "0px",   top: "60px",     transform: "rotate(-20deg)", borderBottomColor: "var(--color-primary-500)"   }} />
          <Triangle style={{ right: "30px", top: "40px",     transform: "rotate(10deg)",  borderBottomColor: "var(--color-secondary-500)" }} />
          <Triangle style={{ left: "20px",  bottom: "120px", transform: "rotate(-10deg)", borderBottomColor: "var(--color-semantic-red)"  }} />
          <Triangle style={{ right: "0px",  bottom: "60px",  transform: "rotate(20deg)",  borderBottomColor: "var(--color-primary-800)"   }} />

          <div className={styles.inner}>
            <div className={styles.welcomeBanner}>
              <div className={styles.welcomeText}>
                <p className={styles.clubLabel}>KTR Community Student</p>
                <h1 className={styles.welcomeHeading}>
                  Welcome back, {user?.fullName.split(" ")[0]}
                </h1>
              </div>
              <button className={styles.profileBtn} onClick={() => router.push("/student/profile")}>
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
                <h2 className={styles.sectionTitle}>Upcoming Events</h2>
                <a href="/student/events" className={styles.viewAll}>View All →</a>
              </div>

              {error ? (
                <p className={styles.errorState}>⚠ {error}</p>
              ) : !loading && events.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No upcoming events yet.</p>
                  <a href="/student/events" className={styles.emptyCta}>Browse available events →</a>
                </div>
              ) : (
                <div className={styles.eventsGrid}>
                  {events.map(event => (
                    <a
                      key={event.id}
                      href={`/student/events/${event.id}`}
                      className={styles.eventCard}
                    >
                      <div className={styles.eventCardTop}>
                        <span className={styles.clubTag}>{event.clubName}</span>
                      </div>
                      <h3 className={styles.eventName}>{event.name}</h3>
                      <div className={styles.eventMeta}>
                        <span className={styles.metaItem}>
                          <Calendar size={12} />
                          {new Date(event.eventDate).toLocaleDateString("en-MY", {
                            year: "numeric", month: "short", day: "numeric",
                          })}
                        </span>
                        {event.venueName && (
                          <span className={styles.metaItem}>
                            <MapPin size={12} />
                            {event.venueName}
                          </span>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
