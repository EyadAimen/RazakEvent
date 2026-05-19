import { useState, useEffect } from "react";
import { apiFetch, ApiError } from "@/lib/api";
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

  const testRequesters: Record<string, string> = {
    lead_01: "Alice Johnson",
    lead_02: "Bob Smith",
    lead_05: "Nadia Hassan",
    lead_06: "Kevin Wong",
    lead_07: "Siti Aminah",
    lead_08: "Marcus Vance",
  };

  return recordsArray.map((item: any) => {
    const generatedCategory = item.clubId % 2 === 0 ? "CLUB" : "COMMUNITY";
    return {
      id: item.id,
      eventName: item.eventName || "Untitled Proposal",
      description: item.description || "No description provided.",
      requesterName: testRequesters[item.leadId] || item.requesterName || "Adam Lee",
      category: generatedCategory,
      status: (item.status || "pending").toLowerCase(),
      estimatedBudget: item.estimatedBudget || "0.00",
      proposedDate: item.proposedDate ? new Date(item.proposedDate).toLocaleDateString() : "TBD",
      docAttached: item.proposalPdfUrl || "proposal.pdf",
    };
  });
}


async function patchProposalDecision(id: number, decisionStatus: "approved" | "rejected"): Promise<void> {
  const token = getAccessToken();
  await apiFetch<void>(`/proposals/${id}/decision`, {
    method: "PATCH",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify({
      status: decisionStatus,
      adminComment: `Proposal evaluation completed: ${decisionStatus}`,
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

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setErrorContext(null);
        const data = await fetchDatabaseProposals();
        setProposals(data);
      } catch (err: any) {
        console.error("Failed to load proposals:", err);
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
      console.error(`Failed to update decision for proposal ${id}:`, err);
      setErrorContext(err.message || "The remote server rejected this status mutation choice.");
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
    const matchesSearch =
      p.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.requesterName.toLowerCase().includes(searchQuery.toLowerCase());
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