"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getUser, saveUser, logoutUser, requestPasswordReset, type AuthUser } from "@/lib/auth";
import Circle from "@/components/shared/circle/circle";
import Rectangle from "@/components/shared/rectangle/rectangle";
import Triangle from "@/components/shared/triangle/triangle";
import ProfileCard from "@/components/profile/ProfileCard/ProfileCard";
import VolunteeringHistoryTable from "@/components/profile/VolunteeringHistoryTable/VolunteeringHistoryTable";
import EditProfileModal from "@/components/profile/EditProfileModal/EditProfileModal";
import DangerZone from "@/components/profile/DangerZone/DangerZone";
import SignOutCard from "@/components/profile/SignOutCard/SignOutCard";
import Alert from "@/components/shared/alertComponent/alert";
import {
  fetchVolunteeringHistory,
  updateProfileName,
} from "@/components/profile/utils/services/profile.service";
import type { VolunteeringRecord } from "@/components/profile/utils/interfaces/profile.interface";
import styles from "./page.module.css";

export default function StudentProfile() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [records, setRecords] = useState<VolunteeringRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    setUser(getUser());

    fetchVolunteeringHistory()
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoadingHistory(false));
  }, []);

  async function handleSaveName(name: string) {
    if (!user) return;
    setSaving(true);
    try {
      const result = await updateProfileName({ fullName: name });
      saveUser(result.user);
      setUser(result.user);
      setActionSuccess(result.message);
      setModalOpen(false);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to update name.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!user) return;
    setApiLoading(true);
    try {
      await requestPasswordReset(user.email);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to send reset email.");
    } finally {
      setApiLoading(false);
    }
  }

  async function handleSignOut() {
    setApiLoading(true);
    try {
      await logoutUser();
    } finally {
      setApiLoading(false);
      router.replace("/login");
    }
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.body}>
          <div className={styles.inner}>
            <div className={styles.loadingState}>
              <Loader2 size={32} className={styles.spinner} />
              <p>Loading profile…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.page}>
        <div className={styles.body}>
          {/* Decorative shapes */}
          <Rectangle
            style={{
              left: "0px",
              top: "40px",
              transform: "rotate(-15deg)",
              background: "var(--color-ktr-crimson)",
            }}
          />
          <Circle
            style={{
              right: "20px",
              top: "30px",
              background: "var(--color-primary-800)",
            }}
          />
          <Triangle
            style={{
              left: "30px",
              bottom: "100px",
              transform: "rotate(-10deg)",
              borderBottomColor: "var(--color-primary-500)",
            }}
          />
          <Rectangle
            style={{
              right: "10px",
              bottom: "60px",
              transform: "rotate(12deg)",
              background: "var(--color-secondary-500)",
            }}
          />

          <div className={styles.inner}>
            {/* Page heading */}
            <div className={styles.pageHeading}>
              <h1 className={styles.pageTitle}>Profile</h1>
              <p className={styles.pageSubtitle}>
                Manage your personal information and view your activity history.
              </p>
            </div>

            {/* Main grid */}
            <div className={styles.grid}>
              {/* Left column */}
              <div className={styles.leftCol}>
                <ProfileCard
                  user={user}
                  onEditClick={() => setModalOpen(true)}
                />
                <DangerZone onResetPassword={handleResetPassword} />
                <SignOutCard onSignOut={handleSignOut} />
              </div>

              {/* Right column */}
              <div className={styles.rightCol}>
                {loadingHistory ? (
                  <div className={styles.historyLoading}>
                    <Loader2 size={24} className={styles.spinner} />
                    <p>Loading history…</p>
                  </div>
                ) : (
                  <VolunteeringHistoryTable records={records} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={modalOpen}
        currentName={user.fullName}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveName}
      />

      <Alert
        variant="loading"
        isOpen={apiLoading}
        onClose={() => {}}
      />

      <Alert
        variant="error"
        isOpen={apiError !== null}
        message={apiError ?? ""}
        onClose={() => setApiError(null)}
      />
    </>
  );
}
