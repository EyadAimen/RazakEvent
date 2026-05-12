"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Button from "@/components/shared/button/button";
import Alert from "@/components/shared/alertComponent/alert";
import {
  getRefreshToken,
  getAccessToken,
  setAccessToken,
  refreshAccessToken,
  logoutUser,
  clearSession,
} from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [alertOpen, setAlertOpen] = useState(false);

  useEffect(() => {
    const verifySession = async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        router.replace("/login");
        return;
      }
      try {
        const { accessToken } = await refreshAccessToken(refreshToken);
        setAccessToken(accessToken);
        setChecking(false);
      } catch {
        clearSession();
        router.replace("/login");
      }
    };

    verifySession();
  }, [router]);

  const handleLogout = async () => {
    const accessToken = getAccessToken();
    if (accessToken) {
      try {
        await logoutUser(accessToken);
      } catch {
        // proceed with local cleanup even if the API call fails
      }
    }
    clearSession();
    router.replace("/login");
  };

  if (checking) return null;

  return (
    <div className={styles.home}>
      <h1>Component Test Page</h1>

      <h2>Buttons</h2>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <Button variant="default">Default Button</Button>
        <Button variant="primary">Primary Button</Button>
        <Button variant="red">Red Button</Button>
        <Button variant="default" disabled>Disabled</Button>
      </div>

      <h2>Alert</h2>
      <div style={{ display: "flex", gap: "12px" }}>
        <Button variant="primary" onClick={() => setAlertOpen(true)}>
          Open Alert
        </Button>
        <Button variant="red" onClick={handleLogout}>
          Log Out
        </Button>
      </div>

      <Alert isOpen={alertOpen} onClose={() => setAlertOpen(false)}>
        <p style={{ fontWeight: 700, fontSize: "24px", margin: 0 }}>Pending Changes</p>
        <p style={{ color: "var(--color-neutral-500)", textAlign: "center", margin: 0 }}>
          You have unsaved changes to this user&apos;s role. Are you sure you want to discard them?
        </p>
        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
          <Button variant="default" onClick={() => setAlertOpen(false)}>Cancel</Button>
          <Button variant="red" onClick={() => setAlertOpen(false)}>Discard</Button>
        </div>
      </Alert>
    </div>
  );
}
