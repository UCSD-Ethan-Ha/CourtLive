import { useEffect, useState } from "react";

export function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function useCountdown(targetMs: number | null): number {
  const [remaining, setRemaining] = useState(() =>
    targetMs ? Math.max(0, targetMs - Date.now()) : 0,
  );

  useEffect(() => {
    if (targetMs === null) {
      return;
    }

    const tick = () => setRemaining(Math.max(0, targetMs - Date.now()));
    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [targetMs]);

  return remaining;
}
