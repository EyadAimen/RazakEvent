"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SharedEvent } from "@/app/(protected)/(student)/student/events/utils/interface/events.interface";
import { DAYS, MONTH_NAMES, toDateKey, buildCalendarCells } from "@/app/(protected)/(shared)/calendar/utils/calendar.helpers";
import styles from "./CalendarGrid.module.css";

type Props = {
  year: number;
  month: number;
  todayKey: string;
  selectedKey: string | null;
  eventsByDate: Record<string, SharedEvent[]>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: Date) => void;
  onDeselect: () => void;
};

export default function CalendarGrid({
  year, month, todayKey, selectedKey, eventsByDate,
  onPrevMonth, onNextMonth, onSelectDate, onDeselect,
}: Props) {
  const cells = buildCalendarCells(year, month);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.monthTitle}>{MONTH_NAMES[month]} {year}</h2>
        <div className={styles.navBtns}>
          <button className={styles.navBtn} onClick={onPrevMonth} aria-label="Previous month">
            <ChevronLeft size={18} />
          </button>
          <button className={styles.navBtn} onClick={onNextMonth} aria-label="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className={styles.dayHeaders}>
        {DAYS.map(d => <span key={d} className={styles.dayLabel}>{d}</span>)}
      </div>

      <div className={styles.grid}>
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} className={styles.emptyCell} />;

          const cellDate = new Date(year, month, day);
          const key      = toDateKey(cellDate);
          const cellEvts = eventsByDate[key] ?? [];
          const isToday    = key === todayKey;
          const isSelected = key === selectedKey;

          return (
            <div
              key={idx}
              className={[
                styles.cell,
                isToday    ? styles.cellToday    : "",
                isSelected ? styles.cellSelected : "",
                cellEvts.length > 0 ? styles.cellHasEvents : "",
              ].join(" ")}
              onClick={() => cellEvts.length > 0 ? onSelectDate(cellDate) : onDeselect()}
            >
              <span className={styles.dayNum}>{day}</span>
              {cellEvts.length > 0 && (
                <div className={styles.dots}>
                  {cellEvts.slice(0, 3).map((_, i) => (
                    <span key={i} className={styles.dot} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
