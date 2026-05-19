"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Button from "@/components/shared/button/button";
import Alert from "@/components/shared/alertComponent/alert";
import {
  getRefreshToken,
  setAccessToken,
  refreshAccessToken,
  logoutUser,
  clearSession,
  getUser,
} from "@/lib/auth";

const ROLE_REDIRECTS: Record<string, string> = {
  lead:    "/lead/dashboard",
  admin:   "/admin/dashboard",
  student: "/student/dashboard",
  member:  "/student/dashboard",
};

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

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

        // Redirect to the role-specific dashboard
        const user = getUser();
        const destination = user ? (ROLE_REDIRECTS[user.role] ?? "/dashboard") : "/dashboard";
        router.replace(destination);
      } catch {
        clearSession();
        router.replace("/login");
      }
    };

    verifySession();
  }, [router]);

  if (checking) return null;

  return (
    <div className={styles.home}>
    </div>
  );
}
