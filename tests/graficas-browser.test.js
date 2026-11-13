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

test("la página crea comparativos exactos y retroalimentación desde los agregados de BD", { skip: !chromium || !fs.existsSync(browserPath) }, async () => {
  const browser = await chromium.launch({ executablePath: browserPath, headless: true });
  try {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(pathToFileURL(path.resolve("index.html")).href);
    const logoLoaded = await page.locator('img[src="Logo.png"]').evaluateAll(images => Promise.all(images.map(image => image.decode().then(() => image.naturalWidth > 0))));
    assert.deepEqual(logoLoaded, [true]);
    await page.locator("#knowledge-list details").first().waitFor({ state: "visible" });
    assert.equal(await page.locator("#knowledge-list details").count(), 5);
    assert.equal(await page.locator("#decision-list article").count(), 4);
    assert.equal(await page.locator("#database-charts .comparison-chart").count(), 6);
    assert.match(await page.locator("#dashboard").innerText(), /1\.003\.209/);
    assert.match(await page.locator("#database-charts").innerText(), /4\.505\.812,10 Wh/);
    assert.match(await page.locator("#database-charts").innerText(), /205\.296\.044,80 Wh/);
    assert.match(await page.locator("#database-charts").innerText(), /119,38 Wh\/medición/);
    assert.match(await page.locator("#dashboard").innerText(), /249\.956/);
    assert.match(await page.locator("#decision-list").innerText(), /1,24 %/);
    assert.doesNotMatch(await page.locator("#dashboard").innerText(), /CAPTURA ESTÁTICA \/ POWER BI/i);
    assert.doesNotMatch(await page.locator("main").innerText(), /Supabase/i);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => ({
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        elements: Array.from(document.querySelectorAll("body *")).filter(element => !element.closest(".sidebar") && element.getBoundingClientRect().right > innerWidth + 1).slice(0, 8).map(element => `${element.tagName}.${element.className}`)
      }));
      assert.equal(overflow.scrollWidth > overflow.width, false, JSON.stringify(overflow));
    }
    await context.close();
  } finally { await browser.close(); }
});