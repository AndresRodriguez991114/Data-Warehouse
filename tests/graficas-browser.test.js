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
  version: 2,
  calculado_en: "2026-07-28T12:00:00Z",
  primera_medicion: "2026-01-01T00:00:00",
  ultima_medicion: "2026-02-28T23:00:00",
  mediciones_total: 71,
  totales: {
    mediciones: 71,
    dispositivos: 2,
    ubicaciones: 2,
    consumo_no_nulo: 71,
    generacion_no_nula: 51,
    eolica_no_nula: 20,
    bateria_no_nula: 51,
    irradiancia_no_nula: 51,
    viento_no_nulo: 20,
    consumo_promedio_wh: 15,
    generacion_promedio_wh: 10,
    eolica_promedio_wh: 12,
    bateria_promedio_pct: 53,
    irradiancia_promedio_wm2: 450,
    viento_promedio_ms: 6.5,
    consumo_suma: 765,
    generacion_suma: 510,
    eolica_suma: 240,
    solar_inicio: "2026-01-01T00:00:00",
    solar_fin: "2026-01-31T23:00:00",
    eolica_inicio: "2026-01-15T00:00:00",
    eolica_fin: "2026-02-28T23:00:00"
  },
  periodo_comun: { inicio: "2026-01-15T00:00:00", fin: "2026-01-31T23:00:00", mediciones: 40, generacion_suma: 300, eolica_suma: 150, consumo_suma: 600 },
  grupos: [
    { mes: "2026-01-01", condicion: "Soleado", franja: "Día", mediciones: 30, consumo_no_nulo: 30, consumo_suma: 300, generacion_no_nula: 30, generacion_suma: 360, eolica_no_nula: 10, eolica_suma: 50 },
    { mes: "2026-01-01", condicion: "Nublado", franja: "Noche", mediciones: 21, consumo_no_nulo: 21, consumo_suma: 465, generacion_no_nula: 21, generacion_suma: 150, eolica_no_nula: 10, eolica_suma: 190 },
    { mes: "2026-02-01", condicion: "Nublado", franja: "Noche", mediciones: 10, consumo_no_nulo: 0, consumo_suma: null, generacion_no_nula: 0, generacion_suma: null, eolica_no_nula: 10, eolica_suma: 100 }
  ],
  horas: [
    { hora: 0, mediciones: 30, consumo_no_nulo: 30, consumo_suma: 450, generacion_no_nula: 30, generacion_suma: 0, eolica_no_nula: 15, eolica_suma: 150 },
    { hora: 12, mediciones: 41, consumo_no_nulo: 41, consumo_suma: 315, generacion_no_nula: 21, generacion_suma: 510, eolica_no_nula: 5, eolica_suma: 10 }
  ],
  ubicaciones: [
    { dimension: "estrato", categoria: "2", mediciones: 25, consumo_no_nulo: 25, consumo_suma: 450 },
    { dimension: "estrato", categoria: "3", mediciones: 26, consumo_no_nulo: 26, consumo_suma: 315 }
  ],
  recurso: [
    { variable: "irradiancia", tramo: 4, mediciones: 51, generacion_no_nula: 51, generacion_suma: 510 },
    { variable: "viento", tramo: 6, mediciones: 20, generacion_no_nula: 20, generacion_suma: 240 }
  ]
};

test("la página presenta gráficas y decisiones desde Base de datos y sondea cada cinco minutos", { skip: !chromium || !fs.existsSync(browserPath) }, async () => {
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
    assert.equal(await page.locator("#exploration-charts .exploration-chart").count(), 7);
    assert.equal(await page.locator("#featured-charts-container .exploration-chart").count(), 1);
    assert.equal(await page.locator("#combined-chart .exploration-chart").count(), 1);
    assert.match(await page.locator("#metric-mediciones").innerText(), /71/);
    assert.match(await page.locator("#metric-generacion").innerText(), /10 Wh\/medición/);
    assert.match(await page.locator("#metric-eolica").innerText(), /12 Wh\/medición/);
    assert.match(await page.locator("#metric-viento").innerText(), /6,5 m\/s/);
    assert.match(await page.locator("#exploration-status").innerText(), /cada 5 minutos/);
    assert.match(await page.locator("#exploration-period").innerText(), /eólica: 2026-01-15 a 2026-02-28/);
    assert.match(await page.locator("#grafica-consumo-ubicacion").innerText(), /Consumo promedio por estrato/);
    assert.match(await page.locator("#featured-charts-container").innerText(), /Cobertura renovable[\s\S]*75/i);
    // Cobertura del período común: (300 + 150) / 600.
    assert.match(await page.locator("#decision-list").innerText(), /75 %/);
    // A las 00:00 la eólica (10 Wh) supera a la solar (0 Wh).
    assert.match(await page.locator("#knowledge-list").textContent(), /supera a la solar en 1 de 24 horas: 00:00/);
    assert.match(await page.locator("#grafico-mes").innerText(), /enero de 2026[\s\S]*febrero de 2026/);
    const mainText = await page.locator("main").innerText();
    assert.doesNotMatch(mainText, /Mediciones por condición climática|Distribución del consumo|Ahorro/i);
    assert.deepEqual(await page.evaluate(() => window.__intervals), [300000]);
    const reducedCharts = await page.evaluate(() => window.__charts);
    assert.ok(reducedCharts.every(chart => chart.options.animation === false));
    const climate = reducedCharts.find(chart => chart.data.labels.includes("Soleado") && chart.data.labels.length === 2);
    assert.deepEqual(climate.data.datasets.map(dataset => [dataset.label, dataset.borderColor]), [["Solar", "#176d52"], ["Eólica", "#5479b7"]]);
    assert.deepEqual(climate.data.datasets[0].data, [150 / 21, 12]);
    assert.deepEqual(climate.data.datasets[1].data, [14.5, 5]);
    const profile = reducedCharts[0];
    assert.deepEqual(profile.data.labels, ["00:00", "12:00"]);
    assert.deepEqual(profile.data.datasets.map(dataset => dataset.label), ["Solar", "Eólica", "Consumo"]);
    const mix = reducedCharts.find(chart => chart.type === "doughnut");
    assert.deepEqual(mix.data.datasets[0].data, [300, 150]);
    const monthly = reducedCharts.find(chart => chart.type === "line" && chart.data.labels.length === 2 && chart.data.labels[0] !== "00:00");
    assert.deepEqual(monthly.data.datasets[0].data, [10, null]);
    assert.deepEqual(monthly.data.datasets[1].data, [12, 10]);
    assert.ok(reducedCharts.some(chart => chart.data.labels.includes("400–500 W/m²")));
    assert.ok(reducedCharts.some(chart => chart.data.labels.includes("6–7 m/s")));
    const location = reducedCharts.find(chart => chart.data.labels.includes("2"));
    assert.deepEqual(location.data.datasets[0].data, [18, 315 / 26]);
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

test("explica cómo actualizar Base de datos cuando la caché devuelve el formato anterior", { skip: !chromium || !fs.existsSync(browserPath) }, async () => {
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
