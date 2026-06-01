export type Role = {
  roleId: number;
  roleName: string;
  description: string | null;
  slotsAvailable: number;
  slotsFilled: number;
};

export type EventData = {
  eventId: number;
  eventName: string;
  eventDate: string;
  clubName: string;
  roles: Role[];
};

export type OpenEventsResponse = {
  events: EventData[];
};
