import { apiFetchAuth } from "@/lib/api";
import type { CreateClubPayload, CreateClubResponse } from "../interfaces/create-club.interface";

export async function createClubRequest(payload: CreateClubPayload): Promise<CreateClubResponse> {
  const form = new FormData();
  form.append("clubName", payload.clubName);
  form.append("clubType", payload.clubType);
  form.append("category", payload.category);
  form.append("description", payload.description);
  if (payload.supportingLetter) {
    form.append("supportingLetter", payload.supportingLetter);
  }
  return apiFetchAuth<CreateClubResponse>("/clubs/requests", {
    method: "POST",
    body: form,
  });
}
