export interface AdminVenue {
  id: string;
  name: string;
  location: string | null;
}

export interface VenueBookedDate {
  eventId: string;
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
