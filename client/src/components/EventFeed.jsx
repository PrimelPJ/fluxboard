const LEVEL_STYLES = {
  info:  { color: "var(--accent)",  bg: "var(--blue-dim)" },
  warn:  { color: "var(--amber)",   bg: "var(--amber-dim)" },
  error: { color: "var(--red)",     bg: "var(--red-dim)" },
  ok:    { color: "var(--green)",   bg: "var(--green-dim)" },
};

function timeStr(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function EventFeed({ events }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
    }}>
      <p style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)", textTransform: "uppercase",
        letterSpacing: "0.08em", padding: "12px 16px 8px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        Event log
      </p>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {events.length === 0 ? (
          <p style={{ padding: 16, fontSize: 12, color: "var(--dim)", textAlign: "center" }}>no events yet</p>
        ) : events.map((e) => {
          const s = LEVEL_STYLES[e.level] || LEVEL_STYLES.info;
          return (
            <div key={e.id} style={{
              padding: "10px 16px", borderBottom: "1px solid var(--border)",
              display: "flex", flexDirection: "column", gap: 3,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3,
                  background: s.bg, color: s.color, fontFamily: "var(--mono)" }}>
                  {e.level}
                </span>
                <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--mono)" }}>
                  {timeStr(e.ts)}
                </span>
              </div>
              <p style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5 }}>{e.title}</p>
              {e.body && (
                <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.4 }}>{e.body}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
