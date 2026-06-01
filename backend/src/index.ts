import cors from "cors";
import dotenv from "dotenv";
import express, { type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { createClient, type Client } from "@libsql/client";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT ?? 3001);
const FRONTEND_URL = process.env.FRONTEND_URL ?? "";
const DEVICE_API_KEY = process.env.DEVICE_API_KEY ?? "";
const TURSO_URL = process.env.TURSO_URL ?? "";
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN ?? "";

let dbClient: Client | null = null;

type CourtRow = {
  court_id: number;
  occupied: number;
  updated_at: string;
};

type ReadingBody = {
  court_id: number;
  occupied: boolean;
};

function getDbClient(): Client {
  if (dbClient) {
    return dbClient;
  }
  if (!TURSO_URL || !TURSO_AUTH_TOKEN) {
    throw new Error("TURSO_URL and TURSO_AUTH_TOKEN must be configured");
  }
  dbClient = createClient({
    url: TURSO_URL,
    authToken: TURSO_AUTH_TOKEN,
  });
  return dbClient;
}

async function initDatabase(): Promise<void> {
  const db = getDbClient();
  await db.execute({
    sql: `
      CREATE TABLE IF NOT EXISTS readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        court_id INTEGER NOT NULL,
        occupied INTEGER NOT NULL,
        recorded_at TEXT NOT NULL
      )
    `,
    args: [],
  });

  await db.execute({
    sql: `
      CREATE TABLE IF NOT EXISTS court_status (
        court_id INTEGER PRIMARY KEY,
        occupied INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL,
        expires_at TEXT
      )
    `,
    args: [],
  });

  await db.execute({
    sql: `
      CREATE INDEX IF NOT EXISTS idx_court_time
      ON readings (court_id, recorded_at)
    `,
    args: [],
  });
}

function getCourtHours(weekday: number): { openHour: number; closeHour: number } {
  if (weekday >= 1 && weekday <= 5) {
    return { openHour: 7, closeHour: 23 };
  }
  return { openHour: 8, closeHour: 22 };
}

function getLosAngelesParts(now: Date): {
  weekday: number;
  hour: number;
  minute: number;
  second: number;
} {
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const weekdayStr = parts.find((part) => part.type === "weekday")?.value ?? "Sun";
  const hourStr = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minuteStr = parts.find((part) => part.type === "minute")?.value ?? "00";
  const secondStr = parts.find((part) => part.type === "second")?.value ?? "00";

  return {
    weekday: weekdayMap[weekdayStr] ?? 0,
    hour: Number(hourStr),
    minute: Number(minuteStr),
    second: Number(secondStr),
  };
}

function getSleepSeconds(now: Date = new Date()): number {
  const la = getLosAngelesParts(now);
  const hours = getCourtHours(la.weekday);
  const currentSeconds = la.hour * 3600 + la.minute * 60 + la.second;
  const openSeconds = hours.openHour * 3600;
  const closeSeconds = hours.closeHour * 3600;
  const duringOpenHours = currentSeconds >= openSeconds && currentSeconds < closeSeconds;

  if (duringOpenHours) {
    return 300;
  }

  for (let dayOffset = 0; dayOffset <= 7; dayOffset += 1) {
    const day = (la.weekday + dayOffset) % 7;
    const nextHours = getCourtHours(day);
    const nextOpenSeconds = nextHours.openHour * 3600;
    if (dayOffset === 0 && currentSeconds < nextOpenSeconds) {
      return Math.min(nextOpenSeconds - currentSeconds, 3600);
    }
    if (dayOffset > 0) {
      const untilMidnight = 86400 - currentSeconds;
      const fullDays = (dayOffset - 1) * 86400;
      const total = untilMidnight + fullDays + nextOpenSeconds;
      return Math.min(total, 3600);
    }
  }

  return 300;
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (!FRONTEND_URL || origin === FRONTEND_URL) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed by CORS"));
    },
  }),
);
app.use(express.json());

const readingRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.header("x-api-key") ?? req.ip ?? "unknown",
});

app.get("/ping", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.get("/api/courts", async (_req: Request, res: Response) => {
  try {
    const db = getDbClient();
    const nowIso = new Date().toISOString();
    const result = await db.execute({
      sql: `
        SELECT
          court_id,
          CASE
            WHEN occupied = 1 AND expires_at > ? THEN 1
            ELSE 0
          END AS occupied,
          updated_at
        FROM court_status
        ORDER BY court_id ASC
      `,
      args: [nowIso],
    });

    const courts = result.rows.map((row) => {
      const typed = row as unknown as CourtRow;
      return {
        court_id: Number(typed.court_id),
        occupied: Number(typed.occupied) === 1,
        updated_at: String(typed.updated_at),
      };
    });

    res.json(courts);
  } catch (error) {
    console.error("Failed to fetch courts:", error);
    res.status(500).json({ error: "Failed to fetch courts" });
  }
});

app.post(
  "/api/reading",
  readingRateLimit,
  async (req: Request<unknown, unknown, ReadingBody>, res: Response) => {
    try {
      if (!DEVICE_API_KEY) {
        res.status(500).json({ error: "DEVICE_API_KEY is not configured" });
        return;
      }

      const apiKey = req.header("x-api-key");
      if (apiKey !== DEVICE_API_KEY) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { court_id: courtId, occupied } = req.body;
      if (!Number.isInteger(courtId) || typeof occupied !== "boolean") {
        res.status(400).json({ error: "Invalid body. Expected court_id and occupied" });
        return;
      }

      const db = getDbClient();
      const now = new Date();
      const nowIso = now.toISOString();
      const expiresAtIso = new Date(now.getTime() + 10 * 60_000).toISOString();

      await db.execute({
        sql: `
          INSERT INTO readings (court_id, occupied, recorded_at)
          VALUES (?, ?, ?)
        `,
        args: [courtId, occupied ? 1 : 0, nowIso],
      });

      await db.execute({
        sql: `
          INSERT INTO court_status (court_id, occupied, updated_at, expires_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(court_id) DO UPDATE SET
            occupied = excluded.occupied,
            updated_at = excluded.updated_at,
            expires_at = excluded.expires_at
        `,
        args: [courtId, occupied ? 1 : 0, nowIso, occupied ? expiresAtIso : null],
      });

      res.json({ ok: true, sleep_seconds: getSleepSeconds(now) });
    } catch (error) {
      console.error("Failed to process reading:", error);
      res.status(500).json({ error: "Failed to process reading" });
    }
  },
);

void initDatabase().catch((error) => {
  console.error("Database initialization failed:", error);
});

app.listen(PORT);
