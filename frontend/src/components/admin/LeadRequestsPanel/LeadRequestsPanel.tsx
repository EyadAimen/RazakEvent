"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Check, X } from "lucide-react";
import type { LeadRoleRequest } from "@/app/(protected)/(admin)/manage-roles/utils/interfaces/manage-roles.interface";
import { fetchLeadRoleRequests, decideLeadRoleRequest } from "@/app/(protected)/(admin)/manage-roles/utils/services/manage-roles.service.ts";
import Alert from "@/components/shared/alertComponent/alert";
import styles from "./LeadRequestsPanel.module.css";

const STATUS_LABEL: Record<string, string> = {
  pending_lead:  "Awaiting Lead",
  pending_admin: "Pending Review",
  approved:      "Approved",
  rejected:      "Rejected",
};

const STATUS_CLASS: Record<string, string> = {
  pending_lead:  "statusPendingLead",
  pending_admin: "statusPendingAdmin",
  approved:      "statusApproved",
  rejected:      "statusRejected",
};

type Props = {
  onRolesChanged: () => void;
};

export default function LeadRequestsPanel({ onRolesChanged }: Props) {
  const [requests, setRequests] = useState<LeadRoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    fetchLeadRoleRequests()
      .then(setRequests)
      .catch(() => setFetchError("Failed to load lead role requests."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(id: string) {
    setActingId(id);
    setActionError(null);
    try {
      const msg = await decideLeadRoleRequest(id, "approved");
      setActionSuccess(msg);
      onRolesChanged();
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to approve request.");
    } finally {
      setActingId(null);
    }
  }

  async function handleReject(id: string) {
    if (!rejectComment.trim()) {
      setActionError("A comment is required to reject.");
      return;
    }
    setActingId(id);
    setActionError(null);
    try {
      const msg = await decideLeadRoleRequest(id, "rejected", rejectComment.trim());
      setActionSuccess(msg);
      setRejectingId(null);
      setRejectComment("");
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to reject request.");
    } finally {
      setActingId(null);
    }
  }

  const pendingCount = requests.filter((r) => r.status === "pending_admin").length;

  return (
    <aside className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitleRow}>
          <h2 className={styles.panelTitle}>Lead Requests</h2>
          {pendingCount > 0 && (
            <span className={styles.pendingBadge}>{pendingCount}</span>
          )}
        </div>
        <button className={styles.refreshBtn} onClick={load} disabled={loading} aria-label="Refresh">
          <RefreshCw size={14} className={loading ? styles.spinning : ""} />
        </button>
      </div>

      <div className={styles.list}>
        {requests.length === 0 && !loading ? (
          <p className={styles.dimText}>No lead role requests yet.</p>
        ) : (
          requests.map((req) => {
            const isPendingAdmin = req.status === "pending_admin";
            const isRejecting = rejectingId === req.id;
            const isActing = actingId === req.id;

            return (
              <div key={req.id} className={`${styles.card} ${isPendingAdmin ? styles.cardActive : ""}`}>
                <div className={styles.cardTop}>
                  <div className={styles.cardInfo}>
                    <span className={styles.studentName}>{req.student?.fullName ?? "Unknown"}</span>
                    <span className={styles.studentId}>{req.student?.staffOrMatricId}</span>
                    <span className={styles.clubName}>→ {req.club?.name ?? "Unknown Club"}</span>
                  </div>
                  <span className={`${styles.statusBadge} ${styles[STATUS_CLASS[req.status] ?? ""]}`}>
                    {STATUS_LABEL[req.status] ?? req.status}
                  </span>
                </div>

                <p className={styles.submittedAt}>
                  {new Date(req.submittedAt).toLocaleDateString("en-MY", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>

                {isPendingAdmin && !isRejecting && (
                  <div className={styles.actions}>
                    <button
                      className={styles.approveBtn}
                      onClick={() => handleApprove(req.id)}
                      disabled={isActing}
                    >
                      <Check size={13} />
                      {isActing ? "Approving…" : "Approve"}
                    </button>
                    <button
                      className={styles.rejectBtn}
                      onClick={() => { setRejectingId(req.id); setRejectComment(""); }}
                      disabled={isActing}
                    >
                      <X size={13} />
                      Reject
                    </button>
                  </div>
                )}

                {isPendingAdmin && isRejecting && (
                  <div className={styles.rejectForm}>
                    <textarea
                      className={styles.commentInput}
                      placeholder="Reason for rejection…"
                      value={rejectComment}
                      onChange={(e) => setRejectComment(e.target.value)}
                      rows={2}
                      disabled={isActing}
                    />
                    <div className={styles.actions}>
                      <button
                        className={styles.rejectBtn}
                        onClick={() => handleReject(req.id)}
                        disabled={isActing || !rejectComment.trim()}
                      >
                        {isActing ? "Rejecting…" : "Confirm Reject"}
                      </button>
                      <button
                        className={styles.cancelBtn}
                        onClick={() => { setRejectingId(null); setRejectComment(""); }}
                        disabled={isActing}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Alert variant="loading"  isOpen={loading}               onClose={() => {}} />
      <Alert variant="error"    isOpen={fetchError !== null}    message={fetchError ?? ""}   onClose={() => setFetchError(null)} />
      <Alert variant="error"    isOpen={actionError !== null}   message={actionError ?? ""}  onClose={() => setActionError(null)} />
      <Alert variant="success"  isOpen={actionSuccess !== null} message={actionSuccess ?? ""} onClose={() => setActionSuccess(null)} />
    </aside>
  );
}
