"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth";

export default function LeadLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "lead") {
      router.replace("/unauthorized");
    } else {
      setAllowed(true);
    }
  }, [router]);

  if (!allowed) return null;

  return <>{children}</>;
}
