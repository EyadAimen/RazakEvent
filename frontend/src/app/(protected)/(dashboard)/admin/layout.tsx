"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "admin") {
      router.replace("/unauthorized");
    } else {
      setAllowed(true);
    }
  }, [router]);

  if (!allowed) return null;

  return <>{children}</>;
}
