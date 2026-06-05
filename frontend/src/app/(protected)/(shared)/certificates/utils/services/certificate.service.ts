import { apiFetchAuth } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { MyCertificatesResponse } from "../interfaces/certificate.interface";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export const fetchMyCertificates = (): Promise<MyCertificatesResponse> =>
  apiFetchAuth<MyCertificatesResponse>("/certificates/mine");

export const downloadCertificate = async (certId: number, eventName: string): Promise<void> => {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE}/certificates/${certId}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to download certificate");
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${eventName.replace(/\s+/g, "-")}-certificate.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};
