export function canMarkEventCompleted(status: string, eventDate: string | null | undefined): boolean {
  if (status !== "approved" && status !== "ongoing") return false;
  if (!eventDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(eventDate);
  date.setHours(0, 0, 0, 0);

  return date <= today;
}
