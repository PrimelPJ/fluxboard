const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/metrics", (_req, res) => {
  const names = db.getMetricNames();
  const latest = db.getLatestValues();
  const latestMap = Object.fromEntries(latest.map((r) => [r.name, r]));

  const metrics = names.map((name) => {
    const stats = db.getStats(name);
    return {
      name,
      latest: latestMap[name] || null,
      stats,
    };
  });

  res.json(metrics);
});

router.get("/metrics/:name/series", (req, res) => {
  const { name } = req.params;
  const now = Date.now();
  const rangeMs = parseInt(req.query.range) || 3600000;
  const from = parseInt(req.query.from) || now - rangeMs;
  const to = parseInt(req.query.to) || now;

  const bucketMap = {
    60000: 5000,
    300000: 10000,
    3600000: 60000,
    21600000: 300000,
    86400000: 600000,
  };
  const bucketMs = bucketMap[rangeMs] || 60000;

  const series = db.getSeries(name, from, to, bucketMs);
  const stats = db.getStats(name, rangeMs);

  res.json({ name, series, stats, from, to, bucketMs });
});

router.get("/events", (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json(db.getRecentEvents(limit));
});

module.exports = router;
