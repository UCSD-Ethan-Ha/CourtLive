import type { Court, CourtStatus } from "../types.ts";
import { CourtCard } from "./CourtCard.tsx";

type CourtGridProps = {
  courts: (Court & { status: CourtStatus })[];
};

export function CourtGrid({ courts }: CourtGridProps) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

        .court-grid-wrap {
          font-family: 'DM Sans', system-ui, sans-serif;
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 1rem 2rem;
          box-sizing: border-box;
        }

        .court-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        @media (min-width: 600px) {
          .court-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 900px) {
          .court-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .court-grid-empty {
          text-align: center;
          padding: 2.5rem 1rem;
          color: #4b5563;
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          border-radius: 12px;
        }
      `}</style>

      <div className="court-grid-wrap">
        {courts.length === 0 ? (
          <p className="court-grid-empty">No courts found</p>
        ) : (
          <div className="court-grid">
            {courts.map((court) => (
              <CourtCard key={court.court_id} court={court} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
