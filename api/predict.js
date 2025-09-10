const WebSocket = require("ws");

let ws = null;
let latestTick = null;
let subscribers = [];
let connected = false;

function connect(symbol = "R_100") {
  if (ws) return;
  const token = process.env.DERIV_API_KEY;
  const url = `wss://ws.derivws.com/websockets/v3?app_id=1089${token ? `&api_token=${token}` : ""}`;
  ws = new WebSocket(url);

  ws.on("open", () => {
    connected = true;
    ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
  });

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.tick) {
        const price = parseFloat(data.tick.quote);
        const last_digit = Math.floor(price) % 10;
        latestTick = { epoch: data.tick.epoch, price, last_digit, symbol };
        subscribers.forEach(fn => fn(latestTick));
      }
    } catch (e) {
      console.error("parse error", e);
    }
  });

  ws.on("close", () => { connected = false; ws = null; });
  ws.on("error", () => { connected = false; ws = null; });
}

function computePrediction(history, limit = 200) {
  const counts = Array(10).fill(0);
  history.slice(-limit).forEach(t => counts[t.last_digit]++);
  const alpha = 1;
  const total = counts.reduce((a,b)=>a+b,0) + alpha*10;
  const probs = counts.map(c => (c+alpha)/total);
  let top = 0, second = 1;
  for (let i=0;i<10;i++){
    if (probs[i] > probs[top]) { second = top; top = i; }
    else if (probs[i] > probs[second] && i!==top) second = i;
  }
  const confidence = Math.min(1, probs[top] + 0.5*(probs[top]-probs[second]));
  return { predicted_digit: top, confidence, probs };
}

let history = [];
subscribers.push(t => {
  history.push(t);
  if (history.length > 500) history.shift();
});

connect();

module.exports = (req, res) => {
  const pred = computePrediction(history, 200);
  const now = Math.floor(Date.now()/1000);
  res.json({
    symbol: "R_100",
    predicted_digit: pred.predicted_digit,
    confidence: Math.round(pred.confidence*10000)/100,
    probs: pred.probs,
    trade_window_seconds: 10,
    timestamp: now
  });
};
