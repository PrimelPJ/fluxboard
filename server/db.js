const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "fluxboard.db"));

db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    value REAL NOT NULL,
    type TEXT NOT NULL DEFAULT 'gauge',
    tags TEXT NOT NULL DEFAULT '{}',
    ts INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT,
    level TEXT NOT NULL DEFAULT 'info',
    tags TEXT NOT NULL DEFAULT '{}',
    ts INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_metrics_name_ts ON metrics(name, ts);
  CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
`);

const insertMetric = db.prepare(
  `INSERT INTO metrics (name, value, type, tags, ts) VALUES (@name, @value, @type, @tags, @ts)`
);

const insertEvent = db.prepare(
  `INSERT INTO events (title, body, level, tags, ts) VALUES (@title, @body, @level, @tags, @ts)`
);

function saveMetric(m) {
  const row = {
    name: m.name,
    value: m.value,
    type: m.type || "gauge",
    tags: JSON.stringify(m.tags || {}),
    ts: m.ts || Date.now(),
  };
  const info = insertMetric.run(row);
  return { ...row, id: info.lastInsertRowid, tags: m.tags || {} };
}

function saveEvent(e) {
  const row = {
    title: e.title,
    body: e.body || null,
    level: e.level || "info",
    tags: JSON.stringify(e.tags || {}),
    ts: e.ts || Date.now(),
  };
  const info = insertEvent.run(row);
  return { ...row, id: info.lastInsertRowid, tags: e.tags || {} };
}

function getMetricNames() {
  return db
    .prepare("SELECT DISTINCT name FROM metrics ORDER BY name")
    .all()
    .map((r) => r.name);
}

function getLatestValues() {
  return db
    .prepare(
      `SELECT name, value, type, ts FROM metrics
       WHERE id IN (SELECT MAX(id) FROM metrics GROUP BY name)`
    )
    .all();
}

function getSeries(name, from, to, bucketMs) {
  const rows = db
    .prepare(
      `SELECT ts, value FROM metrics
       WHERE name = ? AND ts BETWEEN ? AND ?
       ORDER BY ts ASC`
    )
    .all(name, from, to);

  if (!bucketMs) return rows;

  const buckets = new Map();
  for (const row of rows) {
    const key = Math.floor(row.ts / bucketMs) * bucketMs;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(row.value);
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([ts, vals]) => ({
      ts,
      value: vals.reduce((a, b) => a + b, 0) / vals.length,
      min: Math.min(...vals),
      max: Math.max(...vals),
      count: vals.length,
    }));
}

function getRecentEvents(limit = 50) {
  return db
    .prepare("SELECT * FROM events ORDER BY ts DESC LIMIT ?")
    .all(limit)
    .map((r) => ({ ...r, tags: JSON.parse(r.tags) }));
}

function getStats(name, windowMs = 3600000) {
  const since = Date.now() - windowMs;
  const row = db
    .prepare(
      `SELECT COUNT(*) as count, AVG(value) as mean,
       MIN(value) as min, MAX(value) as max,
       AVG(value * value) as mean_sq
       FROM metrics WHERE name = ? AND ts > ?`
    )
    .get(name, since);

  const stddev = row.mean_sq != null
    ? Math.sqrt(Math.max(0, row.mean_sq - row.mean * row.mean))
    : 0;

  return { ...row, stddev };
}

module.exports = {
  saveMetric,
  saveEvent,
  getMetricNames,
  getLatestValues,
  getSeries,
  getRecentEvents,
  getStats,
};
