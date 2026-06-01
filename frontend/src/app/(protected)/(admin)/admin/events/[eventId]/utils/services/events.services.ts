import { apiFetchAuth } from "@/lib/api";
import { AdminEventDetail } from "../interface/events.interface";

export async function fetchAdminEventDetail(eventId: string): Promise<AdminEventDetail> {
  const res = await apiFetchAuth<{ event: AdminEventDetail }>(`/events/${eventId}`);
  return res.event;
}