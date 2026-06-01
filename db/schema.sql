CREATE TABLE readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  court_id INTEGER NOT NULL,
  occupied INTEGER NOT NULL,
  recorded_at TEXT NOT NULL
);

CREATE TABLE court_status (
  court_id INTEGER PRIMARY KEY,
  occupied INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  expires_at TEXT
);

CREATE INDEX idx_court_time ON readings (court_id, recorded_at);
