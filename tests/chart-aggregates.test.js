const test = require("node:test");
const assert = require("node:assert/strict");
const { groupAverage, groupCounts, combined } = require("../chart-aggregates.js");

const groups = [
  { mes: "2026-01-01", condicion: "Soleado", franja: "Día", mediciones: 100, consumo_no_nulo: 100, consumo_suma: 1000, generacion_no_nula: 80, generacion_suma: 1600 },
  { mes: "2026-01-01", condicion: "Soleado", franja: "Noche", mediciones: 10, consumo_no_nulo: 10, consumo_suma: 300, generacion_no_nula: 10, generacion_suma: 0 },
  { mes: "2026-02-01", condicion: "Soleado", franja: "Día", mediciones: 50, consumo_no_nulo: 50, consumo_suma: 3000, generacion_no_nula: 50, generacion_suma: 500 }
];

test("pondera los promedios por el número de valores no nulos", () => {
  const result = groupAverage(groups, "mes", "consumo");
  assert.equal(result[0].count, 110);
  assert.equal(result[0].value, 1300 / 110);
  assert.equal(result[1].value, 60);
});

test("el análisis conjunto respeta simultáneamente mes, clima y franja", () => {
  const result = combined(groups, "2026-01-01");
  assert.equal(result.length, 2);
  assert.equal(result.find(item => item.label === "Soleado / Día").value, 10);
  assert.equal(result.find(item => item.label === "Soleado / Noche").count, 10);
});

test("cuenta mediciones en lugar de grupos", () => {
  assert.equal(groupCounts(groups, "condicion")[0].value, 160);
});

test("mantiene la hora cero y ordena las horas numéricamente", () => {
  const result = groupAverage([
    { hora: 10, generacion_no_nula: 1, generacion_suma: 100 },
    { hora: 0, generacion_no_nula: 1, generacion_suma: 5 },
    { hora: 2, generacion_no_nula: 1, generacion_suma: 20 }
  ], "hora", "generacion");
  assert.deepEqual(result.map(item => item.label), [0, 2, 10]);
});

test("rechaza conteos inválidos", () => {
  assert.throws(() => groupAverage([{ mes: "2026-01-01", consumo_no_nulo: -1, consumo_suma: 1 }], "mes", "consumo"));
});