# Fluxboard

A self-hosted, real-time metrics and observability dashboard. Send numbers to it over HTTP — it stores them, streams updates to every connected client via WebSocket, draws live time-series charts, and automatically flags statistical anomalies.

No configuration files. No schema. It auto-discovers every metric you push.

---

## What it does

- **Ingest anything** — push any named numeric metric via a single HTTP endpoint
- **Live updates** — all connected clients see new data within milliseconds via WebSocket
- **Anomaly detection** — automatically flags values that deviate more than 2.5 standard deviations from the rolling mean
- **Time-series charts** — click any metric card to open a full interactive chart with 1m / 5m / 1h / 6h / 24h range selector
- **Event log** — structured event feed with info / warn / error levels, anomaly events auto-posted
- **Metric filtering** — filter cards by name in real time
- **Persistent** — SQLite backed, survives restarts, supports time-bucketed rollup queries

---

## Stack

| Layer | Tech |
|---|---|
| Server | Node.js, Express |
| Real-time | WebSocket (`ws`) |
| Storage | SQLite via `better-sqlite3` |
| Anomaly detection | Rolling Z-score (window = 20) |
| Client | React 18, Vite, Recharts |

---

## Getting started

**Prerequisites:** Node.js 18+

```bash
git clone https://github.com/yourusername/fluxboard.git
cd fluxboard

# start the server
cd server && npm install && npm start

# start the client (new terminal)
cd client && npm install && npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Ingesting metrics

**Single metric:**

```bash
curl -X POST http://localhost:4000/api/ingest/metric \
  -H "Content-Type: application/json" \
  -d '{"name": "api.latency_ms", "value": 142}'
```

**Batch:**

```bash
curl -X POST http://localhost:4000/api/ingest/metrics \
  -H "Content-Type: application/json" \
  -d '[
    {"name": "cpu.usage", "value": 67.2},
    {"name": "mem.used_mb", "value": 1420},
    {"name": "http.req_per_sec", "value": 320}
  ]'
```

**Custom event:**

```bash
curl -X POST http://localhost:4000/api/ingest/event \
  -H "Content-Type: application/json" \
  -d '{"title": "Deployed v2.1.4", "level": "ok"}'
```

Metric fields: `name` (required), `value` (required, number), `type` (gauge/counter), `tags` (object).

---

## API reference

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/ingest/metric` | Ingest a single metric |
| `POST` | `/api/ingest/metrics` | Ingest a batch |
| `POST` | `/api/ingest/event` | Post a custom event |
| `GET` | `/api/metrics` | List all metrics with latest value + stats |
| `GET` | `/api/metrics/:name/series` | Time-series data with bucketing |
| `GET` | `/api/events` | Recent event log |

---

## Anomaly detection

Fluxboard uses a rolling Z-score algorithm. For each new data point it:

1. Maintains a sliding window of the last 20 values per metric
2. Computes the mean and standard deviation of that window
3. Calculates `z = |value - mean| / stddev`
4. If `z ≥ 2.5`, flags the metric and posts an anomaly event to the event log

Anomalous cards are highlighted in the dashboard and cleared after 30 seconds.

---

## Project structure

```
fluxboard/
├── server/
│   ├── index.js          # Express server + WebSocket init
│   ├── db.js             # SQLite time-series storage + rollup queries
│   ├── ws.js             # WebSocket broadcast manager
│   ├── anomaly.js        # Rolling Z-score anomaly detection
│   └── routes/
│       ├── ingest.js     # POST metric / metrics / event
│       └── query.js      # GET metrics / series / events
└── client/
    └── src/
        ├── App.jsx                    # Root state + WS subscription
        ├── hooks/useFluxSocket.js     # Reconnecting WebSocket hook
        └── components/
            ├── Header.jsx             # Live indicator + controls
            ├── MetricCard.jsx         # Metric tile with sparkline
            ├── Sparkline.jsx          # SVG mini chart
            ├── TimeSeriesChart.jsx    # Full Recharts chart + stats
            └── EventFeed.jsx          # Structured event log
```

---

## License

MIT
