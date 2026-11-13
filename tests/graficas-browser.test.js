const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const dependencies = path.join(os.tmpdir(), "pgc-browser-check", "node_modules");
let chromium;
try { chromium = require(path.join(dependencies, "playwright-core")).chromium; }
catch (error) { chromium = null; }
const browserPath = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const graphData = {
  estado: "ok",
  calculado_en: "2026-07-28T12:00:00Z",
  primera_medicion: "2026-01-01T00:00:00",
  ultima_medicion: "2026-01-31T23:59:00",
  mediciones_total: 51,
  totales: {
    mediciones: 51,
    dispositivos: 2,
    ubicaciones: 2,
    generacion_no_nula: 51,
    consumo_no_nulo: 51,
    bateria_no_nula: 51,
    generacion_promedio_wh: 10,
    consumo_promedio_wh: 15,
    bateria_promedio_pct: 53,
    generacion_suma: 510,
    consumo_suma: 765
  },
  grupos: [
    { mes: "2026-01-01", condicion: "Soleado", franja: "Día", mediciones: 30, consumo_no_nulo: 30, consumo_suma: 300, generacion_no_nula: 30, generacion_suma: 360 },
    { mes: "2026-01-01", condicion: "Nublado", franja: "Noche", mediciones: 21, consumo_no_nulo: 21, consumo_suma: 465, generacion_no_nula: 21, generacion_suma: 150 }
  ],
  horas: [
    { hora: 0, mediciones: 51, consumo_no_nulo: 51, consumo_suma: 765, generacion_no_nula: 51, generacion_suma: 510 }
  ],
  ubicaciones: [
    { dimension: "estrato", categoria: "2", mediciones: 25, consumo_no_nulo: 25, consumo_suma: 450, generacion_no_nula: 25, generacion_suma: 255 },
    { dimension: "estrato", categoria: "3", mediciones: 26, consumo_no_nulo: 26, consumo_suma: 315, generacion_no_nula: 26, generacion_suma: 255 }
  ],
  histogramas: [
    { variable: "consumo", tramo: 1, mediciones: 51 },
    { variable: "generacion", tramo: 2, mediciones: 51 },
    { variable: "bateria", tramo: 2, mediciones: 51 }
  ]
};

test("la página presenta gráficas y decisiones desde Base de datosy sondea cada cinco minutos", { skip: !chromium || !fs.existsSync(browserPath) }, async () => {
  const browser = await chromium.launch({ executablePath: browserPath, headless: true });
  try {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__intervals = [];
      const setInterval = window.setInterval.bind(window);
      window.setInterval = (callback, delay, ...args) => {
        window.__intervals.push(delay);
        return setInterval(callback, delay, ...args);
      };
    });
    await page.route("https://zlvqxkezmlswzfozlhwy.supabase.co/rest/v1/rpc/pgc_graficas_publicas_2026", route => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(graphData)
    }));
    await page.route("https://cdn.jsdelivr.net/npm/chart.js@4.4.8/auto/+esm", route => route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "export default class Chart { constructor(canvas, config) { (window.__charts ||= []).push(config); } reset() { window.__replays = (window.__replays || 0) + 1; } update() {} destroy() {} }"
    }));
    await page.goto(pathToFileURL(path.resolve("index.html")).href);
    const logoLoaded = await page.locator('img[src="Logo.png"]').evaluateAll(images => Promise.all(images.map(image => image.decode().then(() => image.naturalWidth > 0))));
    assert.deepEqual(logoLoaded, [true]);
    await page.locator("#knowledge-list details").first().waitFor({ state: "visible" });
    assert.equal(await page.locator("#knowledge-list details").count(), 4);
    assert.equal(await page.locator("#decision-list article").count(), 4);
    assert.equal(await page.locator("#exploration-charts .exploration-chart").count(), 12);
    assert.equal(await page.locator("#combined-chart .exploration-chart").count(), 1);
    assert.match(await page.locator("#metric-mediciones").innerText(), /51/);
    assert.match(await page.locator("#metric-generacion").innerText(), /10 Wh\/medición/);
    assert.match(await page.locator("#exploration-status").innerText(), /cada 5 minutos/);
    assert.match(await page.locator("#grafica-generacion-hora").textContent(), /00/);
    assert.match(await page.locator("#grafica-consumo-ubicacion").innerText(), /Consumo total por estrato/);
    assert.match(await page.locator("#decision-list").innerText(), /66,67 %/);
    assert.deepEqual(await page.evaluate(() => window.__intervals), [300000]);
    const reducedCharts = await page.evaluate(() => window.__charts);
    assert.ok(reducedCharts.every(chart => chart.options.animation === false));
    const climate = reducedCharts.find(chart => chart.data.labels.includes("Soleado"));
    assert.equal(new Set(climate.data.datasets[0].backgroundColor).size, 2);
    assert.deepEqual(climate.data.datasets[0].data, [21, 30]);
    assert.doesNotMatch(await page.locator("main").innerText(), /SQL Server verificados en SSMS|CAPTURA ESTÁTICA \/ POWER BI/i);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => ({
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        elements: Array.from(document.querySelectorAll("body *")).filter(element => !element.closest(".sidebar") && element.getBoundingClientRect().right > innerWidth + 1).slice(0, 8).map(element => `${element.tagName}.${element.className}`)
      }));
      assert.equal(overflow.scrollWidth > overflow.width, false, JSON.stringify(overflow));
    }
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.reload();
    await page.locator("#knowledge-list details").first().waitFor({ state: "visible" });
    const animation = await page.evaluate(() => window.__charts[0].options.animation);
    assert.equal(animation.duration, 900);
    assert.equal(animation.easing, "easeOutQuart");
    await page.locator("#exploration-charts .exploration-chart").first().scrollIntoViewIfNeeded();
    await page.waitForFunction(() => window.__replays > 0);
    await context.close();
  } finally { await browser.close(); }
});

test("explica cómo actualizar Base de datoscuando la caché devuelve el formato anterior", { skip: !chromium || !fs.existsSync(browserPath) }, async () => {
  const browser = await chromium.launch({ executablePath: browserPath, headless: true });
  try {
    const page = await browser.newPage();
    await page.route("https://zlvqxkezmlswzfozlhwy.supabase.co/rest/v1/rpc/pgc_graficas_publicas_2026", route => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        estado: "ok",
        calculado_en: "2026-07-28T12:00:00Z",
        grupos: [],
        histogramas: [],
        mediciones_total: 0
      })
    }));
    await page.goto(pathToFileURL(path.resolve("index.html")).href);
    await page.getByText(/formato anterior/).waitFor({ state: "visible" });
    assert.match(await page.locator("#exploration-status").innerText(), /SUPABASE-GRAFICAS\.sql/);
    assert.match(await page.locator("#exploration-status").innerText(), /pgc_actualizar_graficas_energia_2026/);
    assert.equal(await page.locator("#metric-mediciones").innerText(), "No disponible");
    assert.match(await page.locator("#exploration-period").innerText(), /actualizar la caché/);
    assert.equal(await page.locator("#exploration-charts .exploration-chart").count(), 0);
  } finally { await browser.close(); }
});
