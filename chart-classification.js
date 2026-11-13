/**
 * Clasificación de gráficas por tipo
 * Las gráficas se organizan según la forma en que presentan y organizan los datos
 */

export const chartClassification = {
  // 1. Gráficas básicas y de comparación
  // Usadas para comparar valores entre categorías o grupos
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

  // 2. Gráficas de distribución y frecuencia
  // Muestran cómo se distribuyen los datos dentro de rangos o intervalos
  distribucion: {
    type: "distribution",
    category: "Gráficas de distribución y frecuencia",
    description: "Muestran la distribución de datos en intervalos o rangos para identificar patrones de frecuencia",
    charts: [
      {
        id: "grafica-distribucion-consumo",
        title: "Distribución del consumo",
        description: "Intervalos de 10 Wh · límite superior excluido · número de mediciones",
        chartType: "bar",
        unit: "Mediciones",
        color: "#ca6d39",
        dataSource: "histogram",
        variable: "consumo"
      },
      {
        id: "grafica-distribucion-generacion",
        title: "Distribución de la generación",
        description: "Intervalos de 10 Wh · límite superior excluido · número de mediciones",
        chartType: "bar",
        unit: "Mediciones",
        color: "#176d52",
        dataSource: "histogram",
        variable: "generacion"
      },
      {
        id: "grafica-distribucion-bateria",
        title: "Distribución del nivel de batería",
        description: "Intervalos de 20 % · límite superior excluido, salvo 100 %",
        chartType: "bar",
        unit: "Mediciones",
        color: "#668f61",
        dataSource: "histogram",
        variable: "bateria"
      }
    ]
  },

  // 3. Gráficas de relación y composición
  // Muestran cómo las partes se relacionan con el todo y la evolución en el tiempo
  relacion: {
    type: "relationship",
    category: "Gráficas de relación y composición",
    description: "Muestran tendencias, evolución temporal y combinaciones de variables para identificar relaciones",
    charts: [
      {
        id: "grafica-generacion-mes",
        title: "Generación promedio por mes",
        description: "Promedio ponderado por mediciones no nulas · análisis temporal",
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
        description: "Promedio ponderado por mediciones no nulas · análisis temporal",
        chartType: "line",
        unit: "Wh por medición",
        color: "#ca6d39",
        dataSource: "groupAverage",
        dataKey: "mes",
        variable: "consumo"
      },
      {
        id: "grafica-conjunto",
        title: "Consumo por clima y franja",
        description: "Wh por medición · análisis combinado de variables",
        chartType: "bar",
        unit: "Wh por medición",
        color: "#176d52",
        dataSource: "combined",
        isInteractive: true
      }
    ]
  },

  // 4. Gráficas especializadas
  // Tipos particulares para análisis específicos
  especializada: {
    type: "specialized",
    category: "Gráficas especializadas",
    description: "Gráficas especializadas para análisis técnicos específicos del sistema energético",
    charts: [
      {
        id: "grafica-balance-energetico",
        title: "Balance energético general",
        description: "Relación entre generación total y consumo total del período",
        chartType: "pie",
        unit: "Wh",
        color: ["#176d52", "#ca6d39"],
        note: "Calculado a partir de agregados de la base de datos"
      }
    ]
  }
};

/**
 * Obtiene todas las gráficas ordenadas por categoría
 */
export function getAllChartsByCategory() {
  return [
    chartClassification.comparacion,
    chartClassification.distribucion,
    chartClassification.relacion,
    chartClassification.especializada
  ];
}

/**
 * Obtiene una gráfica específica por ID
 */
export function getChartById(chartId) {
  for (const category of Object.values(chartClassification)) {
    const chart = category.charts.find(c => c.id === chartId);
    if (chart) return { ...chart, category: category.category };
  }
  return null;
}

/**
 * Obtiene todas las gráficas sin categorizar
 */
export function getAllCharts() {
  const allCharts = [];
  for (const category of Object.values(chartClassification)) {
    allCharts.push(...category.charts);
  }
  return allCharts;
}
