"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  HandHeart,
  Award,
  User,
  Star,
  FilePlus,
  Users,
  ClipboardList,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { getUser, type UserRole } from "@/lib/auth";
import styles from "./navbar.module.css";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  student: [
    { label: "Dashboard",     href: "/student/dashboard", icon: LayoutDashboard },
    { label: "Calendar",      href: "/calendar",           icon: Calendar        },
    { label: "Events",        href: "/events",             icon: Ticket          },
    { label: "Volunteering",  href: "/volunteering",       icon: HandHeart       },
    { label: "Certificates",  href: "/certificates",       icon: Award           },
    { label: "Profile",       href: "/student/profile",    icon: User            },
    { label: "Become A Lead", href: "/become-lead",        icon: Star            },
  ],
  member: [
    { label: "Dashboard",     href: "/student/dashboard", icon: LayoutDashboard },
    { label: "Calendar",      href: "/calendar",           icon: Calendar        },
    { label: "Events",        href: "/events",             icon: Ticket          },
    { label: "Volunteering",  href: "/volunteering",       icon: HandHeart       },
    { label: "Certificates",  href: "/certificates",       icon: Award           },
    { label: "Profile",       href: "/student/profile",    icon: User            },
  ],
  lead: [
    { label: "Dashboard",     href: "/lead/dashboard",    icon: LayoutDashboard },
    { label: "Events",        href: "/lead/events",       icon: Ticket          },
    { label: "Propose Event", href: "/lead/events/new",   icon: FilePlus        },
    { label: "My Club",       href: "/my-club",           icon: Users           },
    { label: "Certificates",  href: "/certificates",      icon: Award           },
    { label: "Profile",       href: "/lead/profile",      icon: User            },
  ],
  admin: [
    { label: "Dashboard",    href: "/admin/dashboard",   icon: LayoutDashboard },
    { label: "Requests",     href: "/requests",          icon: ClipboardList   },
    { label: "Manage Roles", href: "/manage-roles",      icon: ShieldCheck     },
    { label: "Profile",      href: "/admin/profile",     icon: User            },
  ],
};

const AUTH_ROUTES = ["/login", "/signup"];
const WINDOW = 3;

// Exact match first; fall back to the longest prefix match so sub-pages
// (e.g. /lead/events/123) still highlight the correct nav item.
function resolveActiveHref(items: NavItem[], pathname: string): string | null {
  const exact = items.find((item) => item.href === pathname);
  if (exact) return exact.href;

  const best = items
    .filter((item) => item.href.length > 1 && pathname.startsWith(item.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return best?.href ?? null;
}

export default function Navbar() {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole | null>(null);
  const [startIndex, setStartIndex] = useState(0);
  const [arrivingHref, setArrivingHref] = useState<string | null>(null);

  useEffect(() => {
    const user = getUser();
    setRole(user?.role ?? null);
  }, []);

  const items = role ? NAV_ITEMS[role] : [];
  const activeHref = resolveActiveHref(items, pathname);

  // Keep the active item inside the visible window on route change
  useEffect(() => {
    const activeIndex = items.findIndex((item) => item.href === activeHref);
    if (activeIndex !== -1) {
      const windowStart = Math.floor(activeIndex / WINDOW) * WINDOW;
      setStartIndex(windowStart);
    }
  }, [activeHref, items]);

  // Trigger arrival animation whenever the active item changes
  useEffect(() => {
    if (!activeHref) return;
    setArrivingHref(activeHref);
    const t = setTimeout(() => setArrivingHref(null), 400);
    return () => clearTimeout(t);
  }, [activeHref]);

  if (AUTH_ROUTES.includes(pathname) || role === null) return null;

  const visibleItems = items.slice(startIndex, startIndex + WINDOW);
  const canGoLeft  = startIndex > 0;
  const canGoRight = startIndex + WINDOW < items.length;

  return (
    <>
      <nav className={styles.wrapper}>
        <div className={styles.pill}>
          <button
            className={`${styles.arrow} ${!canGoLeft ? styles.arrowHidden : ""}`}
            onClick={() => setStartIndex((i) => Math.max(0, i - WINDOW))}
            aria-label="Previous"
            disabled={!canGoLeft}
          >
            <ChevronLeft size={16} />
          </button>

          <div className={styles.scrollArea}>
            {visibleItems.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`${styles.item} ${href === activeHref ? styles.active : ""} ${href === arrivingHref ? styles.arriving : ""}`}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>

          <button
            className={`${styles.arrow} ${!canGoRight ? styles.arrowHidden : ""}`}
            onClick={() => setStartIndex((i) => Math.min(items.length - 1, i + WINDOW))}
            aria-label="Next"
            disabled={!canGoRight}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </nav>

      <div className={styles.spacer} />
    </>
  );
}
