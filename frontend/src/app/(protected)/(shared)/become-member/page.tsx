"use client";

import { useState, useEffect } from "react";
import { Plus, Users, Star, Clock, CheckCircle, XCircle, ClipboardList } from "lucide-react";
import Triangle from "@/components/shared/triangle/triangle";
import Alert from "@/components/shared/alertComponent/alert";
import CreateClubModal from "@/components/student/CreateClubModal/CreateClubModal";
import { apiFetchAuth } from "@/lib/api";
import { getUser } from "@/lib/auth";
import {
  fetchMyMembershipRequests,
  fetchMyLeadRequest,
  submitMembershipRequest,
  submitLeadRoleRequest,
  createClubRequest,
} from "./utils/services/become-member.service";
import type { Club, MembershipRequest, LeadRoleRequest } from "./utils/interfaces/become-member.interface";
import styles from "./page.module.css";

type Tab = "join" | "lead" | "requests";
type AlertState = { type: "none" | "loading" | "success" | "error"; message?: string };

const STATUS_ICON = {
  pending:       <Clock size={13} />,
  approved:      <CheckCircle size={13} />,
  rejected:      <XCircle size={13} />,
  pending_lead:  <Clock size={13} />,
  pending_admin: <Clock size={13} />,
};

const STATUS_LABEL: Record<string, string> = {
  pending:       "Pending",
  approved:      "Approved",
  rejected:      "Rejected",
  pending_lead:  "Awaiting Lead",
  pending_admin: "Awaiting Admin",
};

export default function BecomeMemberPage() {
  const user = getUser();
  const isLead = user?.role === "lead";
  const isMember = user?.role === "member" || user?.role === "lead";

  const [tab, setTab] = useState<Tab>("join");
  const [clubs, setClubs] = useState<Club[]>([]);
  const [memberRequests, setMemberRequests] = useState<MembershipRequest[]>([]);
  const [leadRequest, setLeadRequest] = useState<LeadRoleRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const [confirmClub, setConfirmClub] = useState<Club | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<AlertState>({ type: "none" });

  type RejectionInfo = { clubName: string; type: string; reason: string; date: string };
  const [rejectionModal, setRejectionModal] = useState<RejectionInfo | null>(null);

  useEffect(() => {
    const tasks: Promise<void>[] = [
      apiFetchAuth<{ clubs: Club[] }>("/clubs").then((res) => setClubs(res.clubs ?? [])).catch(() => {}),
      fetchMyMembershipRequests().then(setMemberRequests).catch(() => {}),
    ];
    if (isMember && !isLead) tasks.push(fetchMyLeadRequest().then(setLeadRequest).catch(() => {}));
    Promise.all(tasks).finally(() => setLoading(false));
  }, [isMember]);

  function membershipStatusForClub(clubId: string) {
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

  async function handleLeadRequest(club: Club) {
    setConfirmClub(null);
    setAlert({ type: "loading" });
    try {
      const msg = await submitLeadRoleRequest(club.id);
      if (isMember && !isLead) await fetchMyLeadRequest().then(setLeadRequest).catch(() => {});
      setAlert({ type: "success", message: msg });
    } catch (err) {
      setAlert({ type: "error", message: err instanceof Error ? err.message : "Failed to submit request." });
    }
  }

  async function handleCreateClub(data: Parameters<typeof createClubRequest>[0]) {
    setSubmitting(true);
    setShowCreateModal(false);
    setAlert({ type: "loading" });
    try {
      const msg = await createClubRequest(data);
      setAlert({ type: "success", message: msg });
    } catch (err) {
      setAlert({ type: "error", message: err instanceof Error ? err.message : "Failed to submit club request." });
    } finally {
      setSubmitting(false);
    }
  }

  const isJoinTab = tab === "join";
  const isRequestsTab = tab === "requests";

  const pendingMemberRequests = memberRequests.filter(r => r.status === "pending");
  const rejectedMemberRequests = memberRequests.filter(r => r.status === "rejected");
  const pendingLeadRequest = leadRequest && ["pending_lead", "pending_admin"].includes(leadRequest.status) ? leadRequest : null;
  const rejectedLeadRequest = leadRequest?.status === "rejected" ? leadRequest : null;
  const hasAnyRequest = pendingMemberRequests.length > 0 || rejectedMemberRequests.length > 0 || !!pendingLeadRequest || !!rejectedLeadRequest;

  const approvedMemberClubIds = new Set(memberRequests.filter(r => r.status === "approved").map(r => r.clubId));
  const leadTabClubs = clubs.filter(c => approvedMemberClubIds.has(c.id));

  return (
    <>
      <div className={styles.page}>
        <div className={styles.body}>
          <Triangle style={{ left: "0px",   top: "60px",     transform: "rotate(-20deg)", borderBottomColor: "var(--color-primary-500)"   }} />
          <Triangle style={{ right: "30px", top: "40px",     transform: "rotate(10deg)",  borderBottomColor: "var(--color-secondary-500)" }} />
          <Triangle style={{ left: "20px",  bottom: "120px", transform: "rotate(-10deg)", borderBottomColor: "var(--color-semantic-red)"  }} />
          <Triangle style={{ right: "0px",  bottom: "60px",  transform: "rotate(20deg)",  borderBottomColor: "var(--color-primary-800)"   }} />

          <div className={styles.inner}>
            <div className={styles.heading}>
              <h1 className={styles.title}>Become a Member</h1>
              <p className={styles.subtitle}>Join a club or community, or apply to lead one.</p>
            </div>

            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${isJoinTab ? styles.tabActive : ""}`}
                onClick={() => setTab("join")}
              >
                <Users size={15} />
                Join a Club
              </button>
              {!isLead && (
                <button
                  className={`${styles.tab} ${tab === "lead" ? styles.tabActive : ""}`}
                  onClick={() => setTab("lead")}
                >
                  <Star size={15} />
                  Become a Lead
                </button>
              )}
              <button
                className={`${styles.tab} ${tab === "requests" ? styles.tabActive : ""}`}
                onClick={() => setTab("requests")}
              >
                <ClipboardList size={15} />
                My Requests
                {(memberRequests.filter(r => r.status === "pending").length + (leadRequest && ["pending_lead","pending_admin"].includes(leadRequest.status) ? 1 : 0)) > 0 && (
                  <span className={styles.tabBadge}>
                    {memberRequests.filter(r => r.status === "pending").length + (leadRequest && ["pending_lead","pending_admin"].includes(leadRequest.status) ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>

            {isRequestsTab && (
              <div className={styles.requestsList}>
                {!hasAnyRequest ? (
                  <p className={styles.emptyRequests}>No requests found.</p>
                ) : (
                  <>
                    {pendingMemberRequests.map((r) => (
                      <div key={r.id} className={styles.requestCard}>
                        <div className={styles.requestInfo}>
                          <span className={styles.requestClub}>{r.clubName ?? "Unknown Club"}</span>
                          <span className={styles.requestType}>Membership Request</span>
                        </div>
                        <div className={styles.requestRight}>
                          <span className={`${styles.statusBadge} ${styles.status_pending}`}>
                            {STATUS_ICON.pending} {STATUS_LABEL.pending}
                          </span>
                          <span className={styles.requestDate}>
                            {new Date(r.submittedAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    ))}

                    {rejectedMemberRequests.map((r) => (
                      <div
                        key={r.id}
                        className={`${styles.requestCard} ${styles.requestCardRejected}`}
                        onClick={() => setRejectionModal({
                          clubName: r.clubName ?? "Unknown Club",
                          type: "Membership Request",
                          reason: r.leadComment ?? "No reason provided.",
                          date: new Date(r.submittedAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }),
                        })}
                      >
                        <div className={styles.requestInfo}>
                          <span className={styles.requestClub}>{r.clubName ?? "Unknown Club"}</span>
                          <span className={styles.requestType}>Membership Request</span>
                        </div>
                        <div className={styles.requestRight}>
                          <span className={`${styles.statusBadge} ${styles.status_rejected}`}>
                            {STATUS_ICON.rejected} {STATUS_LABEL.rejected}
                          </span>
                          <span className={styles.requestDate}>
                            {new Date(r.submittedAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    ))}

                    {pendingLeadRequest && (
                      <div className={styles.requestCard}>
                        <div className={styles.requestInfo}>
                          <span className={styles.requestClub}>{clubs.find(c => c.id === pendingLeadRequest.clubId)?.name ?? `Club #${pendingLeadRequest.clubId}`}</span>
                          <span className={styles.requestType}>Lead Role Request</span>
                        </div>
                        <div className={styles.requestRight}>
                          <span className={`${styles.statusBadge} ${styles[`status_${pendingLeadRequest.status}`]}`}>
                            {STATUS_ICON[pendingLeadRequest.status as keyof typeof STATUS_ICON]}
                            {STATUS_LABEL[pendingLeadRequest.status]}
                          </span>
                          <span className={styles.requestDate}>
                            {new Date(pendingLeadRequest.submittedAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    )}

                    {rejectedLeadRequest && (
                      <div
                        className={`${styles.requestCard} ${styles.requestCardRejected}`}
                        onClick={() => setRejectionModal({
                          clubName: clubs.find(c => c.id === rejectedLeadRequest.clubId)?.name ?? `Club #${rejectedLeadRequest.clubId}`,
                          type: "Lead Role Request",
                          reason: rejectedLeadRequest.adminComment ?? "No reason provided.",
                          date: new Date(rejectedLeadRequest.submittedAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }),
                        })}
                      >
                        <div className={styles.requestInfo}>
                          <span className={styles.requestClub}>{clubs.find(c => c.id === rejectedLeadRequest.clubId)?.name ?? `Club #${rejectedLeadRequest.clubId}`}</span>
                          <span className={styles.requestType}>Lead Role Request</span>
                        </div>
                        <div className={styles.requestRight}>
                          <span className={`${styles.statusBadge} ${styles.status_rejected}`}>
                            {STATUS_ICON.rejected} {STATUS_LABEL.rejected}
                          </span>
                          <span className={styles.requestDate}>
                            {new Date(rejectedLeadRequest.submittedAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {!isRequestsTab && !isMember && !isJoinTab && (
              <div className={styles.infoBanner}>
                You need to join a club first before applying to become a lead.
              </div>
            )}

            {!isRequestsTab && leadRequest && !isJoinTab && isMember && (
              <div className={`${styles.requestBanner} ${styles[`banner_${leadRequest.status}`] ?? styles.banner_pending_lead}`}>
                {STATUS_ICON[leadRequest.status as keyof typeof STATUS_ICON]}
                Lead request — {STATUS_LABEL[leadRequest.status] ?? leadRequest.status}
              </div>
            )}

            {!isRequestsTab && loading ? (
              <div className={styles.loadingGrid}>
                {[1, 2, 3].map((i) => <div key={i} className={styles.skeletonCard} />)}
              </div>
            ) : !isRequestsTab ? (
              <div className={styles.grid}>
                {(isJoinTab ? clubs.filter(c => !approvedMemberClubIds.has(c.id)) : leadTabClubs).map((club) => {
                  const reqStatus = isJoinTab ? membershipStatusForClub(club.id) : null;
                  const hasActiveLeadReq = !isJoinTab && leadRequest && leadRequest.clubId === club.id;

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
                        {hasActiveLeadReq && (
                          <span className={`${styles.statusBadge} ${styles[`status_${leadRequest!.status}`]}`}>
                            {STATUS_ICON[leadRequest!.status as keyof typeof STATUS_ICON]}
                            {STATUS_LABEL[leadRequest!.status]}
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
                        disabled={
                          (isJoinTab && !!reqStatus) ||
                          (!isJoinTab && !!hasActiveLeadReq)
                        }
                      >
                        {isJoinTab
                          ? reqStatus ? STATUS_LABEL[reqStatus.status] : "Request to Join"
                          : hasActiveLeadReq ? STATUS_LABEL[leadRequest!.status] : "Apply to Lead"
                        }
                      </button>
                    </div>
                  );
                })}

                {!isJoinTab && isMember && leadTabClubs.length === 0 && (
                  <p className={styles.infoBanner} style={{ gridColumn: "1 / -1" }}>
                    You are not an approved member of any club yet. Join a club first, then apply to become its lead.
                  </p>
                )}

                {!isJoinTab && (
                  <div className={styles.createCard} onClick={() => setShowCreateModal(true)}>
                    <Plus size={28} className={styles.createIcon} />
                    <p className={styles.createTitle}>Create New Club</p>
                    <p className={styles.createDesc}>Can&apos;t find yours? Submit a request to start a new one.</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {confirmClub && (
        <div className={styles.confirmOverlay} onClick={() => setConfirmClub(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>
              {isJoinTab ? `Join ${confirmClub.name}?` : `Apply to Lead ${confirmClub.name}?`}
            </h3>
            <p className={styles.confirmDesc}>
              {isJoinTab
                ? "Your request will be reviewed by the club lead."
                : "Your request will go through lead and admin review before approval."}
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={() => setConfirmClub(null)}>Cancel</button>
              <button
                className={styles.confirmSubmit}
                onClick={() => isJoinTab ? handleJoinClub(confirmClub) : handleLeadRequest(confirmClub)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateClubModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateClub}
          submitting={submitting}
        />
      )}

      {rejectionModal && (
        <div className={styles.confirmOverlay} onClick={() => setRejectionModal(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>Request Rejected</h3>
            <p className={styles.rejectionClub}>{rejectionModal.clubName} · {rejectionModal.type}</p>
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
