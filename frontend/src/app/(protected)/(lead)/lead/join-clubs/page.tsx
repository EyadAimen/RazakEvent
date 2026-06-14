"use client";

import { useState, useEffect } from "react";
import { Users, Clock, CheckCircle, XCircle, ClipboardList, Star } from "lucide-react";
import Triangle from "@/components/shared/triangle/triangle";
import Alert from "@/components/shared/alertComponent/alert";
import { getUser } from "@/lib/auth";
import {
  fetchAllClubs,
  fetchMyMembershipRequests,
  submitMembershipRequest,
} from "./utils/services/join-clubs.service";
import type { Club, MembershipRequest } from "./utils/interfaces/join-clubs.interface";
import styles from "./page.module.css";

type Tab = "clubs" | "requests";
type AlertState = { type: "none" | "loading" | "success" | "error"; message?: string };

const STATUS_ICON = {
  pending:  <Clock size={13} />,
  approved: <CheckCircle size={13} />,
  rejected: <XCircle size={13} />,
};

const STATUS_LABEL: Record<string, string> = {
  pending:  "Pending",
  approved: "Already a Member",
  rejected: "Rejected",
};

export default function JoinClubsPage() {
  const currentUser = getUser();

  const [tab, setTab] = useState<Tab>("clubs");
  const [clubs, setClubs] = useState<Club[]>([]);
  const [memberRequests, setMemberRequests] = useState<MembershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmClub, setConfirmClub] = useState<Club | null>(null);
  const [alert, setAlert] = useState<AlertState>({ type: "none" });

  type RejectionInfo = { clubName: string; reason: string; date: string };
  const [rejectionModal, setRejectionModal] = useState<RejectionInfo | null>(null);

  useEffect(() => {
    Promise.all([
      fetchAllClubs().then(setClubs).catch(() => {}),
      fetchMyMembershipRequests().then(setMemberRequests).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  function requestStatusForClub(clubId: number): MembershipRequest | null {
    return memberRequests.find((r) => r.clubId === clubId) ?? null;
  }

  async function handleJoinClub(club: Club) {
    setConfirmClub(null);
    setAlert({ type: "loading" });
    try {
      const msg = await submitMembershipRequest(club.id);
      await fetchMyMembershipRequests().then(setMemberRequests).catch(() => {});
      setAlert({ type: "success", message: msg });
    } catch (err) {
      setAlert({ type: "error", message: err instanceof Error ? err.message : "Failed to submit request." });
    }
  }

  const visibleClubs = clubs.filter((c) => c.lead?.id !== currentUser?.id);

  const pendingCount = memberRequests.filter((r) => r.status === "pending").length;

  return (
    <>
      <div className={styles.page}>
        <div className={styles.body}>
          <Triangle style={{ left: "0px",   top: "60px",     transform: "rotate(-20deg)", borderBottomColor: "var(--color-primary-500)"   }} />
          <Triangle style={{ right: "30px", top: "40px",     transform: "rotate(10deg)",  borderBottomColor: "var(--color-secondary-500)" }} />
          <Triangle style={{ left: "20px",  bottom: "120px", transform: "rotate(-10deg)", borderBottomColor: "var(--color-semantic-red)"   }} />
          <Triangle style={{ right: "0px",  bottom: "60px",  transform: "rotate(20deg)",  borderBottomColor: "var(--color-primary-800)"   }} />

          <div className={styles.inner}>
            <div className={styles.heading}>
              <h1 className={styles.title}>Join a Club</h1>
              <p className={styles.subtitle}>Browse clubs and request to join as a member. You will retain your lead role.</p>
            </div>

            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${tab === "clubs" ? styles.tabActive : ""}`}
                onClick={() => setTab("clubs")}
              >
                <Users size={15} />
                Clubs
              </button>
              <button
                className={`${styles.tab} ${tab === "requests" ? styles.tabActive : ""}`}
                onClick={() => setTab("requests")}
              >
                <ClipboardList size={15} />
                My Requests
                {pendingCount > 0 && (
                  <span className={styles.tabBadge}>{pendingCount}</span>
                )}
              </button>
            </div>

            {tab === "requests" && (
              <div className={styles.requestsList}>
                {memberRequests.length === 0 ? (
                  <p className={styles.emptyRequests}>No membership requests yet.</p>
                ) : (
                  memberRequests.map((r) => (
                    <div
                      key={r.id}
                      className={`${styles.requestCard} ${r.status === "rejected" ? styles.requestCardRejected : ""}`}
                      onClick={
                        r.status === "rejected"
                          ? () => setRejectionModal({
                              clubName: r.clubName ?? "Unknown Club",
                              reason: r.leadComment ?? "No reason provided.",
                              date: new Date(r.submittedAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }),
                            })
                          : undefined
                      }
                    >
                      <div className={styles.requestInfo}>
                        <span className={styles.requestClub}>{r.clubName ?? "Unknown Club"}</span>
                        <span className={styles.requestType}>Membership Request</span>
                      </div>
                      <div className={styles.requestRight}>
                        <span className={`${styles.statusBadge} ${styles[`status_${r.status}`]}`}>
                          {STATUS_ICON[r.status]}
                          {STATUS_LABEL[r.status]}
                        </span>
                        <span className={styles.requestDate}>
                          {new Date(r.submittedAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "clubs" && (
              loading ? (
                <div className={styles.loadingGrid}>
                  {[1, 2, 3].map((i) => <div key={i} className={styles.skeletonCard} />)}
                </div>
              ) : (
                <div className={styles.grid}>
                  {visibleClubs.map((club) => {
                    const reqStatus = requestStatusForClub(club.id);
                    return (
                      <div key={club.id} className={styles.card}>
                        <div className={styles.cardTop}>
                          <span className={`${styles.typeBadge} ${club.type === "community" ? styles.typeCommunity : styles.typeClub}`}>
                            {club.type}
                          </span>
                          {reqStatus && (
                            <span className={`${styles.statusBadge} ${styles[`status_${reqStatus.status}`]}`}>
                              {STATUS_ICON[reqStatus.status]}
                              {STATUS_LABEL[reqStatus.status]}
                            </span>
                          )}
                        </div>

                        <h3 className={styles.clubName}>{club.name}</h3>
                        {club.category && <p className={styles.clubCategory}>{club.category}</p>}
                        <p className={styles.clubDesc}>{club.description}</p>

                        <div className={styles.cardMeta}>
                          <span className={styles.metaItem}>
                            <Users size={12} />
                            {club.memberCount} member{club.memberCount !== 1 ? "s" : ""}
                          </span>
                          {club.lead && (
                            <span className={styles.metaItem}>
                              <Star size={12} />
                              {club.lead.fullName}
                            </span>
                          )}
                        </div>

                        <button
                          className={styles.cardBtn}
                          onClick={() => setConfirmClub(club)}
                          disabled={!!reqStatus}
                        >
                          {reqStatus ? STATUS_LABEL[reqStatus.status] : "Request to Join"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {confirmClub && (
        <div className={styles.confirmOverlay} onClick={() => setConfirmClub(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>Join {confirmClub.name}?</h3>
            <p className={styles.confirmDesc}>
              Your request will be reviewed by the club lead. You will join as a member and keep your lead role for your own club.
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={() => setConfirmClub(null)}>Cancel</button>
              <button className={styles.confirmSubmit} onClick={() => handleJoinClub(confirmClub)}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectionModal && (
        <div className={styles.confirmOverlay} onClick={() => setRejectionModal(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>Request Rejected</h3>
            <p className={styles.rejectionClub}>{rejectionModal.clubName} · Membership Request</p>
            <p className={styles.rejectionDate}>{rejectionModal.date}</p>
            <div className={styles.rejectionReason}>
              <p className={styles.rejectionReasonLabel}>Reason</p>
              <p className={styles.rejectionReasonText}>{rejectionModal.reason}</p>
            </div>
            <div className={styles.confirmActions}>
              <button className={styles.confirmSubmit} onClick={() => setRejectionModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <Alert variant="loading" isOpen={alert.type === "loading"} onClose={() => {}} />
      <Alert variant="error"   isOpen={alert.type === "error"}   message={alert.message ?? ""} onClose={() => setAlert({ type: "none" })} />
      <Alert variant="success" isOpen={alert.type === "success"} message={alert.message ?? ""} onClose={() => setAlert({ type: "none" })} />
    </>
  );
}
