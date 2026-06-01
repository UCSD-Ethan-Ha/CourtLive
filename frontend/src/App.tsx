import { useMemo, useState } from "react";
import { ContactPage } from "./components/ContactPage.tsx";
import { CourtGrid } from "./components/CourtGrid.tsx";
import { Navbar, type Page } from "./components/Navbar.tsx";
import { StatusBanner } from "./components/StatusBanner.tsx";
import { formatCountdown, useCountdown } from "./hooks/useCountdown.ts";
import { useCourtHours } from "./hooks/useCourtHours.ts";
import { useCourts } from "./hooks/useCourts.ts";
import type { Court, CourtStatus } from "./types.ts";

const UCSD_BLUE = "#00629B";
const UCSD_GOLD = "#FFCD00";
const UCSD_NAVY = "#182B49";

export type Sport = "basketball" | "badminton";

const SPORTS: { value: Sport; label: string; icon: string }[] = [
  { value: "basketball", label: "Basketball", icon: "🏀" },
  { value: "badminton", label: "Badminton", icon: "🏸" },
];

/** court_id mapping until API includes sport — basketball 1–2, badminton 3–4 */
const COURT_IDS_BY_SPORT: Record<Sport, [number, number]> = {
  basketball: [1, 2],
  badminton: [3, 4],
};

function placeholderCourt(
  courtId: number,
): Court & { status: CourtStatus; isPlaceholder: boolean } {
  return {
    court_id: courtId,
    occupied: false,
    updated_at: "",
    status: "unknown",
    isPlaceholder: true,
  };
}

function courtsForSport(
  sport: Sport,
  apiCourts: (Court & { status: CourtStatus })[],
): (Court & { status: CourtStatus })[] {
  return COURT_IDS_BY_SPORT[sport].map((courtId) => {
    const fromApi = apiCourts.find((c) => c.court_id === courtId);
    return fromApi ?? placeholderCourt(courtId);
  });
}

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [sport, setSport] = useState<Sport>("basketball");
  const { courts: apiCourts, error, loading, nextDashboardRefreshAt } =
    useCourts();
  const { isOpen, nextChangeLabel } = useCourtHours();
  const dashboardRefreshRemaining = useCountdown(nextDashboardRefreshAt);

  const sportCourts = useMemo(
    () => courtsForSport(sport, apiCourts),
    [sport, apiCourts],
  );

  const showInitialSpinner = loading && apiCourts.length === 0;

  return (
    <div
      style={{
        minHeight: "100svh",
        background: `linear-gradient(180deg, #e8f4fa 0%, #ffffff 45%, #fffef5 100%)`,
        color: "#1f2937",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');

        .courtlive-page {
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        .courtlive-spinner {
          width: 2.5rem;
          height: 2.5rem;
          border: 3px solid rgba(0, 98, 155, 0.2);
          border-top-color: ${UCSD_BLUE};
          border-radius: 50%;
          animation: courtlive-spin 0.8s linear infinite;
        }

        @keyframes courtlive-spin {
          to { transform: rotate(360deg); }
        }

        .courtlive-select {
          width: 100%;
          max-width: 320px;
          padding: 0.65rem 2.25rem 0.65rem 0.85rem;
          font-size: 1rem;
          font-family: inherit;
          font-weight: 600;
          color: ${UCSD_NAVY};
          background: #fff;
          border: 2px solid ${UCSD_BLUE};
          border-radius: 10px;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%2300629B' d='M1 1l5 5 5-5'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.85rem center;
        }

        .courtlive-select:focus-visible {
          outline: 2px solid ${UCSD_GOLD};
          outline-offset: 2px;
        }

        .courtlive-hero {
          border-bottom: 3px solid ${UCSD_GOLD};
          background: linear-gradient(135deg, rgba(0, 98, 155, 0.08) 0%, rgba(255, 205, 0, 0.12) 100%);
        }

        .courtlive-school {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 0.35rem;
        }

        .courtlive-school-name {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 700;
          color: ${UCSD_NAVY};
          letter-spacing: -0.02em;
        }

        .courtlive-refresh-timer {
          max-width: 1100px;
          margin: 0.5rem auto 0;
          padding: 0.55rem 1rem;
          text-align: center;
          font-size: 0.85rem;
          font-weight: 600;
          color: ${UCSD_NAVY};
          background: rgba(255, 205, 0, 0.2);
          border: 1px solid rgba(255, 205, 0, 0.55);
          border-radius: 8px;
          width: calc(100% - 2rem);
        }
      `}</style>

      <div className="courtlive-page">
        <Navbar currentPage={page} onNavigate={setPage} />

        {page === "home" ? (
          <>
            <StatusBanner isOpen={isOpen} nextChangeLabel={nextChangeLabel} />

            <header
              className="courtlive-hero"
              style={{
                maxWidth: "1100px",
                margin: "0 auto",
                padding: "1.5rem 1rem 1rem",
                textAlign: "center",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(1.85rem, 5vw, 2.6rem)",
                  fontWeight: 700,
                  color: UCSD_BLUE,
                  letterSpacing: "-0.03em",
                }}
              >
                CourtLive
              </h1>
              <p
                style={{
                  margin: "0.45rem 0 0",
                  fontSize: "0.95rem",
                  color: UCSD_NAVY,
                }}
              >
                Live court availability · Updates every 5 minutes
              </p>
            </header>

            <section
              style={{
                maxWidth: "1100px",
                margin: "0 auto",
                padding: "0.75rem 1rem 0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <label
                htmlFor="sport-select"
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: UCSD_NAVY,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Sport
              </label>
              <select
                id="sport-select"
                className="courtlive-select"
                value={sport}
                onChange={(e) => setSport(e.target.value as Sport)}
              >
                {SPORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.icon} {s.label}
                  </option>
                ))}
              </select>
              <div className="courtlive-school">
                <p className="courtlive-school-name">UC San Diego</p>
              </div>
            </section>

            {nextDashboardRefreshAt !== null ? (
              <p className="courtlive-refresh-timer" role="status">
                Dashboard refresh in{" "}
                {formatCountdown(dashboardRefreshRemaining)} · Sensors report
                every 5 minutes
              </p>
            ) : null}

            {error ? (
              <div
                role="alert"
                style={{
                  maxWidth: "1100px",
                  margin: "0.75rem auto 0",
                  padding: "0.7rem 1rem",
                  background: "#fef2f2",
                  border: "1px solid #fca5a5",
                  borderRadius: "10px",
                  color: "#991b1b",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  width: "calc(100% - 2rem)",
                }}
              >
                {error}
              </div>
            ) : null}

            {showInitialSpinner ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "3rem 1rem",
                }}
                aria-busy="true"
                aria-label="Loading courts"
              >
                <div className="courtlive-spinner" />
                <p style={{ margin: 0, color: "#4b5563", fontSize: "0.9rem" }}>
                  Loading court status…
                </p>
              </div>
            ) : (
              <CourtGrid courts={sportCourts} />
            )}
          </>
        ) : (
          <ContactPage />
        )}
      </div>
    </div>
  );
}
