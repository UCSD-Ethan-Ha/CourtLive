import { useEffect, useState } from "react";

const LA_TZ = "America/Los_Angeles";
const TICK_MS = 60_000;

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

type LaClock = {
  weekday: number;
  hour: number;
  minute: number;
};

type DaySchedule = {
  openHour: number;
  closeHour: number;
};

function getLaClock(now: Date): LaClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: LA_TZ,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  const weekday =
    WEEKDAY_INDEX[parts.find((p) => p.type === "weekday")?.value ?? "Sun"] ??
    0;
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);

  return { weekday, hour, minute };
}

function getSchedule(weekday: number): DaySchedule {
  if (weekday >= 1 && weekday <= 5) {
    return { openHour: 7, closeHour: 23 };
  }
  return { openHour: 8, closeHour: 22 };
}

function formatClockTime(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:00 ${period}`;
}

function isCourtOpen(clock: LaClock): boolean {
  const { openHour, closeHour } = getSchedule(clock.weekday);
  const minutes = clock.hour * 60 + clock.minute;
  return minutes >= openHour * 60 && minutes < closeHour * 60;
}

function getNextChangeLabel(clock: LaClock, open: boolean): string {
  const today = getSchedule(clock.weekday);
  const minutes = clock.hour * 60 + clock.minute;

  if (open) {
    return `Closes at ${formatClockTime(today.closeHour)}`;
  }

  if (minutes < today.openHour * 60) {
    return `Opens at ${formatClockTime(today.openHour)}`;
  }

  for (let dayOffset = 1; dayOffset <= 7; dayOffset += 1) {
    const nextWeekday = (clock.weekday + dayOffset) % 7;
    const next = getSchedule(nextWeekday);
    return `Opens at ${formatClockTime(next.openHour)}`;
  }

  return `Opens at ${formatClockTime(7)}`;
}

function evaluateHours(now: Date): { isOpen: boolean; nextChangeLabel: string } {
  const clock = getLaClock(now);
  const open = isCourtOpen(clock);
  return {
    isOpen: open,
    nextChangeLabel: getNextChangeLabel(clock, open),
  };
}

export function useCourtHours(): { isOpen: boolean; nextChangeLabel: string } {
  const [hours, setHours] = useState(() => evaluateHours(new Date()));

  useEffect(() => {
    const tick = () => {
      try {
        setHours(evaluateHours(new Date()));
      } catch (err) {
        console.error(
          err instanceof Error
            ? err.message
            : "Failed to evaluate court hours",
        );
      }
    };

    tick();
    const intervalId = setInterval(tick, TICK_MS);
    return () => clearInterval(intervalId);
  }, []);

  return hours;
}
