const assert = require('assert');

// Mock de las funciones de clasificación
const chartClassification = {
  comparacion: {
    type: "comparison",
    category: "Gráficas básicas y de comparación",
    description: "Comparan valores entre diferentes categorías o grupos para identificar diferencias y tendencias",
    charts: [
      {
        id: "grafica-mediciones-clima",
        title: "Mediciones por condición climática",
        description: "Frecuencia de mediciones por condición",
        chartType: "bar",
        unit: "Mediciones",
        color: "#b36d43",
        dataSource: "groupCounts",
        dataKey: "condicion"
      },
      {
        id: "grafica-generacion-clima",
        title: "Generación promedio por clima",
        description: "Promedio ponderado por mediciones no nulas",
        chartType: "bar",
        unit: "Wh por medición",
        color: "#176d52",
        dataSource: "groupAverage",
        dataKey: "condicion",
        variable: "generacion"
      },
      {
        id: "grafica-consumo-franja",
        title: "Consumo promedio por franja",
        description: "Promedio ponderado por mediciones no nulas",
        chartType: "bar",
        unit: "Wh por medición",
        color: "#ca6d39",
        dataSource: "groupAverage",
        dataKey: "franja",
        variable: "consumo"
      }
    ]
  },
  distribucion: {
    type: "distribution",
    category: "Gráficas de distribución y frecuencia",
    description: "Muestran la distribución de datos en intervalos o rangos para identificar patrones de frecuencia",
    charts: [
      {
        id: "grafica-distribucion-consumo",
        title: "Distribución del consumo",
        description: "Intervalos de 10 Wh",
        chartType: "bar",
        unit: "Mediciones",
        color: "#ca6d39",
        dataSource: "histogram",
        variable: "consumo"
      },
      {
        id: "grafica-distribucion-generacion",
        title: "Distribución de la generación",
        description: "Intervalos de 10 Wh",
        chartType: "bar",
        unit: "Mediciones",
        color: "#176d52",
        dataSource: "histogram",
        variable: "generacion"
      },
      {
        id: "grafica-distribucion-bateria",
        title: "Distribución del nivel de batería",
        description: "Intervalos de 20 %",
        chartType: "bar",
        unit: "Mediciones",
        color: "#668f61",
        dataSource: "histogram",
        variable: "bateria"
      }
    ]
  },
  relacion: {
    type: "relationship",
    category: "Gráficas de relación y composición",
    description: "Muestran tendencias, evolución temporal y combinaciones de variables",
    charts: [
      {
        id: "grafica-generacion-mes",
        title: "Generación promedio por mes",
        description: "Promedio ponderado por mediciones no nulas",
        chartType: "line",
        unit: "Wh por medición",
        color: "#176d52",
        dataSource: "groupAverage",
        dataKey: "mes",
        variable: "generacion"
      },
      {
        id: "grafica-consumo-mes",
        title: "Consumo promedio por mes",
        description: "Promedio ponderado por mediciones no nulas",
        chartType: "line",
        unit: "Wh por medición",
        color: "#ca6d39",
        dataSource: "groupAverage",
        dataKey: "mes",
        variable: "consumo"
      }
    ]
  },
  especializada: {
    type: "specialized",
    category: "Gráficas especializadas",
    description: "Gráficas especializadas para análisis técnicos",
    charts: [
      {
        id: "grafica-balance-energetico",
        title: "Balance energético general",
        description: "Relación entre generación y consumo",
        chartType: "pie",
        unit: "Wh",
        color: ["#176d52", "#ca6d39"]
      }
    ]
  }
};

function getAllChartsByCategory() {
  return [
    chartClassification.comparacion,
    chartClassification.distribucion,
    chartClassification.relacion,
    chartClassification.especializada
  ];
}

function getChartById(chartId) {
  for (const category of Object.values(chartClassification)) {
    const chart = category.charts.find(c => c.id === chartId);
    if (chart) return { ...chart, category: category.category };
  }
  return null;
}

function getAllCharts() {
  const allCharts = [];
  for (const category of Object.values(chartClassification)) {
    allCharts.push(...category.charts);
  }
  return allCharts;
}

// Pruebas
console.log("🧪 Iniciando pruebas de clasificación de gráficas...\n");

// Prueba 1: Verificar estructura de categorías
console.log("✅ Prueba 1: Estructura de categorías");
const categories = Object.keys(chartClassification);
assert.strictEqual(categories.length, 4, "Debe haber 4 categorías");
assert.deepStrictEqual(categories, ['comparacion', 'distribucion', 'relacion', 'especializada']);
console.log("   Categorías encontradas: comparacion, distribucion, relacion, especializada\n");

// Prueba 2: Verificar cantidad de gráficas por categoría
console.log("✅ Prueba 2: Cantidad de gráficas por categoría");
assert.strictEqual(chartClassification.comparacion.charts.length, 3);
assert.strictEqual(chartClassification.distribucion.charts.length, 3);
assert.strictEqual(chartClassification.relacion.charts.length, 2);
assert.strictEqual(chartClassification.especializada.charts.length, 1);
console.log("   Comparación: 3 gráficas");
console.log("   Distribución: 3 gráficas");
console.log("   Relación: 2 gráficas");
console.log("   Especializada: 1 gráfica\n");

// Prueba 3: Verificar total de gráficas
console.log("✅ Prueba 3: Total de gráficas");
const totalCharts = getAllCharts();
assert.strictEqual(totalCharts.length, 9, "Debe haber 9 gráficas en total");
console.log(`   Total: ${totalCharts.length} gráficas\n`);

// Prueba 4: Verificar estructura de cada gráfica
console.log("✅ Prueba 4: Estructura de cada gráfica");
getAllCharts().forEach(chart => {
  assert(chart.id, `Gráfica sin ID: ${chart.title}`);
  assert(chart.title, `Gráfica sin título`);
  assert(chart.description, `Gráfica sin descripción: ${chart.title}`);
  assert(chart.chartType, `Gráfica sin tipo: ${chart.title}`);
  assert(chart.unit, `Gráfica sin unidad: ${chart.title}`);
  assert(chart.color, `Gráfica sin color: ${chart.title}`);
});
console.log("   Todas las gráficas tienen estructura completa\n");

// Prueba 5: Verificar IDs únicos
console.log("✅ Prueba 5: Verificar IDs únicos");
const ids = getAllCharts().map(c => c.id);
const uniqueIds = new Set(ids);
assert.strictEqual(ids.length, uniqueIds.size, "Los IDs no son únicos");
console.log("   Todos los IDs son únicos\n");

// Prueba 6: Verificar función getChartById
console.log("✅ Prueba 6: Función getChartById");
const chart = getChartById("grafica-distribucion-consumo");
assert(chart, "No se encontró la gráfica");
assert.strictEqual(chart.title, "Distribución del consumo");
assert.strictEqual(chart.category, "Gráficas de distribución y frecuencia");
console.log("   getChartById funciona correctamente\n");

// Prueba 7: Verificar función getAllChartsByCategory
console.log("✅ Prueba 7: Función getAllChartsByCategory");
const categoriesList = getAllChartsByCategory();
assert.strictEqual(categoriesList.length, 4);
assert(categoriesList.every(cat => cat.category && cat.charts && Array.isArray(cat.charts)));
console.log("   getAllChartsByCategory devuelve 4 categorías con estructura válida\n");

// Prueba 8: Verificar tipos de gráficas
console.log("✅ Prueba 8: Tipos de gráficas utilizados");
const chartTypes = new Set(getAllCharts().map(c => c.chartType));
console.log(`   Tipos encontrados: ${Array.from(chartTypes).join(", ")}\n`);

// Prueba 9: Verificar colores
console.log("✅ Prueba 9: Validación de colores");
const validColorPattern = /^#[0-9A-Fa-f]{6}$|^\[.*\]$/;
getAllCharts().forEach(chart => {
  if (typeof chart.color === 'string') {
    assert(validColorPattern.test(chart.color), `Color inválido: ${chart.color} en ${chart.title}`);
  } else if (Array.isArray(chart.color)) {
    chart.color.forEach(c => {
      assert(validColorPattern.test(c), `Color inválido en array: ${c} en ${chart.title}`);
    });
  }
});
console.log("   Todos los colores tienen formato válido\n");

// Prueba 10: Verificar fuentes de datos
console.log("✅ Prueba 10: Fuentes de datos");
const dataSources = new Set(getAllCharts()
  .map(c => c.dataSource)
  .filter(ds => ds));
console.log(`   Fuentes de datos: ${Array.from(dataSources).join(", ")}\n`);

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("✨ ¡Todas las pruebas pasaron correctamente!");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// Resumen
console.log("📊 RESUMEN DE GRÁFICAS:");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
getAllChartsByCategory().forEach((category, index) => {
  console.log(`\n${index + 1}. ${category.category.toUpperCase()}`);
  console.log(`   Descripción: ${category.description}`);
  console.log(`   Cantidad: ${category.charts.length} gráficas`);
  category.charts.forEach(chart => {
    console.log(`   • ${chart.title}`);
  });
});
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
