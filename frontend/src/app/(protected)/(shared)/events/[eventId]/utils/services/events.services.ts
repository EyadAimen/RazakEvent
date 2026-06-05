import { apiFetchAuth } from "@/lib/api";
import { SharedEventDetail } from "../interface/events.interface";

export async function fetchSharedEventDetail(eventId: string): Promise<SharedEventDetail> {
  const response = await apiFetchAuth<{ event: SharedEventDetail }>(`/events/shared/${eventId}`);
  return response.event;
}