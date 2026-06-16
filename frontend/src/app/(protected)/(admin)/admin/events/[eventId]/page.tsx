// app/(admin)/admin/events/[eventId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, Wallet, Download, Loader2 } from "lucide-react";
import { fetchAdminEventDetail } from "./utils/services/events.services";
import { AdminEventDetail as EventType } from "./utils/interface/events.interface";
import Alert from "@/components/shared/alertComponent/alert";
import styles from "./events.module.css";

export default function AdminEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<EventType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    fetchAdminEventDetail(eventId)
      .then(setEvent)
      .catch((err) => setError(err.message ?? "Failed to load event"))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return <Alert isOpen={true} onClose={() => {}} variant="loading" message="Loading event details..." />;
  }

  if (error) {
    return (
      <Alert
        isOpen={true}
        onClose={() => router.back()}  // Go back on error dismiss
        variant="error"
        message={error}
      />
    );
  }

  if (!event) {
    return (
      <Alert
        isOpen={true}
        onClose={() => router.back()}
        variant="error"
        message="Event not found"
      />
    );
  }

  // Map status to a CSS class for badge styling
  const statusClass = event.status === "approved" ? styles.approved :
                      event.status === "ongoing" ? styles.ongoing :
                      event.status === "completed" ? styles.completed :
                      event.status === "report_due" ? styles.report_due :
                      styles.defaultStatus;

  return (
    <div className={styles.viewportContainer}>
      <div className={styles.mainLayout}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={14} /> Back
        </button>

        <div className={styles.eventCard}>
          <div className={styles.headerRow}>
            <div>
              <span className={styles.badge}>{event.clubName}</span>
              <h1 className={styles.title}>{event.name}</h1>
            </div>
            <span className={`${styles.statusBadge} ${statusClass}`}>
              {event.status.replace("_", " ")}
            </span>
          </div>

          <div className={styles.infoGrid}>
            {event.eventDate && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>DATE</span>
                <span className={styles.infoValue}>
                  <Calendar size={14} /> {new Date(event.eventDate).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })}{" "}{new Date(event.eventDate).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            )}
            {event.venueName && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>VENUE</span>
                <span className={styles.infoValue}>
                  <MapPin size={14} /> {event.venueName}
                </span>
              </div>
            )}
            {event.budget && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>BUDGET</span>
                <span className={styles.infoValue}>
                  <Wallet size={14} /> RM {event.budget.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {event.adminComment && (
            <div className={styles.adminComment}>
              <strong>Admin note:</strong> {event.adminComment}
            </div>
          )}

          <div className={styles.descriptionBlock}>
            <h3>Description</h3>
            <p>{event.description}</p>
          </div>

          {event.proposalPdfUrl && (
            <div className={styles.cardActions}>
              <a
                href={`http://localhost:5000${event.proposalPdfUrl}`}
                target="_blank"
                rel="noreferrer"
                className={styles.actionSecondary}
              >
                <Download size={14} /> View Proposal PDF
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}