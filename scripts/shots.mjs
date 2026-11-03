import { writeFileSync } from "node:fs";

const base = "http://localhost:3100";
const token = process.env.SESSION_TOKEN;
if (!token) throw new Error("SESSION_TOKEN missing");

const pages = [
  ["dashboard", "/dashboard", false],
  ["reports", "/reports", false],
  ["income-statement", "/reports/income-statement", true],
  ["cash-flow", "/reports/cash-flow", true],
  ["balance-sheet", "/reports/balance-sheet", true],
  ["orders", "/orders", false],
  ["counter", "/counter", false],
  ["audit", "/audit", false],
];

const created = await fetch("http://127.0.0.1:9222/json/new?about:blank", { method: "PUT" });
if (!created.ok) throw new Error(`new target failed: ${created.status}`);
const target = await created.json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let nextId = 1;
const pending = new Map();
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  const entry = pending.get(message.id);
  if (!entry) return;
  pending.delete(message.id);
  if (message.error) entry.reject(new Error(message.error.message));
  else entry.resolve(message.result);
};

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await send("Page.enable");
await send("Network.enable");
await send("Network.setCookie", {
  name: "laundrysia_session",
  value: token,
  url: base,
  path: "/",
  httpOnly: true,
  sameSite: "Lax",
});
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: false,
});

for (const [name, path, fullPage] of pages) {
  await send("Page.navigate", { url: base + path });
  await sleep(2200);
  const params = { format: "png", captureBeyondViewport: fullPage };
  if (fullPage) {
    const metrics = await send("Page.getLayoutMetrics");
    const size = metrics.cssContentSize;
    params.clip = {
      x: 0,
      y: 0,
      width: 1440,
      height: Math.min(Math.ceil(size.height), 3200),
      scale: 1,
    };
  }
  const shot = await send("Page.captureScreenshot", params);
  writeFileSync(`docs/screenshots/${name}.png`, Buffer.from(shot.data, "base64"));
  console.log(name, path);
}

ws.close();
