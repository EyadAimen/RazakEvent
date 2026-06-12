"use client";

import { apiFetchAuth } from "@/lib/api";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Alert from "@/components/shared/alertComponent/alert";
import ApplyForm from "./ApplyForm";
import styles from "./page.module.css";
import { EventData } from "./utils/interfaces/volunteer.interface";

export default function VolunteerApplicationPage() {
  const params = useParams();
  const eventId = Number(params.eventId);
  const router = useRouter();

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // We fetch all open events and find the one that matches eventId
    apiFetchAuth<{ event: any }>(`/events/shared/${eventId}`)
  .then((res) => {
    const event = res.event;

    if (
      !event ||
      event.volunteeringStatus !== "open" ||
      !event.canVolunteer
    ) {
      setError("Event not found or volunteering is not open for this event.");
      return;
    }

    const found = {
      eventId: event.id,
      eventName: event.name,
      eventDate: event.eventDate,
      clubName: event.clubName,
      roles: event.volunteerRoles.map((role: any) => ({
        roleId: role.id,
        roleName: role.name,
        description: role.description ?? null,
        slotsAvailable: role.slotsAvailable,
        slotsFilled: role.slotsFilled,
      })),
    };

    setEventData(found);
  })
      .catch(err => {
        setError(err.message ?? "Failed to load event data.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [eventId]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <Alert isOpen={true} onClose={() => {}} variant="loading" message="Loading event details…" />
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.errorState}>
            <Alert isOpen={!!error} onClose={() => setError(null)} variant="error" message={error || "Event not found"} />
            <button className={styles.backLink} onClick={() => router.back()}>
              <ArrowLeft size={14} /> Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <button className={styles.backLink} onClick={() => router.back()}>
          <ArrowLeft size={14} /> Back to Event
        </button>

        <ApplyForm eventData={eventData} />
      </div>
    </div>
  );
}
