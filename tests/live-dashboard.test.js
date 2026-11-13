const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("live-dashboard.js", "utf8").replace(
  'await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.91.0/+esm")',
  "await Promise.resolve(window.mockModule)"
);

function runDashboard(key, response) {
  const elements = new Map();
  let now = 1000000;
  let calls = 0;
  let onBroadcast;
  let timer;
  const document = {
    hidden: false,
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, { textContent: "histórico", style: {} });
      return elements.get(id);
    },
    addEventListener() {}
  };
  const channel = {
    on(kind, filter, callback) { onBroadcast = callback; return this; },
    subscribe() { return this; }
  };
  const client = {
    async rpc() { calls += 1; return response; },
    channel() { return channel; }
  };
  const window = {
    PROJECT_DATA: { supabaseUrl: "https://example.supabase.co", supabasePublishableKey: key },
    mockModule: { createClient: () => client },
    setInterval(callback) { timer = callback; }
  };
  class Clock extends Date { static now() { return now; } }
  vm.runInNewContext(source, { window, document, URL, Date: Clock, atob: value => Buffer.from(value, "base64").toString("binary") });
  return { elements, getCalls: () => calls, broadcast: () => onBroadcast(), tick: () => timer(), advance: value => { now += value; } };
}

const summary = {
  estado: "ok", consultado_en: "2026-11-12T10:00:00Z", primera_medicion: "2026-01-01T00:00:00", ultima_medicion: "2026-07-28T07:45:00",
  mediciones: 1000000, dispositivos: 50, ubicaciones: 50, generacion_no_nula: 1000000, consumo_no_nulo: 1000000, bateria_no_nula: 1000000,
  generacion_promedio_wh: 80.54, consumo_promedio_wh: 72.75, bateria_promedio_pct: 53.43
};

test("rechaza claves secretas antiguas", () => {
  const payload = Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url");
  const dashboard = runDashboard(`eyJ.${payload}.signature`, {});
  assert.match(dashboard.elements.get("live-status").textContent, /Configuración inválida/);
  assert.equal(dashboard.getCalls(), 0);
});

test("actualiza valores, denominadores y limita consultas a cinco minutos", async () => {
  const dashboard = runDashboard("sb_publishable_test", { data: summary, error: null });
  await new Promise(setImmediate);
  assert.equal(dashboard.elements.get("metric-generacion").textContent, "80,54 Wh");
  assert.match(dashboard.elements.get("energy-denominators").textContent, /1\.000\.000/);
  assert.equal(dashboard.elements.get("bar-consumo").style.width, "72.75%");
  dashboard.broadcast();
  assert.equal(dashboard.getCalls(), 1);
  dashboard.advance(300000);
  dashboard.tick();
  await new Promise(setImmediate);
  assert.equal(dashboard.getCalls(), 2);
});

test("mantiene el estado histórico cuando falla la consulta", async () => {
  const dashboard = runDashboard("sb_publishable_test", { data: null, error: new Error("error") });
  await new Promise(setImmediate);
  assert.match(dashboard.elements.get("live-status").textContent, /No se pudo actualizar/);
  assert.equal(dashboard.elements.get("metric-mediciones"), undefined);
});