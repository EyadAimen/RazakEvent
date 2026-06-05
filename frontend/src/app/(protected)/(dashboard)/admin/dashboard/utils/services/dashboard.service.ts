import { apiFetchAuth } from "@/lib/api";
import type { AdminDashboardData } from "../interfaces/dashboard.interface";

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  return apiFetchAuth<AdminDashboardData>("/dashboard/admin");
}
