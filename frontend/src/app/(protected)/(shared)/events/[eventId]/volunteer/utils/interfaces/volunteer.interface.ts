export type Role = {
  roleId: string;
  roleName: string;
  description: string | null;
  slotsAvailable: number;
  slotsFilled: number;
};

export type EventData = {
  eventId: string;
  eventName: string;
  eventDate: string;
  clubName: string;
  roles: Role[];
};

export type OpenEventsResponse = {
  events: EventData[];
};
