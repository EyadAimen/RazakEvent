export interface Certificate {
  certificateId: string;
  eventId:       string;
  eventName:     string;
  eventDate:     string | null;
  type:          "organizer" | "volunteer";
  issuedAt:      string;
}

export interface MyCertificatesResponse {
  certificates: Certificate[];
}
