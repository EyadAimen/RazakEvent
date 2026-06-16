import { apiFetchAuth } from "@/lib/api";
import { OpenEventsResponse } from "../interfaces/volunteer.interface";

export async function fetchOpenVolunteeringEvents(): Promise<OpenEventsResponse> {
  return apiFetchAuth<OpenEventsResponse>("/volunteering/events");
}

export async function applyForVolunteering(roleId: string, reason: string): Promise<void> {
  return apiFetchAuth("/volunteering/applications", {
    method: "POST",
    body: JSON.stringify({
      roleId,
      reason,
    }),
  });
}
