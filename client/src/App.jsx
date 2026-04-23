import { useState, useEffect, useCallback } from "react";
import Header from "./components/Header.jsx";
import MetricCard from "./components/MetricCard.jsx";
import TimeSeriesChart from "./components/TimeSeriesChart.jsx";
import EventFeed from "./components/EventFeed.jsx";
import { useFluxSocket } from "./hooks/useFluxSocket.js";

export default function App() {
  const [metrics, setMetrics] = useState([]);
  const [seriesCache, setSeriesCache] = useState({});
  const [events, setEvents] = useState([]);
  const [anomalous, setAnomalous] = useState(new Set());
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("");

  const loadAll = useCallback(() => {
    fetch("/api/metrics").then((r) => r.json()).then(setMetrics).catch(() => {});
    fetch("/api/events?limit=60").then((r) => r.json()).then(setEvents).catch(() => {});
  }, []);

  const loadSeries = useCallback((name) => {
    fetch(`/api/metrics/${encodeURIComponent(name)}/series?range=3600000`)
      .then((r) => r.json())
      .then((d) => setSeriesCache((prev) => ({ ...prev, [name]: d.series })))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 15000);
    return () => clearInterval(interval);
  }, [loadAll]);

  useEffect(() => {
    metrics.forEach((m) => { if (!seriesCache[m.name]) loadSeries(m.name); });
  }, [metrics, seriesCache, loadSeries]);

  const connected = useFluxSocket(({ event, data }) => {
    if (event === "metric") {
      setMetrics((prev) => {
        const idx = prev.findIndex((m) => m.name === data.name);
        if (idx === -1) {
          loadAll();
          return prev;
        }
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          latest: { value: data.value, ts: data.ts, type: data.type },
        };
        return next;
      });
      setSeriesCache((prev) => {
        const existing = prev[data.name] || [];
        return {
          ...prev,
          [data.name]: [...existing, { ts: data.ts, value: data.value }].slice(-60),
        };
      });
    }
    if (event === "event") {
      setEvents((prev) => [data, ...prev].slice(0, 60));
      if (data.tags?.metric) {
        setAnomalous((prev) => new Set([...prev, data.tags.metric]));
        setTimeout(() => {
          setAnomalous((prev) => {
            const next = new Set(prev);
            next.delete(data.tags.metric);
            return next;
          });
        }, 30000);
      }
    }
  });

  const filtered = metrics.filter((m) =>
    !filter || m.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header connected={connected} metricCount={metrics.length} onRefresh={loadAll} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <main style={{ flex: 1, overflow: "auto", padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="filter metrics…"
              style={{
                background: "var(--surface2)", border: "1px solid var(--border)",
                borderRadius: 7, padding: "7px 12px", fontSize: 13, color: "var(--text)",
                fontFamily: "var(--mono)", width: 260, outline: "none",
              }}
            />
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted)" }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>◈</p>
              <p style={{ fontSize: 14 }}>No metrics yet</p>
              <p style={{ fontSize: 12, marginTop: 6 }}>Send a POST to /api/ingest/metric to get started</p>
              <pre style={{
                marginTop: 20, fontSize: 11, color: "var(--dim)", fontFamily: "var(--mono)",
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 8, padding: "14px 20px", display: "inline-block", textAlign: "left",
              }}>{`curl -X POST http://localhost:4000/api/ingest/metric \\
  -H "Content-Type: application/json" \\
  -d '{"name":"cpu.usage","value":42.5}'`}</pre>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12,
            }}>
              {filtered.map((m) => (
                <MetricCard
                  key={m.name}
                  metric={m}
                  series={seriesCache[m.name]}
                  anomalous={anomalous.has(m.name)}
                  onClick={() => setSelected(m.name)}
                />
              ))}
            </div>
          )}
        </main>

        <aside style={{
          width: 280, flexShrink: 0,
          borderLeft: "1px solid var(--border)",
          overflow: "hidden", display: "flex", flexDirection: "column",
        }}>
          <EventFeed events={events} />
        </aside>
      </div>

      {selected && (
        <TimeSeriesChart name={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
