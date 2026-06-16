"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Proposal } from "../interfaces/proposal.interface";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

async function fetchDatabaseProposals(): Promise<Proposal[]> {
  const token = getAccessToken();

  const rawData = await apiFetch<any>("/proposals", {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const recordsArray = Array.isArray(rawData) ? rawData : rawData.data || [];

  return recordsArray.map((item: any) => {
    const category =
      item.clubType === "community" ? "COMMUNITY" : "CLUB";

    return {
      id: item.id,
      leadId: item.leadId,
      clubId: item.clubId,
      adminId: item.adminId,
      venueId: item.venueId,
      eventName: item.eventName || "Untitled Proposal",
      description: item.description || "No description provided.",
      requesterName: item.requesterName || "Unknown Submitter",
      category,
      status: (item.status || "pending").toLowerCase(),
      estimatedBudget: item.estimatedBudget || "0.00",
      proposedDate: item.proposedDate
        ? new Date(item.proposedDate).toLocaleDateString()
        : "TBD",
      docAttached: item.proposalPdfUrl ? "Open proposal PDF" : "No document attached",
      proposalPdfUrl: item.proposalPdfUrl || "",
      adminComment: item.adminComment || "",
      clubName: item.clubName || "Unknown Club",
      clubType: item.clubType || "club",
      venueName: item.venueName || "No venue assigned",
    };
  });
}

async function patchProposalDecision(
  id: string,
  decisionStatus: "approved" | "rejected",
  comment?: string
): Promise<void> {
  const token = getAccessToken();

  await apiFetch<void>(`/proposals/${id}/decision`, {
    method: "PATCH",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify({
      status: decisionStatus,
      adminComment: comment || `Proposal evaluation completed: ${decisionStatus}`,
    }),
  });
}

export function useProposals() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorContext, setErrorContext] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setErrorContext(null);
      const data = await fetchDatabaseProposals();
      setProposals(data);
    } catch (err: any) {
      console.error("Failed to load proposals:", err);
      setErrorContext(err.message || "Could not load proposals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleDecisionUpdate = async (
    id: string,
    decisionStatus: "approved" | "rejected",
    comment?: string
  ) => {
    try {
      setActionLoading(true);
      setErrorContext(null);

      await patchProposalDecision(id, decisionStatus, comment);

      setProposals((prev) =>
        prev.map((prop) =>
          prop.id === id
            ? {
                ...prop,
                status: decisionStatus,
                adminComment: comment || prop.adminComment,
              }
            : prop
        )
      );

      setSelectedProposal((prev) =>
        prev && prev.id === id
          ? {
              ...prev,
              status: decisionStatus,
              adminComment: comment || prev.adminComment,
            }
          : prev
      );

      setIsDrawerOpen(false);
      setSelectedProposal(null);
    } catch (err: any) {
      console.error(`Failed to update proposal ${id}:`, err);
      setErrorContext(err.message || "Failed to update proposal status.");
    } finally {
      setActionLoading(false);
    }
  };

  const openDrawer = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setIsDrawerOpen(true);
    setErrorContext(null);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedProposal(null);
    setErrorContext(null);
  };

  const filteredProposals = proposals.filter((p: Proposal) => {
    const matchesFilter = activeFilter === "all" || p.status === activeFilter;

    const search = searchQuery.toLowerCase();

    const matchesSearch =
      p.eventName.toLowerCase().includes(search) ||
      p.requesterName.toLowerCase().includes(search) ||
      (p.clubName || "").toLowerCase().includes(search);

    return matchesFilter && matchesSearch;
  });

  return {
    loading,
    errorContext,
    proposals,
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
  };
}