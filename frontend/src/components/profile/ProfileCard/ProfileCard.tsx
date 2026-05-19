"use client";

import { Hash, Mail, Pencil } from "lucide-react";
import Button from "@/components/shared/button/button";
import type { AuthUser } from "@/lib/auth";
import styles from "./ProfileCard.module.css";

type Props = {
  user: AuthUser;
  onEditClick: () => void;
};

type ColorPair = { bg: string; text: string };

// A–E  →  dark blue
// F–J  →  green
// K–O  →  crimson
// P–T  →  blue
// U–Z  →  yellow (dark text for contrast)
// else →  neutral
function getAvatarStyle(name: string | undefined): ColorPair {
  if (!name?.trim()) {
    return { bg: "var(--color-neutral-300)", text: "var(--color-neutral-600)" };
  }
  const code = name.trim()[0].toUpperCase().charCodeAt(0) - 65;
  if (code < 0 || code > 25) {
    return { bg: "var(--color-neutral-300)", text: "var(--color-neutral-600)" };
  }
  if (code <= 4)  return { bg: "var(--color-primary-800)",  text: "var(--color-neutral-50)"  };
  if (code <= 9)  return { bg: "var(--color-status-green)", text: "var(--color-neutral-50)"  };
  if (code <= 14) return { bg: "var(--color-ktr-crimson)",  text: "var(--color-neutral-50)"  };
  if (code <= 19) return { bg: "var(--color-primary-500)",  text: "var(--color-neutral-50)"  };
  return          { bg: "var(--color-secondary-500)",       text: "var(--color-primary-800)" };
}

export default function ProfileCard({ user, onEditClick }: Props) {
  const initial = user.fullName?.trim()[0]?.toUpperCase() ?? "?";
  const avatarStyle = getAvatarStyle(user.fullName);

  return (
    <div className={styles.card}>
      <div className={styles.header} />
      <div className={styles.avatarWrapper}>
        <div
          className={styles.avatar}
          style={{ background: avatarStyle.bg, color: avatarStyle.text }}
        >
          {initial}
        </div>
      </div>
      <div className={styles.info}>
        <h2 className={styles.name}>{user.fullName}</h2>
        <span className={styles.roleBadge}>{user.role}</span>
        <div className={styles.details}>
          <div className={styles.detailRow}>
            <Hash size={14} className={styles.detailIcon} />
            <div>
              <p className={styles.detailLabel}>Matric Number</p>
              <p className={styles.detailValue}>{user.staffOrMatricId}</p>
            </div>
          </div>
          <div className={styles.detailRow}>
            <Mail size={14} className={styles.detailIcon} />
            <div>
              <p className={styles.detailLabel}>Email Address</p>
              <p className={styles.detailValue}>{user.email}</p>
            </div>
          </div>
        </div>
        <Button onClick={onEditClick} className={styles.editBtn}>
          <Pencil size={14} />
          Edit Profile
        </Button>
      </div>
    </div>
  );
}
