export interface Court {
  court_id: number;
  occupied: boolean;
  updated_at: string;
}

export type CourtStatus = "unknown" | "available" | "unavailable";
