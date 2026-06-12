"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, Users } from "lucide-react";
import { fetchSharedEventDetail } from "./utils/services/events.services";
import { SharedEventDetail } from "./utils/interface/events.interface";
import Alert from "@/components/shared/alertComponent/alert";
import { getUser } from "@/lib/auth";
import styles from "./events.module.css";

export default function SharedEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const role = getUser()?.role;

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
  const showBadge = false;

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
            {showBadge && (
              <span className={`${styles.statusBadge} ${statusClass}`}>
                {event.status.replace("_", " ")}
              </span>
            )}
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
          </div>

          <div className={styles.description}>
            <h3>Description</h3>
            <p>{event.description}</p>
          </div>

          {/* Volunteering section */}
          {role === "student" && event.volunteeringStatus && (
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
                        <strong>{role.name}</strong> – {role.slotsFilled} / {role.slotsAvailable}{role.remainingSlots === 0 ? " filled" : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {event.volunteeringStatus === "open" && (
                event.hasApplied === true ? (
                  <button className={styles.applyBtn} disabled>
                    Already applied
                  </button>
                ) : event.canVolunteer ? (
                  <button
                    className={styles.applyBtn}
                    onClick={() => router.push(`/events/${eventId}/volunteer`)}
                  >
                    Apply to volunteer
                  </button>
                ) : (
                  <p className={styles.volunteerNotice}>
                    Only members of this club can volunteer.
                  </p>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}