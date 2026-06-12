"use client";

import { useEffect, useState } from "react";
import Triangle from "@/components/shared/triangle/triangle";
import CalendarGrid from "@/components/shared/CalendarGrid/CalendarGrid";
import CalendarPanel from "@/components/shared/CalendarPanel/CalendarPanel";
import { fetchSharedEvents } from "@/app/(protected)/(shared)/events/utils/services/events.services";
import type { SharedEvent } from "@/app/(protected)/(shared)/events/utils/interface/events.interface";
import { toDateKey } from "./utils/calendar.helpers";
import styles from "./page.module.css";

export default function CalendarPage() {
  const today = new Date();
  const [current, setCurrent]         = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents]           = useState<SharedEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dismissing, setDismissing]   = useState(false);

  // will be changed
  useEffect(() => { fetchSharedEvents().then(setEvents).catch(() => {}); }, []);

  const year  = current.getFullYear();
  const month = current.getMonth();

  const eventsByDate: Record<string, SharedEvent[]> = {};
  events.forEach(e => {
    const key = e.eventDate.split("T")[0];
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(e);
  });

  function openDate(date: Date) {
    setDismissing(false);
    setSelectedDate(date);
  }

  function closePanel() {
    setDismissing(true);
    setTimeout(() => { setSelectedDate(null); setDismissing(false); }, 400);
  }

  function prevMonth() { setCurrent(new Date(year, month - 1, 1)); closePanel(); }
  function nextMonth() { setCurrent(new Date(year, month + 1, 1)); closePanel(); }

  const selectedKey    = selectedDate ? toDateKey(selectedDate) : null;
  const selectedEvents = selectedKey ? (eventsByDate[selectedKey] ?? []) : [];

  return (
    <div className={styles.page}>
      <div className={styles.body}>
        <Triangle style={{ left: "0px",   top: "60px",     transform: "rotate(-20deg)", borderBottomColor: "var(--color-primary-500)"   }} />
        <Triangle style={{ right: "30px", top: "40px",     transform: "rotate(10deg)",  borderBottomColor: "var(--color-secondary-500)" }} />
        <Triangle style={{ left: "20px",  bottom: "120px", transform: "rotate(-10deg)", borderBottomColor: "var(--color-semantic-red)"  }} />
        <Triangle style={{ right: "0px",  bottom: "60px",  transform: "rotate(20deg)",  borderBottomColor: "var(--color-primary-800)"   }} />

        <div className={styles.inner}>
          <div className={styles.heading}>
            <h1 className={styles.title}>Calendar</h1>
            <p className={styles.subtitle}>View and track upcoming events.</p>
          </div>

          <div className={styles.layout}>
            <CalendarGrid
              year={year}
              month={month}
              todayKey={toDateKey(today)}
              selectedKey={selectedKey}
              eventsByDate={eventsByDate}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
              onSelectDate={openDate}
              onDeselect={closePanel}
            />

            {selectedDate && (
              <CalendarPanel
                selectedDate={selectedDate}
                events={selectedEvents}
                dismissing={dismissing}
                onClose={closePanel}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
