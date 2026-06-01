"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getRefreshToken, getUser } from "@/lib/auth";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // /reset-password must stay accessible while authenticated — the token
    // in the URL is the auth mechanism, and the user may still be logged in
    // when they click the link from their profile's danger zone.
    if (getRefreshToken() && pathname !== "/reset-password") {
      const role = getUser()?.role;
      if (role === "admin") router.replace("/admin/dashboard");
      else if (role === "lead") router.replace("/lead/dashboard");
      else router.replace("/student/dashboard");
    } else {
      setChecked(true);
    }
  }, [router, pathname]);

  if (!checked) return null;

  return <>{children}</>;
}
