import { apiFetchAuth } from "@/lib/api";
import type { AdminVenue, VenueBookedDate } from "../interfaces/venues.interface";

export const fetchAdminVenues = async (): Promise<AdminVenue[]> => {
  const res = await apiFetchAuth<{ venues: AdminVenue[] }>("/venues");
  return res.venues;
};

export const fetchVenueBookedDates = async (id: number): Promise<VenueBookedDate[]> => {
  const res = await apiFetchAuth<{ bookedDates: VenueBookedDate[] }>(`/venues/${id}/booked-dates`);
  return res.bookedDates;
};

export const createAdminVenue = async (data: { name: string; location?: string }): Promise<AdminVenue> => {
  const res = await apiFetchAuth<{ venue: AdminVenue }>("/venues", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.venue;
};

export const updateAdminVenue = async (id: number, data: { name?: string; location?: string }): Promise<AdminVenue> => {
  const res = await apiFetchAuth<{ venue: AdminVenue }>(`/venues/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.venue;
};

export const deleteAdminVenue = async (id: number): Promise<void> => {
  await apiFetchAuth<void>(`/venues/${id}`, { method: "DELETE" });
};
