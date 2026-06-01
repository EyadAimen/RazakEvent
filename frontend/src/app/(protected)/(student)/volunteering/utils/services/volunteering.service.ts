import { apiFetchAuth } from "@/lib/api";
import { VolunteeringApplication, MyApplicationsResponse } from "../interfaces/volunteering.interface";

export async function fetchMyVolunteeringApplications(): Promise<MyApplicationsResponse> {
  return apiFetchAuth<MyApplicationsResponse>("/volunteering/applications/mine");
}
