const { WebSocketServer } = require("ws");

let wss = null;

function init(server) {
  wss = new WebSocketServer({ server });
  wss.on("connection", (socket) => {
    socket.on("error", () => {});
  });
}

function broadcast(event, data) {
  if (!wss) return;
  const payload = JSON.stringify({ event, data, ts: Date.now() });
  wss.clients.forEach((c) => c.readyState === 1 && c.send(payload));
}

module.exports = { init, broadcast };
