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
const chartPath = path.join(dependencies, "chart.js", "dist", "chart.umd.js");
const browserPath = "C:/Program Files/Google/Chrome/Application/chrome.exe";

test("gráficas renderizan y el filtro combina variables en escritorio y móvil", { skip: !chromium || !fs.existsSync(chartPath) || !fs.existsSync(browserPath) }, async () => {
  const browser = await chromium.launch({ executablePath: browserPath, headless: true });
  const fakeData = {
    estado: "ok", calculado_en: "2026-11-13T04:00:00Z", primera_medicion: "2026-01-01T00:00:00", ultima_medicion: "2026-02-01T00:00:00", mediciones_total: 160, grupos_omitidos: 0, mediciones_omitidas: 0, tramos_omitidos: 0,
    histogramas: ["consumo", "generacion", "bateria"].flatMap(variable => [{ variable, tramo: 0, mediciones: 60 }, { variable, tramo: 1, mediciones: 100 }]),
    grupos: [
      { mes: "2026-01-01", condicion: "Soleado", franja: "Día", mediciones: 100, consumo_no_nulo: 100, consumo_suma: 1000, generacion_no_nula: 100, generacion_suma: 2000 },
      { mes: "2026-01-01", condicion: "Soleado", franja: "Noche", mediciones: 10, consumo_no_nulo: 10, consumo_suma: 300, generacion_no_nula: 10, generacion_suma: 10 },
      { mes: "2026-02-01", condicion: "Nublado", franja: "Día", mediciones: 50, consumo_no_nulo: 50, consumo_suma: 3000, generacion_no_nula: 50, generacion_suma: 500 }
    ]
  };
  try {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    await context.route("**/chart.js@4.4.8/auto/+esm", route => route.fulfill({ contentType: "text/javascript", headers: { "Access-Control-Allow-Origin": "*" }, body: fs.readFileSync(chartPath, "utf8") + "\nexport default globalThis.Chart;" }));
    await context.route("**/rest/v1/rpc/pgc_graficas_publicas_2026", route => {
      const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "apikey,content-type", "Access-Control-Allow-Methods": "POST,OPTIONS" };
      return route.request().method() === "OPTIONS" ? route.fulfill({ status: 204, headers }) : route.fulfill({ json: fakeData, headers });
    });
    const page = await context.newPage();
    await page.goto(pathToFileURL(path.resolve("index.html")).href);
    await page.locator("#exploration-content").waitFor({ state: "visible", timeout: 15000 });
    assert.equal(await page.locator(".exploration-chart canvas").count(), 9);
    assert.equal(await page.locator("#knowledge-list details").count(), 5);
    assert.equal(await page.locator("#decision-list article").count(), 2);
    for (const id of ["grafica-distribucion-generacion", "grafica-distribucion-bateria", "grafica-generacion-clima", "grafica-consumo-franja", "grafica-conjunto"]) {
      assert.equal(await page.locator(`#${id}`).count(), 1);
    }
    await page.selectOption("#grafico-mes", "2026-01-01");
    const rows = await page.locator("#combined-chart tbody tr").allTextContents();
    assert.equal(rows.length, 2);
    assert.ok(rows.some(row => row.includes("Soleado / Día") && row.includes("10")));
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => ({
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        elements: Array.from(document.querySelectorAll("body *")).filter(element => !element.closest(".sidebar") && element.getBoundingClientRect().right > innerWidth + 1).slice(0, 8).map(element => `${element.tagName}.${element.className}`)
      }));
      assert.equal(overflow.scrollWidth > overflow.width, false, JSON.stringify(overflow));
      const pixels = await page.locator(".exploration-chart canvas").first().evaluate(canvas => {
        const values = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
        let visible = 0;
        for (let index = 3; index < values.length; index += 4) if (values[index]) visible += 1;
        return visible;
      });
      assert.ok(pixels > 100);
      await page.locator("#exploration-content").screenshot({ path: path.join(os.tmpdir(), `pgc-exploracion-${width}.png`) });
    }
    await context.close();
  } finally { await browser.close(); }
});