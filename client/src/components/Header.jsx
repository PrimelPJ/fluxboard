export default function Header({ connected, metricCount, onRefresh }) {
  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px", height: 52,
      background: "var(--surface)", borderBottom: "1px solid var(--border)",
      flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 13 L5 8 L8 11 L11 5 L14 9 L16 6" stroke="#5b8fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="16" cy="6" r="1.5" fill="#5b8fff"/>
          </svg>
          <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.02em" }}>fluxboard</span>
        </div>
        <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--mono)" }}>
          {metricCount} metric{metricCount !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onRefresh} style={{
          fontSize: 12, color: "var(--muted)", padding: "4px 10px",
          border: "1px solid var(--border2)", borderRadius: 6,
          transition: "color 0.15s",
        }}>
          refresh
        </button>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11,
          color: connected ? "var(--green)" : "var(--muted)", fontFamily: "var(--mono)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%",
            background: connected ? "var(--green)" : "var(--muted)",
            boxShadow: connected ? "0 0 6px var(--green)" : "none",
            display: "inline-block", transition: "all 0.3s" }} />
          {connected ? "live" : "offline"}
        </span>
      </div>
    </header>
  );
}
