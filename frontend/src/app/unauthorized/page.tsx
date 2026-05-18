"use client";

import { useRouter } from "next/navigation";
import styles from "./unauthorized.module.css";

import Circle from "@/components/shared/circle/circle";
import Rectangle from "@/components/shared/rectangle/rectangle";
import Triangle from "@/components/shared/triangle/triangle";

export default function Unauthorized() {
  const router = useRouter();

  return (
    <main className={styles.centeredPageWrapper}>
      {/* Shuffled Objects for 403 Layout */}
      <Circle
        style={{
          width: "150px",
          height: "150px",
          top: "12vh",
          left: "16vw",
          transform: "rotate(40deg)",
          background: "var(--color-secondary-500)",
          opacity: 0.7
        }}
      />
      <Triangle
        style={{
          width: "130px",
          height: "130px",
          top: "15vh",
          right: "10vw",
          transform: "rotate(-30deg)",
          color: "var(--color-semantic-red)",
          opacity: 0.8
        }}
      />
      <Rectangle
        style={{
          width: "170px",
          height: "110px",
          bottom: "18vh",
          left: "8vw",
          transform: "rotate(-15deg)",
          background: "var(--color-ktr-navy)",
          opacity: 0.6
        }}
      />
      <Rectangle
        style={{
          width: "140px",
          height: "140px",
          bottom: "10vh",
          right: "18vw",
          transform: "rotate(12deg)",
          background: "#3B6FD4",
          opacity: 0.5
        }}
      />

      <div className={styles.hugeDisplayCodeWrap}>
        <div className={styles.errorBox}>
          <span className={styles.systemTitle}>RazakEvent</span>

          <div className={`${styles.badge} ${styles.badgeAlert}`}>Access Denied</div>
          <h1 className={styles.title}>Unauthorized</h1>

          <p className={styles.description}>
            Your account role configuration does not possess clearance to view this secure directory. If you think this is a mistake, contact your KTR admin.
          </p>

          <button
            type="button"
            onClick={() => router.back()}
            className={`${styles.actionButton} ${styles.btnAlert}`}
          >
            Go Back to Previous Page
          </button>
        </div>

        <div className={styles.hugeDisplayCode}>
          <span className={styles.redText}>403</span>
        </div>
      </div>
    </main>
  );
}