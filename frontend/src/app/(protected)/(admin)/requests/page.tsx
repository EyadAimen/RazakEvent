"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./requests.module.css";
import { Proposal } from "./utils/interfaces/proposal.interface";
import { fetchDatabaseProposals, patchProposalDecision } from "./utils/services/proposal.service";
import Alert from "@/components/shared/alertComponent/alert";

export default function AdminRequestsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorContext, setErrorContext] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setErrorContext(null);
        const data = await fetchDatabaseProposals();
        setProposals(data);
      } catch (err: any) {
        console.error("Component catch layer caught initial initialization failures:", err);
        setErrorContext(err.message || "Could not synchronize database connection data stacks.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDecisionUpdate = async (id: number, decisionStatus: "approved" | "rejected", commentString?: string) => {
    const finalComment = commentString || `Proposal evaluation completed: ${decisionStatus}`;
    
    setActionLoading(true);
    try {
      await patchProposalDecision(id, decisionStatus, finalComment);
      
      setProposals((prev) =>
        prev.map((prop) => (prop.id === id ? { ...prop, status: decisionStatus, adminComment: finalComment } : prop))
      );
      setIsDrawerOpen(false);
      setIsRejectionModalOpen(false);
      setRejectionReason("");
      setSelectedProposal(null);
    } catch (err: any) {
      setActionError(err.message || "Failed to update proposal status.");
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectionFlow = () => {
    setIsRejectionModalOpen(true);
  };

  const submitRejectionFlow = () => {
    if (!rejectionReason.trim()) {
      alert("Please specify an evaluation reason detailing why this application is rejected.");
      return;
    }
    if (selectedProposal) {
      handleDecisionUpdate(selectedProposal.id, "rejected", rejectionReason);
    }
  };

  const filteredProposals = proposals.filter((p: Proposal) => {
    const matchesFilter = activeFilter === "all" || p.status === activeFilter;
    const matchesSearch =
      p.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.requesterName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading database records...</p>
      </div>
    );
  }

  if (errorContext && proposals.length === 0) {
    return (
      <div className={`${styles.loadingContainer} ${styles.errorTextContainer}`}>
        <p>System Error Encountered: {errorContext}</p>
      </div>
    );
  }

  return (
    <>
    <div className={styles.containerWrapperRelative}>
      <div className={`${styles.mainPageWrapper} ${isDrawerOpen ? styles.faintBackgroundActive : ""}`}>

        <div className={styles.headerArea}>
          <h1 className={styles.text4xl}>Club Requests</h1>
          <p className={styles.textMuted}>Manage and review new club and community proposals.</p>
        </div>

        <div className={styles.controlsRow}>
          <div className={styles.pillsGroup}>
            {["all", "pending", "approved", "rejected", "draft"].map((filter) => (
              <button
                key={filter}
                onClick={() => { setActiveFilter(filter); setErrorContext(null); }}
                className={`${styles.filterPill} ${activeFilter === filter ? styles.filterPillActive : ""}`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          <div className={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Search requests by name or event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>
        </div>

        <div className={styles.cardsList}>
          {filteredProposals.length === 0 ? (
            <div className={styles.emptyState}>No requests match selection filters.</div>
          ) : (
            filteredProposals.map((item: Proposal) => (
              <div key={item.id} className={styles.proposalCard}>
                <div className={`${styles.categoryBlock} ${item.category === "COMMUNITY" ? styles.bgCommunity : styles.bgClub}`}>
                  <span className={styles.categoryText}>{item.category}</span>
                </div>

                <div className={styles.cardContent}>
                  <div className={styles.bodyTexts}>
                    <h3 className={styles.eventTitle}>{item.eventName}</h3>
                    <p className={styles.descriptionText}>{item.description}</p>
                    <p className={styles.requesterRow}>
                      Requester: <span className={styles.requesterNameHighlight}>{item.requesterName}</span>
                    </p>
                  </div>

                  <div className={styles.rightActionsArea}>
                    <span className={`${styles.statusBadge} ${styles[`status_${item.status}`]}`}>
                      {item.status}
                    </span>
                    <button onClick={() => { setSelectedProposal(item); setIsDrawerOpen(true); setErrorContext(null); }} className={styles.reviewButton}>
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isDrawerOpen && <div className={styles.drawerOverlayShield} onClick={() => { if(!isRejectionModalOpen) { setIsDrawerOpen(false); setSelectedProposal(null); setErrorContext(null); } }} />}

      <div className={`${styles.sidebarDrawerContainer} ${isDrawerOpen ? styles.drawerOpenActive : ""}`}>
        {selectedProposal && (
          <div className={styles.drawerInnerFlexColumn}>
            <div className={styles.drawerHeaderContainer}>
              <div>
                <span className={styles.drawerSubheadingSpan}>{selectedProposal.category} PROPOSAL</span>
                <h2 className={styles.drawerMainHeadingTitle}>{selectedProposal.eventName}</h2>
              </div>
              <button onClick={() => { setIsDrawerOpen(false); setSelectedProposal(null); setErrorContext(null); }} className={styles.closeDrawerButtonX}>✕</button>
            </div>

            <div className={styles.drawerScrollableContentArea}>
              <div className={styles.detailMetaBlockSection}>
                <h4 className={styles.metaLabelHeaderTitle}>DESCRIPTION</h4>
                <p className={styles.metaDescriptionParagraphText}>{selectedProposal.description}</p>
              </div>

              <div className={styles.gridMetaParametersRow}>
                <div>
                  <h4 className={styles.metaLabelHeaderTitle}>REQUESTER</h4>
                  <p className={styles.metaValueHighlightText}>{selectedProposal.requesterName}</p>
                </div>
                <div>
                  <h4 className={styles.metaLabelHeaderTitle}>STATUS</h4>
                  <span className={`${styles.statusBadge} ${styles[`status_${selectedProposal.status}`]}`}>
                    {selectedProposal.status}
                  </span>
                </div>
              </div>

              <div className={`${styles.gridMetaParametersRow} ${styles.metaRowSpacer}`}>
                <div>
                  <h4 className={styles.metaLabelHeaderTitle}>BUDGET ESTIMATE</h4>
                  <p className={styles.metaValueHighlightText}>${selectedProposal.estimatedBudget}</p>
                </div>
                <div>
                  <h4 className={styles.metaLabelHeaderTitle}>DOC ATTACHED</h4>
                  <a href="#" className={styles.attachmentLinkText} onClick={(e) => e.preventDefault()}>
                    {selectedProposal.docAttached}
                  </a>
                </div>
              </div>

              {selectedProposal.status === "rejected" && selectedProposal.adminComment && (
                <div className={styles.rejectionInfoBlock}>
                  <h4 className={styles.rejectionInfoTitle}>❌ REJECTION REASON</h4>
                  <p className={styles.rejectionInfoText}>{selectedProposal.adminComment}</p>
                </div>
              )}
              <div className={styles.fullDetailsButtonContainer}>
                <button 
                  onClick={() => router.push(`admin/events/${selectedProposal.id}`)} 
                  className={styles.fullDetailsButton}
                >
                  🖼️ View Full Details & Poster Page
                </button>
              </div>
            </div>

            {selectedProposal.status === "pending" && (
              <div className={styles.drawerStickyActionBarRow}>
                <button disabled={actionLoading} onClick={() => handleDecisionUpdate(selectedProposal.id, "approved")} className={styles.approveActionLargeButton}>
                  {actionLoading ? "Processing..." : "✓ Approve"}
                </button>
                <button disabled={actionLoading} onClick={openRejectionFlow} className={styles.rejectActionLargeButton}>
                  ✕ Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isRejectionModalOpen && (
        <div className={styles.rejectionModalOverlay}>
          <div className={styles.rejectionModalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.rejectionModalTitle}>Specify Rejection Reason</h3>
            <textarea
              className={styles.rejectionModalTextarea}
              placeholder="Provide clean and detailed reasons explaining why this proposal request is rejected..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className={styles.rejectionModalActions}>
              <button 
                className={styles.rejectionModalCancelButton}
                onClick={() => { setIsRejectionModalOpen(false); setRejectionReason(""); }}
              >
                Cancel
              </button>
              <button 
                className={styles.rejectionModalSubmitButton}
                onClick={submitRejectionFlow}
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

      <Alert variant="loading" isOpen={actionLoading} onClose={() => {}} message="Processing decision…" />
      <Alert variant="error" isOpen={actionError !== null} message={actionError ?? ""} onClose={() => setActionError(null)} />
    </>
  );
}