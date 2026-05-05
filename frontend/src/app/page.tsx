"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Button from "@/components/shared/button/button";
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
  const [loggingOut, setLoggingOut] = useState(false);

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
    setLoggingOut(true);
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
      <h1>
        Home Page
        </h1>
      <Button variant="danger" onClick={handleLogout} isLoading={loggingOut}>
        Log Out
      </Button>
    </div>
  );
}
