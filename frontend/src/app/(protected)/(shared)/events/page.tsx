"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";
import { fetchSharedEvents } from "./utils/services/events.services";
import { SharedEvent } from "./utils/interface/events.interface";
import Alert from "@/components/shared/alertComponent/alert";
import styles from "./events.module.css";


export default function SharedEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<SharedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSharedEvents()
      .then(data => {
        // Filter upcoming events (eventDate >= today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = data.filter(event => new Date(event.eventDate) >= today);
        // Sort by date ascending (earliest first)
        upcoming.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
        setEvents(upcoming);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter(event =>
    event.name.toLowerCase().includes(search.toLowerCase()) ||
    event.clubName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <Alert isOpen={true} onClose={() => {}} variant="loading" message="Loading events..." />;
  }

  if (error) {
    return <Alert isOpen={true} onClose={() => {}} variant="error" message={error} />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Events</h2>
          <p>Discover upcoming and ongoing events</p>
        </div>

        <div className={styles.controls}>
          <input
            type="text"
            placeholder="Search by event or club..."
            className={styles.search}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          
        </div>

        
          <div className={styles.grid}>
            {filtered.map(event => (
                <div
                  key={event.id}
                  className={styles.card}
                  onClick={() => router.push(`/events/${event.id}`)}
                >
                  <div className={styles.cardHeader}>
                    <h3>{event.name}</h3>
                  </div>
                  <p className={styles.description}>{event.description}</p>
                  <div className={styles.cardFooter}>
                    <span className={styles.club}>{event.clubName}</span>
                    <span className={styles.date}>
                      <Calendar size={14} />
                      {new Date(event.eventDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
            ))}
          </div>
        
      </div>
    </div>
  );
}