"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRefreshToken } from "@/lib/auth";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (getRefreshToken()) {
      router.replace("/dashboard");
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) return null;

  return <>{children}</>;
}
