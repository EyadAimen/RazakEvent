export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
}

export function buildCalendarCells(year: number, month: number): (number | null)[] {
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth    = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
