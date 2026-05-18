"use client";

import { useState, useEffect } from "react";
import styles from "./requests.module.css";
import { Proposal } from "./utils/interfaces/proposal.interface";
import { fetchDatabaseProposals, patchProposalDecision } from "./utils/services/proposal.service";
import { ApiError } from "@/lib/api";

export default function AdminRequestsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorContext, setErrorContext] = useState<string | null>(null);

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

  const handleDecisionUpdate = async (id: number, decisionStatus: "approved" | "rejected") => {
    try {
      setActionLoading(true);
      setErrorContext(null);
      await patchProposalDecision(id, decisionStatus);
      
      setProposals((prev) =>
        prev.map((prop) => (prop.id === id ? { ...prop, status: decisionStatus } : prop))
      );
      setIsDrawerOpen(false);
      setSelectedProposal(null);
    } catch (err: any) {
      console.error(`Component catch layer caught action assignment failure on row ID ${id}:`, err);
      setErrorContext(err.message || "The remote server rejected this status mutation choice.");
    } finally {
      setActionLoading(false);
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
    <div className={styles.containerWrapperRelative}>
      <div className={`${styles.mainPageWrapper} ${isDrawerOpen ? styles.faintBackgroundActive : ""}`}>

        <div className={styles.headerArea}>
          <h1 className={styles.text4xl}>Club Requests</h1>
          <p className={styles.textMuted}>Manage and review new club and community proposals.</p>
        </div>

        {errorContext && <p className={styles.apiError}>{errorContext}</p>}

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

      {isDrawerOpen && <div className={styles.drawerOverlayShield} onClick={() => { setIsDrawerOpen(false); setSelectedProposal(null); setErrorContext(null); }} />}

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
            </div>

            <div className={styles.drawerStickyActionBarRow}>
              <button disabled={actionLoading} onClick={() => handleDecisionUpdate(selectedProposal.id, "approved")} className={styles.approveActionLargeButton}>
                {actionLoading ? "Processing..." : "✓ Approve"}
              </button>
              <button disabled={actionLoading} onClick={() => handleDecisionUpdate(selectedProposal.id, "rejected")} className={styles.rejectActionLargeButton}>
                {actionLoading ? "Processing..." : "✕ Reject"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}