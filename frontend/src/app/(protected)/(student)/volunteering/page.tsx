"use client";

import { useEffect, useState } from "react";
import { HandHeart } from "lucide-react";
import Triangle from "@/components/shared/triangle/triangle";
import Alert from "@/components/shared/alertComponent/alert";
import VolunteeringCard, { VolunteeringCardSkeleton } from "@/components/volunteering/VolunteeringCard";
import { fetchMyVolunteeringApplications, VolunteeringApplication } from "./utils/services/volunteering.service";
import styles from "./page.module.css";

type FilterType = "all" | "pending" | "accepted" | "rejected";

export default function VolunteeringPage() {
  const [applications, setApplications] = useState<VolunteeringApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    fetchMyVolunteeringApplications()
      .then((res) => {
        setApplications(res.applications);
      })
      .catch((err) => {
        setError(err.message ?? "Failed to load volunteering applications.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredApplications = applications.filter((app) => {
    if (filter === "all") return true;
    return app.status === filter;
  });

  return (
    <div className={styles.page}>
      <div className={styles.body}>
        <Triangle style={{ left: "0px", top: "60px", transform: "rotate(-20deg)", borderBottomColor: "var(--color-primary-500)" }} />
        <Triangle style={{ right: "30px", top: "40px", transform: "rotate(10deg)", borderBottomColor: "var(--color-secondary-500)" }} />
        <Triangle style={{ left: "20px", bottom: "120px", transform: "rotate(-10deg)", borderBottomColor: "var(--color-semantic-red)" }} />
        <Triangle style={{ right: "0px", bottom: "60px", transform: "rotate(20deg)", borderBottomColor: "var(--color-primary-800)" }} />

        <div className={styles.inner}>
          <div className={styles.heading}>
            <h1 className={styles.title}>Volunteering</h1>
            <p className={styles.subtitle}>Track your volunteering history and apply for new opportunities.</p>
          </div>

          <Alert
            isOpen={!!error}
            onClose={() => setError(null)}
            variant="error"
            message={error || ""}
          />

          {!loading && !error && (
            <div className={styles.filters}>
              {(["all", "pending", "accepted", "rejected"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  className={`${styles.filterBtn} ${filter === f ? styles.active : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          )}

          {(loading || (!error && filteredApplications.length > 0)) && (
            <div className={styles.listContainer}>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <VolunteeringCardSkeleton key={i} />
                ))
              ) : (
                filteredApplications.map((app) => (
                  <VolunteeringCard key={app.applicationId} application={app} />
                ))
              )}
            </div>
          )}

          {!loading && !error && filteredApplications.length === 0 && (
            <div className={styles.emptyCard}>
              <HandHeart size={40} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No volunteering records</p>
              <p className={styles.emptyDesc}>
                {filter === "all"
                  ? "You have not applied to volunteer for any events yet."
                  : `You have no ${filter} volunteering applications.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
