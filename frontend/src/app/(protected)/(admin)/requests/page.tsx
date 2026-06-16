"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./requests.module.css";
import { useProposals } from "./utils/services/proposal.service";

export default function AdminRequestsPage() {
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const router = useRouter();
  const {
    loading,
    errorContext,
    filteredProposals,
    searchQuery,
    activeFilter,
    isDrawerOpen,
    selectedProposal,
    actionLoading,
    setSearchQuery,
    setActiveFilter,
    handleDecisionUpdate,
    openDrawer,
    closeDrawer,
  } = useProposals();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading database records...</p>
      </div>
    );
  }

  if (errorContext && filteredProposals.length === 0) {
    return (
      <div className={`${styles.loadingContainer} ${styles.errorTextContainer}`}>
        <p>System Error Encountered: {errorContext}</p>
      </div>
    );
  }

  return (
    <div className={styles.containerWrapperRelative}>
      <div className={`${styles.mainPageWrapper} ${isDrawerOpen ? styles.faintBackgroundActive : ""}`}>
        <div className={styles.headerArea}>
          <h1 className={styles.text4xl}>Club Requests</h1>
          <p className={styles.textMuted}>Manage and review submitted event proposals.</p>
        </div>

        {errorContext && <p className={styles.apiError}>{errorContext}</p>}

        <div className={styles.controlsRow}>
          <div className={styles.pillsGroup}>
            {["all", "pending", "approved", "rejected", "draft"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`${styles.filterPill} ${activeFilter === filter ? styles.filterPillActive : ""}`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          <div className={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Search by event, sender, or club..."
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
            filteredProposals.map((item) => (
              <div key={item.id} className={styles.proposalCard}>
                <div className={`${styles.categoryBlock} ${item.category === "COMMUNITY" ? styles.bgCommunity : styles.bgClub}`}>
                  <span className={styles.categoryText}>{item.category}</span>
                </div>

                <div className={styles.cardContent}>
                  <div className={styles.bodyTexts}>
                    <h3 className={styles.eventTitle}>{item.eventName}</h3>
                    <p className={styles.descriptionText}>{item.description}</p>

                    <p className={styles.requesterRow}>
                      Sender: <span className={styles.requesterNameHighlight}>{item.requesterName}</span>
                    </p>

                    <p className={styles.requesterRow}>
                      Club: <span className={styles.requesterNameHighlight}>{item.clubName || "Unknown Club"}</span>
                    </p>

                    {item.status === "approved" && (
                      <p className={styles.requesterRow}>
                        ✅ Approved proposal for {item.clubName || "Unknown Club"}
                      </p>
                    )}

                    {item.status === "rejected" && (
                      <p className={styles.requesterRow}>
                        ❌ Rejected proposal for {item.clubName || "Unknown Club"}
                      </p>
                    )}
                  </div>

                  <div className={styles.rightActionsArea}>
                    <span className={`${styles.statusBadge} ${styles[`status_${item.status}`]}`}>
                      {item.status}
                    </span>

                    <button onClick={() => openDrawer(item)} className={styles.reviewButton}>
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isDrawerOpen && <div className={styles.drawerOverlayShield} onClick={closeDrawer} />}

      <div className={`${styles.sidebarDrawerContainer} ${isDrawerOpen ? styles.drawerOpenActive : ""}`}>
        {selectedProposal && (
          <div className={styles.drawerInnerFlexColumn}>
            <div className={styles.drawerHeaderContainer}>
              <div>
                <span className={styles.drawerSubheadingSpan}>
                  {selectedProposal.category} PROPOSAL
                </span>
                <h2 className={styles.drawerMainHeadingTitle}>{selectedProposal.eventName}</h2>
              </div>

              <button onClick={closeDrawer} className={styles.closeDrawerButtonX}>
                ✕
              </button>
            </div>

            <div className={styles.drawerScrollableContentArea}>
              {(selectedProposal.status === "approved" || selectedProposal.status === "rejected") && (
                <div
                  className={
                    selectedProposal.status === "rejected"
                      ? styles.rejectionInfoBlock
                      : styles.detailMetaBlockSection
                  }
                >
                  <h4
                    className={
                      selectedProposal.status === "rejected"
                        ? styles.rejectionInfoTitle
                        : styles.metaLabelHeaderTitle
                    }
                  >
                    {selectedProposal.status === "approved"
                      ? "✅ APPROVED PROPOSAL"
                      : "❌ REJECTED PROPOSAL"}
                  </h4>

                  <p className={styles.metaDescriptionParagraphText}>
                    This proposal was <strong>{selectedProposal.status}</strong>.
                  </p>

                  <p className={styles.metaDescriptionParagraphText}>
                    <strong>Club:</strong> {selectedProposal.clubName || "Unknown Club"}
                  </p>

                  <p className={styles.metaDescriptionParagraphText}>
                    <strong>Sender:</strong> {selectedProposal.requesterName}
                  </p>

                  <p className={styles.metaDescriptionParagraphText}>
                    <strong>Event:</strong> {selectedProposal.eventName}
                  </p>

                  <p className={styles.metaDescriptionParagraphText}>
                    <strong>Status:</strong> {selectedProposal.status}
                  </p>

                  {selectedProposal.adminComment && (
                    <p className={styles.metaDescriptionParagraphText}>
                      <strong>Admin Comment:</strong> {selectedProposal.adminComment}
                    </p>
                  )}
                </div>
              )}

              <div className={styles.detailMetaBlockSection}>
                <h4 className={styles.metaLabelHeaderTitle}>DESCRIPTION</h4>
                <p className={styles.metaDescriptionParagraphText}>
                  {selectedProposal.description}
                </p>
              </div>

              <div className={styles.gridMetaParametersRow}>
                <div>
                  <h4 className={styles.metaLabelHeaderTitle}>SENDER</h4>
                  <p className={styles.metaValueHighlightText}>
                    {selectedProposal.requesterName}
                  </p>
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
                  <h4 className={styles.metaLabelHeaderTitle}>CLUB NAME</h4>
                  <p className={styles.metaValueHighlightText}>
                    {selectedProposal.clubName || "Unknown Club"}
                  </p>
                </div>

                <div>
                  <h4 className={styles.metaLabelHeaderTitle}>CLUB TYPE</h4>
                  <p className={styles.metaValueHighlightText}>
                    {selectedProposal.clubType || selectedProposal.category}
                  </p>
                </div>
              </div>

              <div className={`${styles.gridMetaParametersRow} ${styles.metaRowSpacer}`}>
                <div>
                  <h4 className={styles.metaLabelHeaderTitle}>PROPOSED DATE</h4>
                  <p className={styles.metaValueHighlightText}>
                    {selectedProposal.proposedDate}
                  </p>
                </div>

                <div>
                  <h4 className={styles.metaLabelHeaderTitle}>VENUE</h4>
                  <p className={styles.metaValueHighlightText}>
                    {selectedProposal.venueName || "No venue assigned"}
                  </p>
                </div>
              </div>

              <div className={`${styles.gridMetaParametersRow} ${styles.metaRowSpacer}`}>
                <div>
                  <h4 className={styles.metaLabelHeaderTitle}>BUDGET ESTIMATE</h4>
                  <p className={styles.metaValueHighlightText}>
                    RM {selectedProposal.estimatedBudget}
                  </p>
                </div>

                {selectedProposal.proposalPdfUrl ? (
                  <a
                    href={
                      selectedProposal.proposalPdfUrl.startsWith("http")
                        ? selectedProposal.proposalPdfUrl
                        : `http://localhost:5000${selectedProposal.proposalPdfUrl}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.attachmentLinkText}
                  >
                    Open proposal PDF
                  </a>
                ) : (
                  <p className={styles.metaValueHighlightText}>No document attached</p>
                )}
              </div>

              {selectedProposal.adminComment && (
                <div className={styles.rejectionInfoBlock}>
                  <h4 className={styles.rejectionInfoTitle}>ADMIN MESSAGE</h4>
                  <p className={styles.rejectionInfoText}>
                    {selectedProposal.adminComment}
                  </p>
                </div>
              )}
            </div>

            {selectedProposal.status === "pending" && (
              <div className={styles.drawerStickyActionBarRow}>
                <button
                  disabled={actionLoading}
                  onClick={() =>
                    handleDecisionUpdate(
                      selectedProposal.id,
                      "approved",
                      `Approved: ${selectedProposal.eventName} by ${selectedProposal.requesterName} for ${selectedProposal.clubName || "Unknown Club"}.`
                    )
                  }
                  className={styles.approveActionLargeButton}
                >
                  {actionLoading ? "Processing..." : "✓ Approve"}
                </button>

                <button
                  disabled={actionLoading}
                  onClick={() => setIsRejectionModalOpen(true)}
                  className={styles.rejectActionLargeButton}
                >
                  {actionLoading ? "Processing..." : "✕ Reject"}
                </button>
              </div>
            )}

          </div>
        )}
      </div>

      {isRejectionModalOpen && selectedProposal && (
        <div className={styles.rejectionModalOverlay}>
          <div className={styles.rejectionModalContent}>
            <h3 className={styles.rejectionModalTitle}>Specify Rejection Reason</h3>

            <textarea
              className={styles.rejectionModalTextarea}
              placeholder="Write the reason why this proposal is rejected..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />

            <div className={styles.rejectionModalActions}>
              <button
                className={styles.rejectionModalCancelButton}
                onClick={() => {
                  setIsRejectionModalOpen(false);
                  setRejectionReason("");
                }}
              >
                Cancel
              </button>

              <button
                className={styles.rejectionModalSubmitButton}
                onClick={() => {
                  if (!rejectionReason.trim()) {
                    alert("Please write a rejection reason.");
                    return;
                  }

                  handleDecisionUpdate(
                    selectedProposal.id,
                    "rejected",
                    rejectionReason.trim()
                  );

                  setIsRejectionModalOpen(false);
                  setRejectionReason("");
                }}
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}