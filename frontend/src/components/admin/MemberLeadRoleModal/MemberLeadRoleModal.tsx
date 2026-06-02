"use client";

import { useState, useEffect } from "react";
import { X, Users, ShieldCheck } from "lucide-react";
import type { UserRecord, ClubMembership, ClubOption } from "@/app/(protected)/(admin)/manage-roles/utils/interfaces/manage-roles.interface";
import {
  fetchUserMemberships,
  updateUserRole,
  changeClubMemberRole,
  fetchAllClubs,
  addUserToClub,
} from "@/app/(protected)/(admin)/manage-roles/utils/services/manage-roles.service.ts";
import styles from "./MemberLeadRoleModal.module.css";

type OverallRole = "student" | "member" | "lead" | "admin";

export type ModalAlertState = {
  type: "none" | "loading" | "success" | "error";
  message?: string;
};

type Props = {
  user: UserRecord;
  onClose: () => void;
  onChanged: () => void;
  onAlert: (alert: ModalAlertState) => void;
};

export default function MemberLeadRoleModal({ user, onClose, onChanged, onAlert }: Props) {
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const [loadingMemberships, setLoadingMemberships] = useState(true);
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);

  const [overallRole, setOverallRole] = useState<OverallRole>(user.role as OverallRole);
  const [selectedClubId, setSelectedClubId] = useState<number | "">("");
  const [clubRoles, setClubRoles] = useState<Record<number, "lead" | "member">>({});

  const needsClubPicker = overallRole === "member" || overallRole === "lead";

  useEffect(() => {
    Promise.all([fetchUserMemberships(user.id), fetchAllClubs()])
      .then(([membershipData, clubData]) => {
        setMemberships(membershipData);
        const init: Record<number, "lead" | "member"> = {};
        membershipData.forEach((m) => { init[m.clubId] = m.role; });
        setClubRoles(init);
        setClubs(clubData);
      })
      .catch(() => {})
      .finally(() => {
        setLoadingMemberships(false);
        setLoadingClubs(false);
      });
  }, [user.id]);

  async function handleSaveOverallRole() {
    if (needsClubPicker && !selectedClubId) {
      onAlert({ type: "error", message: "Please select a club." });
      return;
    }
    onClose();
    onAlert({ type: "loading" });
    try {
      let msg: string;
      if (overallRole === "member") {
        msg = await addUserToClub(selectedClubId as number, user.id);
      } else if (overallRole === "lead") {
        msg = await changeClubMemberRole(selectedClubId as number, user.id, "lead");
      } else {
        msg = await updateUserRole(user.id, overallRole);
      }
      onChanged();
      onAlert({ type: "success", message: msg });
    } catch (err) {
      onAlert({ type: "error", message: err instanceof Error ? err.message : "Failed to update role." });
    }
  }

  async function handleSaveClubRole(clubId: number) {
    onClose();
    onAlert({ type: "loading" });
    try {
      const msg = await changeClubMemberRole(clubId, user.id, clubRoles[clubId]);
      setMemberships((prev) =>
        prev.map((m) => (m.clubId === clubId ? { ...m, role: clubRoles[clubId] } : m))
      );
      onChanged();
      onAlert({ type: "success", message: msg });
    } catch (err) {
      onAlert({ type: "error", message: err instanceof Error ? err.message : "Failed to update." });
    }
  }

  const overallRoleNote: Record<OverallRole, string> = {
    student: "Removes the user from all clubs and communities.",
    admin:   "Removes the user from all clubs and communities.",
    member:  "Adds the user as a member of the selected club.",
    lead:    "Promotes the user to lead of the selected club. The existing lead (if any) will be demoted to member.",
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h2 className={styles.userName}>{user.fullName}</h2>
            <p className={styles.userMeta}>{user.email} · {user.staffOrMatricId}</p>
            <span className={styles.currentRoleBadge}>{user.role}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <ShieldCheck size={14} />
            Change Role
          </div>
          <p className={styles.sectionNote}>{overallRoleNote[overallRole]}</p>

          <div className={styles.row}>
            <select
              className={styles.select}
              value={overallRole}
              onChange={(e) => {
                setOverallRole(e.target.value as OverallRole);
                setSelectedClubId("");
              }}
            >
              <option value="student">Student</option>
              <option value="member">Member</option>
              <option value="lead">Lead</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {needsClubPicker && (
            <div className={styles.row}>
              <select
                className={styles.select}
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(Number(e.target.value) || "")}
                disabled={loadingClubs}
              >
                <option value="">— Select a club —</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            className={styles.saveBtnFull}
            onClick={handleSaveOverallRole}
            disabled={needsClubPicker && !selectedClubId}
          >
            Save Role
          </button>
        </div>

        {(loadingMemberships || memberships.length > 0) && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <Users size={14} />
              Current Club Memberships
            </div>

            {loadingMemberships ? (
              <p className={styles.dimText}>Loading clubs…</p>
            ) : (
              <div className={styles.clubList}>
                {memberships.map((m) => {
                  const selected = clubRoles[m.clubId] ?? m.role;
                  return (
                    <div key={m.clubId} className={styles.clubRow}>
                      <div className={styles.clubInfo}>
                        <span className={styles.clubName}>{m.clubName}</span>
                        <span className={styles.clubType}>{m.clubType}</span>
                      </div>
                      <div className={styles.clubActions}>
                        <select
                          className={styles.select}
                          value={selected}
                          onChange={(e) =>
                            setClubRoles((prev) => ({
                              ...prev,
                              [m.clubId]: e.target.value as "lead" | "member",
                            }))
                          }
                        >
                          <option value="member">Member</option>
                          <option value="lead">Lead</option>
                        </select>
                        <button
                          className={styles.saveBtn}
                          onClick={() => handleSaveClubRole(m.clubId)}
                          disabled={selected === m.role}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
