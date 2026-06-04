export interface Certificate {
  certificateId: number;
  eventId:       number;
  eventName:     string;
  eventDate:     string | null;
  type:          "organizer" | "volunteer";
  issuedAt:      string;
}

export interface MyCertificatesResponse {
  certificates: Certificate[];
}
