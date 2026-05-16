"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getRefreshToken,
  refreshAccessToken,
  setAccessToken,
  clearSession,
} from "@/lib/auth";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const validateSession = async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        router.replace("/login");
        return;
      }
      try {
        const { accessToken } = await refreshAccessToken(refreshToken);
        setAccessToken(accessToken);
        setReady(true);
      } catch {
        clearSession();
        router.replace("/login");
      }
    };

    validateSession();
  }, [router]);

  if (!ready) return null;

  return <>{children}</>;
}
