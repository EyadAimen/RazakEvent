export interface CreateClubPayload {
  clubName: string;
  clubType: "club" | "community";
  category: string;
  description: string;
  supportingLetter: File | null;
}

export interface CreateClubResponse {
  message: string;
}
