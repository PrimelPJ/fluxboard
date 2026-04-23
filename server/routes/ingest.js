const express = require("express");
const db = require("../db");
const anomaly = require("../anomaly");
const ws = require("../ws");

const router = express.Router();

router.post("/metric", (req, res) => {
  const { name, value, type, tags } = req.body;

  if (!name || value == null) {
    return res.status(400).json({ error: "name and value are required" });
  }
  if (typeof value !== "number") {
    return res.status(400).json({ error: "value must be a number" });
  }

  const metric = db.saveMetric({ name, value, type, tags });

  const alert = anomaly.check(name, value);
  if (alert) {
    const event = db.saveEvent({
      title: `Anomaly: ${name} is ${alert.direction} (z=${alert.z})`,
      body: `Value ${value} is ${alert.z} standard deviations from the rolling mean of ${alert.mean}`,
      level: "warn",
      tags: { metric: name },
    });
    ws.broadcast("event", event);
  }

  ws.broadcast("metric", metric);
  res.status(201).json({ ok: true, id: metric.id, anomaly: alert });
});

router.post("/metrics", (req, res) => {
  const batch = req.body;
  if (!Array.isArray(batch)) {
    return res.status(400).json({ error: "body must be an array" });
  }

  const results = [];
  for (const m of batch) {
    if (!m.name || m.value == null) continue;
    const metric = db.saveMetric(m);
    const alert = anomaly.check(m.name, m.value);
    if (alert) {
      const event = db.saveEvent({
        title: `Anomaly: ${m.name} is ${alert.direction} (z=${alert.z})`,
        body: `Value ${m.value} deviates from rolling mean of ${alert.mean}`,
        level: "warn",
        tags: { metric: m.name },
      });
      ws.broadcast("event", event);
    }
    ws.broadcast("metric", metric);
    results.push({ id: metric.id, anomaly: alert });
  }

  res.status(201).json({ ok: true, count: results.length, results });
});

router.post("/event", (req, res) => {
  const { title, body, level, tags } = req.body;
  if (!title) return res.status(400).json({ error: "title is required" });

  const event = db.saveEvent({ title, body, level, tags });
  ws.broadcast("event", event);
  res.status(201).json({ ok: true, id: event.id });
});

module.exports = router;
