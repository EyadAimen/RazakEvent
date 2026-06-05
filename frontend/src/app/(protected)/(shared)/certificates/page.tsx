"use client";

import { useEffect, useState } from "react";
import { Award, Download, Loader2 } from "lucide-react";
import Triangle from "@/components/shared/triangle/triangle";
import { fetchMyCertificates, downloadCertificate } from "./utils/services/certificate.service";
import type { Certificate } from "./utils/interfaces/certificate.interface";
import styles from "./page.module.css";

// ── Sub-components ────────────────────────────────────────────────────────────

function CertificateCardSkeleton() {
  return <div className={styles.cardSkeleton} />;
}

function CertificateCard({ cert }: { cert: Certificate }) {
  const [downloading, setDownloading] = useState(false);
  const [dlError,     setDlError]     = useState<string | null>(null);

  const handleDownload = async () => {
    setDlError(null);
    setDownloading(true);
    try {
      await downloadCertificate(cert.certificateId, cert.eventName);
    } catch {
      setDlError("Download failed. Try again.");
    } finally {
      setDownloading(false);
    }
  };

  const formattedDate = cert.eventDate
    ? new Date(cert.eventDate).toLocaleDateString("en-MY", {
        year: "numeric", month: "long", day: "numeric",
      })
    : cert.issuedAt
    ? new Date(cert.issuedAt).toLocaleDateString("en-MY", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "—";

  return (
    <div className={styles.card}>
      <div className={styles.cardIconWrap}>
        <Award size={28} className={styles.cardIcon} />
      </div>

      <span className={`${styles.typeBadge} ${cert.type === "organizer" ? styles.typeOrganizer : styles.typeVolunteer}`}>
        {cert.type.toUpperCase()}
      </span>

      <h3 className={styles.cardTitle}>{cert.eventName}</h3>
      <p className={styles.cardDate}>{formattedDate}</p>

      {dlError && <p className={styles.dlError}>{dlError}</p>}

      <button
        className={styles.downloadBtn}
        onClick={handleDownload}
        disabled={downloading}
      >
        {downloading
          ? <Loader2 size={13} className={styles.spinnerSm} />
          : <Download size={13} />}
        Download PDF
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    fetchMyCertificates()
      .then(res => setCertificates(res.certificates))
      .catch(err => setError(err.message ?? "Failed to load certificates."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.body}>
        <Triangle style={{ left: "0px",   top: "60px",     transform: "rotate(-20deg)", borderBottomColor: "var(--color-primary-500)"   }} />
        <Triangle style={{ right: "30px", top: "40px",     transform: "rotate(10deg)",  borderBottomColor: "var(--color-secondary-500)" }} />
        <Triangle style={{ left: "20px",  bottom: "120px", transform: "rotate(-10deg)", borderBottomColor: "var(--color-semantic-red)"  }} />
        <Triangle style={{ right: "0px",  bottom: "60px",  transform: "rotate(20deg)",  borderBottomColor: "var(--color-primary-800)"   }} />

        <div className={styles.inner}>
          <div className={styles.heading}>
            <h1 className={styles.title}>My Certificates</h1>
            <p className={styles.subtitle}>
              Download and manage your certificates for participation and volunteering.
            </p>
          </div>

          {error && (
            <div className={styles.errorBanner}>{error}</div>
          )}

          {loading && (
            <div className={styles.grid}>
              {Array.from({ length: 3 }).map((_, i) => (
                <CertificateCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!loading && !error && certificates.length > 0 && (
            <div className={styles.grid}>
              {certificates.map(cert => (
                <CertificateCard key={cert.certificateId} cert={cert} />
              ))}
            </div>
          )}

          {!loading && !error && certificates.length === 0 && (
            <div className={styles.emptyCard}>
              <Award size={40} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No certificates yet</p>
              <p className={styles.emptyDesc}>
                Certificates issued by event leads will appear here once you participate as a volunteer or organizer.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
