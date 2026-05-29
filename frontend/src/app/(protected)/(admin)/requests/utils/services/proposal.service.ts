// app/(protected)/(admin)/requests/util/services/proposal.service.ts
import { apiFetch } from "@/lib/api";
import { Proposal } from "../interfaces/proposal.interface";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export async function fetchDatabaseProposals(): Promise<Proposal[]> {
  const token = getAccessToken();
  const rawData = await apiFetch<any>("/proposals", {
    method: "GET",
    headers: token ? { "Authorization": `Bearer ${token}` } : {},
  });

  const recordsArray = Array.isArray(rawData) ? rawData : rawData.data || [];

  return recordsArray.map((item: any) => {

    const generatedCategory = item.clubId % 2 === 0 ? "CLUB" : "COMMUNITY";

    return {
      id: Number(item.id),
      eventName: item.eventName || "Untitled Proposal",
      description: item.description || "No description provided.",
      requesterName: item.requesterName || "Unknown Submitter", 
      category: generatedCategory,
      status: (item.status || "pending").toLowerCase(),
      estimatedBudget: item.estimatedBudget || "0.00",
      proposedDate: item.proposedDate ? new Date(item.proposedDate).toLocaleDateString() : "TBD",
      docAttached: item.proposalPdfUrl || "proposal.pdf",
      adminComment: item.adminComment || "",
      proposalPdfUrl: item.proposalPdfUrl || ""
    };
  });
}

export async function patchProposalDecision(
  id: number, 
  decisionStatus: "approved" | "rejected",
  comment: string
): Promise<void> {
  const token = getAccessToken();
  await apiFetch<void>(`/proposals/${id}/decision`, {
    method: "PATCH",
    headers: token ? { "Authorization": `Bearer ${token}` } : {},
    body: JSON.stringify({
      status: decisionStatus,
      adminComment: comment
    })
  });
}