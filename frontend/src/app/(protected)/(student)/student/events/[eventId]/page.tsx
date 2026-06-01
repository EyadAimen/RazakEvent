"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, Wallet, Download, Loader2, Users } from "lucide-react";
import { fetchSharedEventDetail } from "./utils/services/events.services";
import { SharedEventDetail } from "./utils/interface/events.interface";
import Alert from "@/components/shared/alertComponent/alert";
import styles from "./events.module.css";

export default function SharedEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<SharedEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    fetchSharedEventDetail(eventId)
      .then(setEvent)
      .catch(err => setError(err.message ?? "Failed to load event"))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return <Alert isOpen={true} onClose={() => { }} variant="loading" message="Loading event details..." />;
  }

  if (error) {
    return <Alert isOpen={true} onClose={() => router.back()} variant="error" message={error} />;
  }

  if (!event) {
    return <Alert isOpen={true} onClose={() => router.back()} variant="error" message="Event not found" />;
  }

  const statusClass = styles[event.status] || styles.defaultStatus;

  const getVolunteeringStatusClass = () => {
    switch (event.volunteeringStatus) {
      case "open": return styles.volOpen;
      case "closed": return styles.volClosed;
      case "full": return styles.volFull;
      default: return styles.volClosed;
    }
  };

  const getVolunteeringStatusText = () => {
    switch (event.volunteeringStatus) {
      case "open": return "✅ Open for applications";
      case "closed": return "🔒 Closed";
      case "full": return "🔴 All slots filled";
      default: return "Not available";
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className={styles.card}>
          <div className={styles.header}>
            <div>
              <span className={styles.clubTag}>{event.clubName}</span>
              <h1>{event.name}</h1>
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
                  <Calendar size={14} /> {new Date(event.eventDate).toLocaleDateString()}
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

          <div className={styles.description}>
            <h3>Description</h3>
            <p>{event.description}</p>
          </div>

          {/* Volunteering section */}
          {event.volunteeringStatus && (
            <div className={styles.volunteering}>
              <h3>Volunteering</h3>
              <div className={`${styles.volStatus} ${getVolunteeringStatusClass()}`}>
                <Users size={16} />
                <span>{getVolunteeringStatusText()}</span>
              </div>
              {event.volunteerRoles.length > 0 && (
                <div className={styles.roles}>
                  <h4>Available roles</h4>
                  <ul>
                    {event.volunteerRoles.map(role => (
                      <li key={role.id}>
                        <strong>{role.name}</strong> – {role.remainingSlots} / {role.slotsAvailable} slots
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {event.volunteeringStatus === "open" && (
                event.hasApplied ? (
                  <button className={styles.applyBtn} disabled style={{ opacity: 0.6, cursor: "not-allowed" }}>
                    Already applied
                  </button>
                ) : (
                  <button 
                    className={styles.applyBtn}
                    onClick={() => router.push(`/events/${eventId}/volunteer`)}
                  >
                    Apply to volunteer
                  </button>
                )
              )}
            </div>
          )}

          {event.proposalPdfUrl && (
            <div className={styles.pdfLink}>
              <a href={`http://localhost:5000${event.proposalPdfUrl}`} target="_blank" rel="noreferrer">
                <Download size={14} /> View proposal PDF
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}