export default function Sparkline({ data, anomalous, height = 40 }) {
  if (!data || data.length < 2) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 200;
  const h = height;
  const pad = 2;

  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  const polyline = pts.join(" ");
  const lastPt = pts[pts.length - 1].split(",");

  const areaPoints = [
    `${pad},${h}`,
    ...pts,
    `${w - pad},${h}`,
  ].join(" ");

  const color = anomalous ? "#f5a623" : "#5b8fff";
  const areaColor = anomalous ? "rgba(245,166,35,0.08)" : "rgba(91,143,255,0.08)";

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <polygon points={areaPoints} fill={areaColor} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="2.5" fill={color} />
    </svg>
  );
}
