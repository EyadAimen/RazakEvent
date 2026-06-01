import { apiFetchAuth } from "@/lib/api";
import { SharedEvent } from "../interface/events.interface";

export async function fetchSharedEvents(): Promise<SharedEvent[]> {
  const response = await apiFetchAuth<{ events: SharedEvent[] }>("/events/shared");
  return response.events ?? [];
}