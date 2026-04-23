const http = require("http");
const express = require("express");
const cors = require("cors");
const ws = require("./ws");
const ingest = require("./routes/ingest");
const query = require("./routes/query");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "4mb" }));

ws.init(server);

app.use("/api/ingest", ingest);
app.use("/api", query);

app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

server.listen(PORT, () => {
  console.log(`\nFluxboard server → http://localhost:${PORT}`);
  console.log(`Ingest metrics  → POST http://localhost:${PORT}/api/ingest/metric`);
  console.log(`Ingest events   → POST http://localhost:${PORT}/api/ingest/event\n`);
});
