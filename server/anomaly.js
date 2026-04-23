const WINDOW = 20;
const Z_THRESHOLD = 2.5;

const history = new Map();

function check(name, value) {
  if (!history.has(name)) history.set(name, []);
  const buf = history.get(name);

  buf.push(value);
  if (buf.length > WINDOW) buf.shift();

  if (buf.length < 6) return null;

  const mean = buf.reduce((a, b) => a + b, 0) / buf.length;
  const variance = buf.reduce((s, v) => s + (v - mean) ** 2, 0) / buf.length;
  const std = Math.sqrt(variance);

  if (std === 0) return null;

  const z = Math.abs((value - mean) / std);
  if (z >= Z_THRESHOLD) {
    return {
      metric: name,
      value,
      mean: +mean.toFixed(4),
      std: +std.toFixed(4),
      z: +z.toFixed(2),
      direction: value > mean ? "high" : "low",
    };
  }

  return null;
}

module.exports = { check };
