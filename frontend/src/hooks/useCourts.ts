import { useCallback, useEffect, useMemo, useState } from "react";
import type { Court, CourtStatus } from "../types.ts";

export const SENSOR_POLL_MS = 300_000;
const POLL_MS = SENSOR_POLL_MS;
const OFFLINE_MS = 12 * 60_000;

function deriveStatus(court: Court): CourtStatus {
  const ageMs = Date.now() - new Date(court.updated_at).getTime();
  if (ageMs > OFFLINE_MS) return "unknown";
  if (court.occupied) return "unavailable";
  return "available";
}

function getApiBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL;
  if (!url) {
    throw new Error("VITE_API_URL is not configured");
  }
  return url.replace(/\/$/, "");
}

export function useCourts(): {
  courts: (Court & { status: CourtStatus })[];
  error: string;
  loading: boolean;
  lastFetchedAt: number | null;
  nextDashboardRefreshAt: number | null;
} {
  const [courts, setCourts] = useState<Court[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);

  const fetchCourts = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/courts`);
      if (!res.ok) {
        throw new Error(`Failed to fetch courts (${res.status})`);
      }
      const data = (await res.json()) as Court[];
      setCourts(data);
      setLastFetchedAt(Date.now());
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch courts",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCourts();
    const intervalId = setInterval(() => void fetchCourts(), POLL_MS);
    return () => clearInterval(intervalId);
  }, [fetchCourts]);

  const courtsWithStatus = useMemo(
    () =>
      courts.map((court) => ({
        ...court,
        status: deriveStatus(court),
      })),
    [courts],
  );

  const nextDashboardRefreshAt =
    lastFetchedAt !== null ? lastFetchedAt + POLL_MS : null;

  return {
    courts: courtsWithStatus,
    error,
    loading,
    lastFetchedAt,
    nextDashboardRefreshAt,
  };
}
