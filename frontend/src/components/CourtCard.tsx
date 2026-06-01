import { useEffect, useMemo, useState } from "react";
import { formatCountdown, useCountdown } from "../hooks/useCountdown.ts";
import { SENSOR_POLL_MS } from "../hooks/useCourts.ts";
import type { Court, CourtStatus } from "../types.ts";
import { OfflineBadge } from "./OfflineBadge.tsx";

type CourtCardProps = {
  court: Court & { status: CourtStatus; isPlaceholder?: boolean };
};

const UCSD_BLUE = "#00629B";

const STATUS_META: Record<
  CourtStatus,
  { icon: string; label: string; accent: string; bg: string; border: string }
> = {
  unknown: {
    icon: "⚪",
    label: "Unknown",
    accent: "#6b7280",
    bg: "#f9fafb",
    border: "#d1d5db",
  },
  unavailable: {
    icon: "🔴",
    label: "Unavailable",
    accent: "#b91c1c",
    bg: "#fef2f2",
    border: "#fca5a5",
  },
  available: {
    icon: "🟢",
    label: "Available",
    accent: "#15803d",
    bg: "#ecfdf5",
    border: "#86efac",
  },
};

function formatRelativeTime(updatedAt: string): string {
  if (!updatedAt) return "No data yet";

  const diffMs = Date.now() - new Date(updatedAt).getTime();
  if (diffMs < 0) return "just now";

  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return sec <= 1 ? "just now" : `${sec} sec ago`;

  const min = Math.floor(sec / 60);
  if (min < 60) return min === 1 ? "1 min ago" : `${min} min ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return hr === 1 ? "1 hour ago" : `${hr} hours ago`;

  const day = Math.floor(hr / 24);
  return day === 1 ? "1 day ago" : `${day} days ago`;
}

export function CourtCard({ court }: CourtCardProps) {
  const [relativeTime, setRelativeTime] = useState(() =>
    formatRelativeTime(court.updated_at),
  );
  const meta = STATUS_META[court.status];
  const showOfflineBadge =
    court.status === "unknown" &&
    !court.isPlaceholder &&
    Boolean(court.updated_at);

  const nextSensorPingAt = useMemo(() => {
    if (!court.updated_at) return null;
    return new Date(court.updated_at).getTime() + SENSOR_POLL_MS;
  }, [court.updated_at]);

  const sensorPingRemaining = useCountdown(nextSensorPingAt);

  useEffect(() => {
    const refresh = () => setRelativeTime(formatRelativeTime(court.updated_at));
    refresh();
    const intervalId = setInterval(refresh, 30_000);
    return () => clearInterval(intervalId);
  }, [court.updated_at]);

  let updateLine = "Waiting for sensor data";
  if (court.isPlaceholder) {
    updateLine = "No readings yet · sensors ping every 5 min";
  } else if (court.updated_at) {
    updateLine = `Updated ${relativeTime}`;
  }

  let pingLine: string | null = null;
  if (court.isPlaceholder) {
    pingLine = "Next sensor ping: unknown until online";
  } else if (nextSensorPingAt !== null) {
    pingLine =
      sensorPingRemaining <= 0
        ? "Next sensor ping: due now"
        : `Next sensor ping in ${formatCountdown(sensorPingRemaining)}`;
  }

  return (
    <article
      style={{
        background: meta.bg,
        border: `2px solid ${meta.border}`,
        borderRadius: "14px",
        padding: "1.15rem 1.1rem 1rem",
        boxShadow: "0 8px 22px rgba(0, 98, 155, 0.08)",
        display: "flex",
        flexDirection: "column",
        gap: "0.65rem",
        minHeight: "168px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "0.5rem",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "1.05rem",
            fontWeight: 700,
            color: UCSD_BLUE,
            letterSpacing: "-0.02em",
          }}
        >
          Court {court.court_id}
        </h2>
        {showOfflineBadge ? <OfflineBadge /> : null}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginTop: "0.15rem",
        }}
      >
        <span
          aria-hidden
          style={{
            fontSize: "2.35rem",
            lineHeight: 1,
          }}
        >
          {meta.icon}
        </span>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: "1.35rem",
              fontWeight: 700,
              color: meta.accent,
              lineHeight: 1.2,
            }}
          >
            {meta.label}
          </p>
          <p
            style={{
              margin: "0.2rem 0 0",
              fontSize: "0.82rem",
              color: "#4b5563",
            }}
          >
            {updateLine}
          </p>
          {pingLine ? (
            <p
              style={{
                margin: "0.15rem 0 0",
                fontSize: "0.78rem",
                color: "#00629B",
                fontWeight: 600,
              }}
            >
              {pingLine}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
