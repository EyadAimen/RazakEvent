"use client";

import styles from "./post-event.module.css";
import { usePostEvents } from "./utils/services/post-event.services";

export default function AdminPostEventsPage() {
  const {
    loading,
    errorContext,
    filteredPostEvents,
    searchQuery,
    activeFilter,
    selectedEvent,
    isDrawerOpen,
    isRejectionModalOpen,
    rejectionReason,
    actionLoading,
    filters,
    setSearchQuery,
    setActiveFilter,
    setRejectionReason,
    openDrawer,
    closeDrawer,
    openRejectionModal,
    closeRejectionModal,
    submitSelectedRejection,
    acceptSelectedReport,
    getReadableReportStatus,
    getPdfUrl,
  } = usePostEvents();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading completed event reports...</p>
      </div>
    );
  }

  if (errorContext && filteredPostEvents.length === 0) {
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
          <h1 className={styles.text4xl}>Post Events</h1>
          <p className={styles.textMuted}>Review completion reports submitted after events are marked complete.</p>
        </div>

        {errorContext && <p className={styles.apiError}>{errorContext}</p>}

        <div className={styles.controlsRow}>
          <div className={styles.pillsGroup}>
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`${styles.filterPill} ${activeFilter === filter.key ? styles.filterPillActive : ""}`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Search by event, lead, or club..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={styles.searchInput}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>
        </div>

        <div className={styles.cardsList}>
          {filteredPostEvents.length === 0 ? (
            <div className={styles.emptyState}>No post events match selection filters.</div>
          ) : (
            filteredPostEvents.map((item) => (
              <div key={item.id} className={styles.postEventCard}>
                <div className={`${styles.categoryBlock} ${item.clubType === "community" ? styles.bgCommunity : styles.bgClub}`}>
                  <span className={styles.categoryText}>{item.clubType === "community" ? "COMMUNITY" : "CLUB"}</span>
                </div>

                <div className={styles.cardContent}>
                  <div className={styles.bodyTexts}>
                    <h3 className={styles.eventTitle}>{item.name}</h3>
                    <p className={styles.descriptionText}>{item.description}</p>

                    <p className={styles.requesterRow}>
                      Lead: <span className={styles.requesterNameHighlight}>{item.leadName}</span>
                    </p>

                    <p className={styles.requesterRow}>
                      Club: <span className={styles.requesterNameHighlight}>{item.clubName}</span>
                    </p>

                    {item.reportStatus === "not_submitted" && (
                      <p className={item.isOverdue ? styles.rejectedLine : styles.warningLine}>
                        Report due: {item.reportDueAt} {typeof item.daysLeft === "number" ? `(${item.daysLeft} day(s) left)` : ""}
                      </p>
                    )}

                    {item.reportStatus === "rejected" && item.reportAdminComment && (
                      <p className={styles.rejectedLine}>❌ {item.reportAdminComment}</p>
                    )}
                  </div>

                  <div className={styles.rightActionsArea}>
                    <span className={`${styles.statusBadge} ${styles[`status_${item.reportStatus}`] || styles.status_not_submitted}`}>
                      {getReadableReportStatus(item.reportStatus)}
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
        {selectedEvent && (
          <div className={styles.drawerInnerFlexColumn}>
            <div className={styles.drawerHeaderContainer}>
              <div>
                <span className={styles.drawerSubheadingSpan}>POST EVENT REPORT</span>
                <h2 className={styles.drawerMainHeadingTitle}>{selectedEvent.name}</h2>
              </div>

              <button onClick={closeDrawer} className={styles.closeDrawerButtonX}>✕</button>
            </div>

            <div className={styles.drawerScrollableContentArea}>
              <div className={styles.detailMetaBlockSection}>
                <h4 className={styles.metaLabelHeaderTitle}>DESCRIPTION</h4>
                <p className={styles.metaDescriptionParagraphText}>{selectedEvent.description}</p>
              </div>

              <div className={styles.gridMetaParametersRow}>
                <div>
                  <h4 className={styles.metaLabelHeaderTitle}>LEAD</h4>
                  <p className={styles.metaValueHighlightText}>{selectedEvent.leadName}</p>
                </div>

                <div>
                  <h4 className={styles.metaLabelHeaderTitle}>REPORT STATUS</h4>
                  <span className={`${styles.statusBadge} ${styles[`status_${selectedEvent.reportStatus}`] || styles.status_not_submitted}`}>
                    {getReadableReportStatus(selectedEvent.reportStatus)}
                  </span>
                </div>
              </div>

              <div className={`${styles.gridMetaParametersRow} ${styles.metaRowSpacer}`}>
                <div>
                  <h4 className={styles.metaLabelHeaderTitle}>CLUB NAME</h4>
                  <p className={styles.metaValueHighlightText}>{selectedEvent.clubName}</p>
                </div>

                <div>
                  <h4 className={styles.metaLabelHeaderTitle}>CLUB TYPE</h4>
                  <p className={styles.metaValueHighlightText}>{selectedEvent.clubType}</p>
                </div>
              </div>

              <div className={`${styles.gridMetaParametersRow} ${styles.metaRowSpacer}`}>
                <div>
                  <h4 className={styles.metaLabelHeaderTitle}>EVENT DATE</h4>
                  <p className={styles.metaValueHighlightText}>{selectedEvent.eventDate}</p>
                </div>

                <div>
                  <h4 className={styles.metaLabelHeaderTitle}>VENUE</h4>
                  <p className={styles.metaValueHighlightText}>{selectedEvent.venueName}</p>
                </div>
              </div>

              <div className={`${styles.gridMetaParametersRow} ${styles.metaRowSpacer}`}>
                <div>
                  <h4 className={styles.metaLabelHeaderTitle}>COMPLETED AT</h4>
                  <p className={styles.metaValueHighlightText}>{selectedEvent.completedAt}</p>
                </div>

                <div>
                  <h4 className={styles.metaLabelHeaderTitle}>REPORT DEADLINE</h4>
                  <p className={styles.metaValueHighlightText}>{selectedEvent.reportDueAt}</p>
                </div>
              </div>

              <div className={`${styles.gridMetaParametersRow} ${styles.metaRowSpacer}`}>
                <div>
                  <h4 className={styles.metaLabelHeaderTitle}>SUBMITTED AT</h4>
                  <p className={styles.metaValueHighlightText}>{selectedEvent.reportSubmittedAt}</p>
                </div>

                <div>
                  <h4 className={styles.metaLabelHeaderTitle}>REPORT PDF</h4>
                  {selectedEvent.reportPdfUrl ? (
                    <a href={getPdfUrl(selectedEvent.reportPdfUrl)} target="_blank" rel="noopener noreferrer" className={styles.attachmentLinkText}>
                      Open completion report PDF
                    </a>
                  ) : (
                    <p className={styles.metaValueHighlightText}>No report submitted</p>
                  )}
                </div>
              </div>

              {selectedEvent.isOverdue && selectedEvent.reportStatus === "not_submitted" && (
                <div className={styles.rejectionInfoBlock}>
                  <h4 className={styles.rejectionInfoTitle}>AUTO REJECTION NOTE</h4>
                  <p className={styles.rejectionInfoText}>Failed to submit report within the maximum limit.</p>
                </div>
              )}

              {selectedEvent.reportAdminComment && (
                <div className={styles.rejectionInfoBlock}>
                  <h4 className={styles.rejectionInfoTitle}>ADMIN MESSAGE</h4>
                  <p className={styles.rejectionInfoText}>{selectedEvent.reportAdminComment}</p>
                </div>
              )}
            </div>

            {selectedEvent.reportStatus === "submitted" && (
              <div className={styles.drawerStickyActionBarRow}>
                <button
                  disabled={actionLoading}
                  onClick={acceptSelectedReport}
                  className={styles.approveActionLargeButton}
                >
                  {actionLoading ? "Processing..." : "✓ Accept Report"}
                </button>

                <button
                  disabled={actionLoading}
                  onClick={openRejectionModal}
                  className={styles.rejectActionLargeButton}
                >
                  {actionLoading ? "Processing..." : "✕ Reject Report"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isRejectionModalOpen && selectedEvent && (
        <div className={styles.rejectionModalOverlay}>
          <div className={styles.rejectionModalContent}>
            <h3 className={styles.rejectionModalTitle}>Specify Report Rejection Reason</h3>

            <textarea
              className={styles.rejectionModalTextarea}
              placeholder="Write why this completion report is rejected..."
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
            />

            <div className={styles.rejectionModalActions}>
              <button className={styles.rejectionModalCancelButton} onClick={closeRejectionModal}>
                Cancel
              </button>

              <button className={styles.rejectionModalSubmitButton} onClick={submitSelectedRejection}>
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
