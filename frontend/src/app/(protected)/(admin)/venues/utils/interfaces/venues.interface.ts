export interface AdminVenue {
  id: number;
  name: string;
  location: string | null;
}

export interface VenueBookedDate {
  eventId: number;
  name: string;
  eventDate: string;
  status: string;
}

export interface VenueFormData {
  name: string;
  location: string;
}

export interface VenueFormErrors {
  name?: string;
}
