import { apiFetchAuth } from "@/lib/api";
import type { UpcomingEvent } from "../interfaces/dashboard.interface";

export async function getUpcomingEvents(): Promise<UpcomingEvent[]> {
  const { events } = await apiFetchAuth<{ events: UpcomingEvent[] }>("/events/shared");
  return (events ?? []).slice(0, 3);
}
