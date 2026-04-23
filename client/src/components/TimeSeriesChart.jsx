import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import { useState, useEffect } from "react";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: "var(--surface3)", border: "1px solid var(--border2)",
      borderRadius: 6, padding: "8px 12px", fontSize: 12, fontFamily: "var(--mono)",
    }}>
      <p style={{ color: "var(--muted)", marginBottom: 4 }}>{new Date(label).toLocaleTimeString()}</p>
      <p style={{ color: "var(--accent)" }}>avg {payload[0].value?.toFixed(4)}</p>
      {d.min != null && <p style={{ color: "var(--muted)" }}>min {d.min?.toFixed(4)} / max {d.max?.toFixed(4)}</p>}
    </div>
  );
}

const RANGES = [
  { label: "1m", ms: 60000 },
  { label: "5m", ms: 300000 },
  { label: "1h", ms: 3600000 },
  { label: "6h", ms: 21600000 },
  { label: "24h", ms: 86400000 },
];

export default function TimeSeriesChart({ name, onClose }) {
  const [range, setRange] = useState(3600000);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/metrics/${encodeURIComponent(name)}/series?range=${range}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [name, range]);

  const mean = data?.stats?.mean;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(8,10,15,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100, backdropFilter: "blur(4px)",
    }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--surface)", border: "1px solid var(--border2)",
          borderRadius: 14, padding: 24, width: "min(720px, 95vw)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 14, color: "var(--text)" }}>{name}</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {RANGES.map((r) => (
              <button key={r.ms} onClick={() => setRange(r.ms)} style={{
                padding: "3px 10px", fontSize: 11, borderRadius: 5,
                background: range === r.ms ? "var(--blue-dim)" : "transparent",
                color: range === r.ms ? "var(--accent)" : "var(--muted)",
                border: `1px solid ${range === r.ms ? "var(--accent)" : "var(--border)"}`,
              }}>{r.label}</button>
            ))}
            <button onClick={onClose} style={{ marginLeft: 8, color: "var(--muted)", fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
        </div>

        {loading ? (
          <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
            loading…
          </div>
        ) : data?.series?.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5b8fff" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#5b8fff" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="ts" tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                tick={{ fill: "var(--muted)", fontSize: 10, fontFamily: "var(--mono)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "var(--muted)", fontSize: 10, fontFamily: "var(--mono)" }} tickLine={false} axisLine={false} width={50} />
              <Tooltip content={<CustomTooltip />} />
              {mean != null && (
                <ReferenceLine y={mean} stroke="rgba(91,143,255,0.4)" strokeDasharray="4 4"
                  label={{ value: "avg", position: "insideTopRight", fill: "var(--muted)", fontSize: 10 }} />
              )}
              <Area type="monotone" dataKey="value" stroke="#5b8fff" strokeWidth={2}
                fill="url(#grad)" dot={false} activeDot={{ r: 3, fill: "#5b8fff" }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 13 }}>
            no data for this range
          </div>
        )}

        {data?.stats && (
          <div style={{ display: "flex", gap: 24, marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            {[
              ["count", data.stats.count],
              ["mean", data.stats.mean?.toFixed(4)],
              ["min", data.stats.min?.toFixed(4)],
              ["max", data.stats.max?.toFixed(4)],
              ["stddev", data.stats.stddev?.toFixed(4)],
            ].map(([label, val]) => (
              <div key={label}>
                <p style={{ fontSize: 10, color: "var(--dim)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                <p style={{ fontSize: 14, fontFamily: "var(--mono)", color: "var(--text)", marginTop: 2 }}>{val ?? "—"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
