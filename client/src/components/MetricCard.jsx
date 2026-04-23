import { useState } from "react";
import Sparkline from "./Sparkline.jsx";

function fmt(v) {
  if (v == null) return "—";
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(2) + "M";
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(2) + "k";
  if (Number.isInteger(v)) return v.toString();
  return v.toFixed(3);
}

export default function MetricCard({ metric, series, onClick, anomalous }) {
  const { name, latest, stats } = metric;
  const value = latest?.value;
  const trend = series?.length >= 2
    ? series[series.length - 1].value - series[series.length - 2].value
    : 0;

  return (
    <button
      onClick={onClick}
      style={{
        display: "block", width: "100%", textAlign: "left",
        background: anomalous ? "rgba(245,166,35,0.05)" : "var(--surface)",
        border: `1px solid ${anomalous ? "rgba(245,166,35,0.4)" : "var(--border)"}`,
        borderRadius: 10, padding: "16px", cursor: "pointer",
        transition: "border-color 0.2s, background 0.2s",
        position: "relative", overflow: "hidden",
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = anomalous ? "var(--amber)" : "var(--border2)"}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = anomalous ? "rgba(245,166,35,0.4)" : "var(--border)"}
    >
      {anomalous && (
        <span style={{
          position: "absolute", top: 10, right: 10,
          fontSize: 10, color: "var(--amber)", fontFamily: "var(--mono)",
          background: "var(--amber-dim)", padding: "2px 6px", borderRadius: 4,
        }}>anomaly</span>
      )}

      <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8,
        fontFamily: "var(--mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {name}
      </p>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.03em", color: "var(--text)" }}>
          {fmt(value)}
        </span>
        {trend !== 0 && (
          <span style={{ fontSize: 12, color: trend > 0 ? "var(--green)" : "var(--red)", fontFamily: "var(--mono)" }}>
            {trend > 0 ? "▲" : "▼"} {fmt(Math.abs(trend))}
          </span>
        )}
      </div>

      {series && <Sparkline data={series} anomalous={anomalous} />}

      <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
        {[["min", stats?.min], ["avg", stats?.mean], ["max", stats?.max]].map(([label, val]) => (
          <div key={label}>
            <span style={{ fontSize: 10, color: "var(--dim)", display: "block" }}>{label}</span>
            <span style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--muted)" }}>{fmt(val)}</span>
          </div>
        ))}
      </div>
    </button>
  );
}
