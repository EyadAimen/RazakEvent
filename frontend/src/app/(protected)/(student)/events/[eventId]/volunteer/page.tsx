"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import Alert from "@/components/shared/alertComponent/alert";
import ApplyForm from "./ApplyForm";
import styles from "./page.module.css";
import { fetchOpenVolunteeringEvents } from "./utils/services/volunteer.service";
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
    fetchOpenVolunteeringEvents()
      .then(res => {
        const found = res.events.find(e => e.eventId === eventId);
        if (!found) {
          setError("Event not found or volunteering is not open for this event.");
        } else {
          setEventData(found);
        }
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
          <div className={styles.loadingState}>
            <Loader2 size={32} className={styles.spinner} />
            <p>Loading event details…</p>
          </div>
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
