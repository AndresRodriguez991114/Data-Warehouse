(() => {
  const config = window.PROJECT_DATA;
  const api = window.ChartAggregates;
  const status = document.getElementById("exploration-status");
  const content = document.getElementById("exploration-content");
  const monthSelect = document.getElementById("grafico-mes");
  const chartsContainer = document.getElementById("exploration-charts");
  const knowledgeList = document.getElementById("knowledge-list");
  const decisionList = document.getElementById("decision-list");
  if (!status || !content || !monthSelect || !chartsContainer || !knowledgeList || !decisionList) return;

  function isPublicKey(key) {
    if (key.startsWith("sb_publishable_")) return true;
    try {
      const payload = key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(payload)).role === "anon";
    } catch (error) {
      return false;
    }
  }

  let url;
  try {
    if (!config || !config.supabaseUrl || !config.supabasePublishableKey) throw new Error("Falta la URL o la clave publicable.");
    url = new URL(config.supabaseUrl);
  } catch (error) {
    status.textContent = "Configura la URL de Supabase y una clave publicable válida.";
    return;
  }
  if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co") || !isPublicKey(config.supabasePublishableKey)) {
    status.textContent = "La conexión requiere HTTPS y una clave publicable de Supabase; nunca uses una clave secreta.";
    return;
  }

  const POLL_INTERVAL_MS = 300000;
  const number = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });
  const whole = new Intl.NumberFormat("es-CO");
  const charts = new Map();
  let combinedChart = null;
  let currentData = null;
  let ChartClass = null;
  let loading = false;
  let lastRequest = 0;
  const text = (tag, value) => {
    const element = document.createElement(tag);
    element.textContent = value === null || value === undefined ? "" : String(value);
    return element;
  };

  const chartClassification = {
    comparacion: {
      category: "Comparativos operativos",
      description: "Contrasta condiciones climáticas, franjas y categorías de ubicación. Solo se publican grupos con al menos 10 mediciones.",
      specs: [
        ["Mediciones por condición climática", "Cantidad de registros agregados por condición.", "groupCounts", "condicion", "bar", "Mediciones", "#b36d43"],
        ["Generación promedio por clima", "Promedio ponderado por valores no nulos.", "groupAverage", ["condicion", "generacion"], "bar", "Wh por medición", "#176d52", "grafica-generacion-clima"],
        ["Consumo promedio por franja", "Promedio ponderado por valores no nulos.", "groupAverage", ["franja", "consumo"], "bar", "Wh por medición", "#ca6d39", "grafica-consumo-franja"],
        ["Consumo total por ubicación", "Usa estrato si está disponible; de lo contrario, barrio. Los grupos pequeños se omiten.", "locationSum", "consumo", "bar", "Wh acumulados", "#ca6d39", "grafica-consumo-ubicacion"],
        ["Generación total por ubicación", "Usa estrato si está disponible; de lo contrario, barrio. Los grupos pequeños se omiten.", "locationSum", "generacion", "bar", "Wh acumulados", "#176d52", "grafica-generacion-ubicacion"]
      ]
    },
    distribucion: {
      category: "Distribución y frecuencia",
      description: "Muestra la frecuencia por intervalos de consumo, generación y nivel de batería. Los grupos con menos de 10 mediciones se omiten.",
      specs: [
        ["Distribución del consumo", "Intervalos de 10 Wh · límite superior excluido.", "histogram", "consumo", "bar", "Mediciones", "#ca6d39", "grafica-distribucion-consumo"],
        ["Distribución de la generación", "Intervalos de 10 Wh · límite superior excluido.", "histogram", "generacion", "bar", "Mediciones", "#176d52", "grafica-distribucion-generacion"],
        ["Distribución del nivel de batería", "Intervalos de 20 % · el intervalo final incluye 100 %.", "histogram", "bateria", "bar", "Mediciones", "#668f61", "grafica-distribucion-bateria"]
      ]
    },
    temporal: {
      category: "Tendencias de tiempo",
      description: "Resume promedios por mes y energía total por hora del día en todo el período disponible.",
      specs: [
        ["Generación promedio por mes", "Promedio ponderado por mediciones no nulas.", "groupAverage", ["mes", "generacion"], "line", "Wh por medición", "#176d52"],
        ["Consumo promedio por mes", "Promedio ponderado por mediciones no nulas.", "groupAverage", ["mes", "consumo"], "line", "Wh por medición", "#ca6d39"],
        ["Generación total por hora del día", "Wh acumulados por hora (0–23), sumados en todo el período.", "hourSum", "generacion", "line", "Wh acumulados", "#176d52", "grafica-generacion-hora"],
        ["Consumo total por hora del día", "Wh acumulados por hora (0–23), sumados en todo el período.", "hourSum", "consumo", "line", "Wh acumulados", "#ca6d39", "grafica-consumo-hora"]
      ]
    }
  };

  function histogram(data, variable) {
    const battery = variable === "bateria";
    const total = Number(data.mediciones_total);
    return data.histogramas.filter(item => item.variable === variable).map(item => {
      const step = battery ? 20 : 10;
      const upper = battery ? 5 : 20;
      const unit = battery ? "%" : "Wh";
      const bucket = item.tramo === null ? null : Number(item.tramo);
      const count = Number(item.mediciones);
      if (!Number.isSafeInteger(count) || count < 0 || (bucket !== null && !Number.isInteger(bucket))) throw new Error("Histograma inválido");
      let label = "Sin dato";
      if (bucket !== null) {
        if (bucket < 0) label = `< 0 ${unit}`;
        else if (bucket >= upper) label = battery ? "> 100 %" : `≥ 200 ${unit}`;
        else label = `${bucket * step} a ${bucket * step + step} ${unit}${battery && bucket === 4 ? " (incluye 100)" : ""}`;
      }
      return { label, value: count, count, percent: Number.isSafeInteger(total) && total > 0 ? count / total * 100 : null };
    });
  }

  function locationLabel(data) {
    const dimensions = [...new Set(data.ubicaciones.map(item => item.dimension))];
    if (dimensions.length === 1 && dimensions[0] === "estrato") return "estrato";
    if (dimensions.length === 1 && dimensions[0] === "barrio") return "barrio";
    return "categoría de ubicación";
  }

  function hourSums(data, variable) {
    const sumField = `${variable}_suma`;
    return data.horas.map(item => {
      const hour = Number(item.hora);
      const count = Number(item.mediciones);
      const value = item[sumField] === null ? null : Number(item[sumField]);
      if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isSafeInteger(count) || count < 0 || (value !== null && !Number.isFinite(value))) {
        throw new Error("Agregado horario inválido");
      }
      return { label: String(hour).padStart(2, "0"), value, count };
    }).sort((left, right) => left.label.localeCompare(right.label));
  }

  function locationSums(data, variable) {
    const sumField = `${variable}_suma`;
    return data.ubicaciones.map(item => {
      const count = Number(item.mediciones);
      const value = item[sumField] === null ? null : Number(item[sumField]);
      if (typeof item.categoria !== "string" || !Number.isSafeInteger(count) || count < 0 || (value !== null && !Number.isFinite(value))) {
        throw new Error("Agregado por ubicación inválido");
      }
      return { label: item.categoria, value, count };
    });
  }

  function rowsFor(data, groups, source, key) {
    if (source === "histogram") return histogram(data, key);
    if (source === "groupCounts") return api.groupCounts(groups, key);
    if (source === "groupAverage") {
      const [groupKey, variable] = key;
      return api.groupAverage(groups, groupKey, variable);
    }
    if (source === "hourSum") return hourSums(data, key);
    if (source === "locationSum") return locationSums(data, key);
    return [];
  }

  function draw(container, title, description, rows, type, unit, color, id) {
    const figure = document.createElement("figure");
    figure.className = "exploration-chart";
    if (id) figure.id = id;
    const caption = document.createElement("figcaption");
    caption.append(text("h3", title), text("p", description));
    const wrapper = document.createElement("div");
    wrapper.className = "chart-canvas";
    const canvas = document.createElement("canvas");
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", title);
    wrapper.append(canvas);

    const details = document.createElement("details");
    details.className = "chart-data";
    details.append(text("summary", "Ver datos de la gráfica"));
    const table = document.createElement("table");
    const header = document.createElement("tr");
    const showPercent = rows.some(row => Number.isFinite(row.percent));
    header.append(text("th", "Grupo"), text("th", unit), text("th", "Mediciones"));
    if (showPercent) header.append(text("th", "% del total"));
    const head = document.createElement("thead");
    head.append(header);
    const body = document.createElement("tbody");
    rows.forEach(row => {
      const line = document.createElement("tr");
      line.append(text("td", row.label), text("td", row.value === null ? "Sin datos" : number.format(row.value)), text("td", whole.format(row.count)));
      if (showPercent) line.append(text("td", Number.isFinite(row.percent) ? `${number.format(row.percent)} %` : "Sin datos"));
      body.append(line);
    });
    table.append(head, body);
    details.append(table);
    figure.append(caption, wrapper, details);
    container.append(figure);

    return new ChartClass(canvas, {
      type,
      data: { labels: rows.map(row => row.label), datasets: [{ label: unit, data: rows.map(row => row.value), backgroundColor: color, borderColor: color, borderWidth: 2, pointRadius: 3, tension: 0.1 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { afterLabel: context => {
            const row = rows[context.dataIndex];
            return `Mediciones: ${whole.format(row.count)}${Number.isFinite(row.percent) ? ` (${number.format(row.percent)} % del total)` : ""}`;
          } } }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: unit } },
          x: { ticks: { maxRotation: 55, minRotation: 0 } }
        }
      }
    });
  }

  function renderCombined() {
    if (!currentData || !ChartClass) return;
    const container = document.getElementById("combined-chart");
    if (combinedChart) combinedChart.destroy();
    container.replaceChildren();
    const month = monthSelect.value;
    const rows = api.combined(currentData.grupos, month);
    combinedChart = draw(container, "Consumo por clima y franja", `Wh por medición · mes: ${month} · combinación calculada conjuntamente`, rows, "bar", "Wh por medición", "#176d52", "grafica-conjunto");
  }

  function renderCategory(categoryKey, categoryData, container, data) {
    const categorySection = document.createElement("section");
    categorySection.className = "chart-category";
    categorySection.id = `categoria-${categoryKey}`;
    const categoryHeader = document.createElement("div");
    categoryHeader.className = "category-header";
    categoryHeader.append(text("h3", categoryData.category), text("p", categoryData.description));
    categorySection.append(categoryHeader);
    const chartsGrid = document.createElement("div");
    chartsGrid.className = "exploration-charts";

    categoryData.specs.forEach(spec => {
      const [title, description, source, key, chartType, unit, color, id] = spec;
      const chartTitle = source === "locationSum" ? `${key === "consumo" ? "Consumo" : "Generación"} total por ${locationLabel(data)}` : title;
      const rows = rowsFor(data, data.grupos, source, key);
      charts.set(id || `${categoryKey}-${title}`, draw(chartsGrid, chartTitle, description, rows, chartType, unit, color, id));
    });

    categorySection.append(chartsGrid);
    container.append(categorySection);
  }

  function displayMetric(id, value, unit) {
    const numeric = value === null || value === undefined ? null : Number(value);
    document.getElementById(id).textContent = Number.isFinite(numeric) ? `${number.format(numeric)}${unit ? ` ${unit}` : ""}` : "Sin datos";
  }

  function renderMetrics(totals) {
    const counts = ["mediciones", "dispositivos", "ubicaciones", "generacion_no_nula", "consumo_no_nulo", "bateria_no_nula"].map(key => Number(totals[key]));
    if (counts.some(value => !Number.isSafeInteger(value) || value < 0)) throw new Error("Los conteos de Supabase no son válidos.");
    document.getElementById("metric-mediciones").textContent = whole.format(counts[0]);
    document.getElementById("metric-dispositivos").textContent = whole.format(counts[1]);
    document.getElementById("metric-ubicaciones").textContent = whole.format(counts[2]);
    displayMetric("metric-generacion", totals.generacion_promedio_wh, "Wh/medición");
    displayMetric("metric-consumo", totals.consumo_promedio_wh, "Wh/medición");
    displayMetric("metric-bateria", totals.bateria_promedio_pct, "%");
  }

  function maxBy(rows, key) {
    return rows.filter(row => Number.isFinite(row.value)).sort((left, right) => right.value - left.value)[0] || null;
  }

  function minBy(rows) {
    return rows.filter(row => Number.isFinite(row.value)).sort((left, right) => left.value - right.value)[0] || null;
  }

  function addFields(container, fields) {
    const list = document.createElement("dl");
    fields.forEach(([label, value]) => {
      const row = document.createElement("div");
      row.append(text("dt", label), text("dd", value));
      list.append(row);
    });
    container.append(list);
  }

  function renderKnowledge(items) {
    knowledgeList.replaceChildren();
    items.forEach((item, index) => {
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      summary.append(text("span", String(index + 1).padStart(2, "0"), "item-number"), text("strong", item.title), text("span", "+", "expand-icon"));
      details.append(summary);
      addFields(details, item.fields);
      knowledgeList.append(details);
    });
  }

  function renderDecisions(items) {
    decisionList.replaceChildren();
    items.forEach((item, index) => {
      const article = document.createElement("article");
      article.append(text("span", `ACCIÓN / ${String(index + 1).padStart(2, "0")}`, "section-number"), text("h3", item.title));
      addFields(article, item.fields);
      decisionList.append(article);
    });
  }

  function renderFeedback(data) {
    const totals = data.totales;
    const generated = Number(totals.generacion_suma);
    const consumed = Number(totals.consumo_suma);
    const coverage = Number.isFinite(generated) && Number.isFinite(consumed) && consumed > 0 ? generated / consumed * 100 : null;
    const byPeriod = api.groupAverage(data.grupos, "franja", "consumo").filter(item => item.count > 0);
    const byClimate = api.groupAverage(data.grupos, "condicion", "generacion").filter(item => item.count > 0);
    const peakPeriod = maxBy(byPeriod);
    const lowPeriod = minBy(byPeriod);
    const bestClimate = maxBy(byClimate);
    const lowClimate = minBy(byClimate);
    const peakGenerationHour = maxBy(hourSums(data, "generacion"));
    const peakConsumptionHour = maxBy(hourSums(data, "consumo"));
    const topLocation = maxBy(locationSums(data, "consumo"));
    const date = value => value ? String(value).replace("T", " ").slice(0, 19) : "Sin fecha";

    const knowledge = [{
      title: "Cobertura del período consultado",
      fields: [
        ["Pregunta", "¿Qué volumen y cobertura energética registra Supabase?"],
        ["Período", `${date(data.primera_medicion)} a ${date(data.ultima_medicion)}`],
        ["Registros", `${whole.format(Number(totals.mediciones))} mediciones`],
        ["Generación y consumo", `${number.format(generated)} Wh y ${number.format(consumed)} Wh`],
        ["Hallazgo", coverage === null ? "No se puede calcular la cobertura porque no hay consumo válido." : `La generación equivale al ${number.format(coverage)} % del consumo agregado.`],
        ["Limitación", "Es un resumen descriptivo del conjunto disponible; no establece causalidad ni representa por sí solo una vivienda real."]
      ]
    }];

    if (peakGenerationHour || peakConsumptionHour) {
      knowledge.push({
        title: "Distribución por hora del día",
        fields: [
          ["Generación máxima", peakGenerationHour ? `${peakGenerationHour.label}:00 · ${number.format(peakGenerationHour.value)} Wh en el período` : "Sin datos suficientes"],
          ["Consumo máximo", peakConsumptionHour ? `${peakConsumptionHour.label}:00 · ${number.format(peakConsumptionHour.value)} Wh en el período` : "Sin datos suficientes"],
          ["Procedimiento", "Suma la energía por hora local registrada en fecha_hora; no es un promedio diario."],
          ["Limitación", "Las diferencias dependen de la cantidad de días y mediciones disponibles en cada hora."]
        ]
      });
    }

    if (bestClimate || lowClimate) {
      knowledge.push({
        title: "Generación y condición climática",
        fields: [
          ["Mayor promedio", bestClimate ? `${bestClimate.label}: ${number.format(bestClimate.value)} Wh por medición (n=${whole.format(bestClimate.count)})` : "Sin datos suficientes"],
          ["Menor promedio", lowClimate ? `${lowClimate.label}: ${number.format(lowClimate.value)} Wh por medición (n=${whole.format(lowClimate.count)})` : "Sin datos suficientes"],
          ["Interpretación", "Comparación descriptiva de promedios ponderados; no demuestra que el clima sea la única causa de las diferencias."]
        ]
      });
    }

    if (peakPeriod || topLocation) {
      knowledge.push({
        title: "Consumo por franja y ubicación",
        fields: [
          ["Mayor promedio por franja", peakPeriod ? `${peakPeriod.label}: ${number.format(peakPeriod.value)} Wh por medición (n=${whole.format(peakPeriod.count)})` : "Sin datos suficientes"],
          [`Mayor consumo por ${locationLabel(data)}`, topLocation ? `${topLocation.label}: ${number.format(topLocation.value)} Wh (n=${whole.format(topLocation.count)})` : "Sin datos suficientes"],
          ["Protección de datos", "Los grupos con menos de 10 mediciones no se publican."]
        ]
      });
    }
    renderKnowledge(knowledge);

    const decisions = [{
      title: "Revisar el balance de generación y consumo",
      fields: [
        ["Acción propuesta", "Usar el balance como señal para revisar la demanda, el almacenamiento y la cobertura del sistema."],
        ["Respaldo", coverage === null ? "No hay un denominador de consumo válido." : `${number.format(generated)} Wh generados frente a ${number.format(consumed)} Wh consumidos; cobertura ${number.format(coverage)} %.`],
        ["Seguimiento", "Comparar períodos equivalentes y revisar también el número de mediciones válidas."],
        ["Limitación", "El balance agregado no dimensiona equipos ni identifica la causa de la diferencia."]
      ]
    }];

    if (peakPeriod) {
      decisions.push({
        title: "Investigar la franja de mayor consumo promedio",
        fields: [
          ["Acción propuesta", `Revisar la operación y la carga asociada a «${peakPeriod.label}» antes de cambiar horarios o equipos.`],
          ["Respaldo", `${number.format(peakPeriod.value)} Wh por medición, con ${whole.format(peakPeriod.count)} valores no nulos.`],
          ["Seguimiento", "Contrastar la franja con el detalle horario y con períodos equivalentes."],
          ["Limitación", "La asociación no demuestra qué dispositivo produjo el consumo."]
        ]
      });
    }

    if (lowClimate && bestClimate && lowClimate.label !== bestClimate.label) {
      decisions.push({
        title: "Considerar la condición climática en el monitoreo",
        fields: [
          ["Acción propuesta", "Revisar la disponibilidad de generación en las condiciones de menor promedio y valorar el respaldo requerido."],
          ["Respaldo", `${lowClimate.label}: ${number.format(lowClimate.value)} Wh por medición; ${bestClimate.label}: ${number.format(bestClimate.value)} Wh por medición.`],
          ["Seguimiento", "Comparar cantidades de mediciones y promedios de clima en cada actualización."],
          ["Limitación", "La comparación es descriptiva y no prueba causalidad."]
        ]
      });
    }

    if (topLocation && data.ubicaciones.length > 1) {
      decisions.push({
        title: `Priorizar el análisis de ${locationLabel(data)}`,
        fields: [
          ["Acción propuesta", "Comparar el consumo entre categorías y verificar que cada grupo tenga cobertura suficiente antes de asignar recursos."],
          ["Respaldo", `Mayor suma registrada: ${topLocation.label}, ${number.format(topLocation.value)} Wh.`],
          ["Seguimiento", "Revisar la evolución de estas categorías en períodos equivalentes."],
          ["Limitación", "No se publican grupos con menos de 10 mediciones; las categorías no identifican hogares."]
        ]
      });
    }
    renderDecisions(decisions);
  }

  function render(data) {
    if (!data || data.estado !== "ok" || !Array.isArray(data.grupos) || !Array.isArray(data.histogramas) || !Array.isArray(data.horas) || !Array.isArray(data.ubicaciones) || !data.totales) {
      throw new Error("La caché de análisis no contiene los agregados requeridos.");
    }
    currentData = data;
    renderMetrics(data.totales);
    content.hidden = false;
    charts.forEach(chart => chart.destroy());
    charts.clear();
    if (combinedChart) combinedChart.destroy();
    combinedChart = null;
    chartsContainer.replaceChildren();

    Object.entries(chartClassification).forEach(([categoryKey, categoryData]) => {
      renderCategory(categoryKey, categoryData, chartsContainer, data);
    });

    const months = [...new Set(data.grupos.map(group => group.mes || "Sin dato"))].sort();
    const selected = monthSelect.value;
    monthSelect.replaceChildren();
    months.forEach(month => {
      const option = text("option", month);
      option.value = month;
      monthSelect.append(option);
    });
    if (months.includes(selected)) monthSelect.value = selected;
    else if (months.length) monthSelect.value = months[months.length - 1];
    if (months.length) renderCombined();
    else document.getElementById("combined-chart").replaceChildren(text("p", "No hay datos mensuales suficientes para esta comparación."));

    renderFeedback(data);
    const date = value => value ? String(value).replace("T", " ").slice(0, 19) : "Sin fecha";
    document.getElementById("exploration-period").textContent = `Período: ${date(data.primera_medicion)} a ${date(data.ultima_medicion)} · ${whole.format(Number(data.mediciones_total))} mediciones · los gráficos omiten grupos con menos de 10 registros.`;
    const calculated = new Date(data.calculado_en);
    status.textContent = Number.isFinite(calculated.getTime())
      ? `Datos agregados por Supabase: ${calculated.toLocaleString("es-CO", { timeZone: "America/Bogota" })}. La caché se actualiza cada 5 minutos.`
      : "Hora de cálculo no disponible; la caché se actualiza cada 5 minutos.";
  }

  async function refresh() {
    if (loading || document.hidden || Date.now() - lastRequest < POLL_INTERVAL_MS) return;
    loading = true;
    lastRequest = Date.now();
    try {
      const response = await fetch(`${url.origin}/rest/v1/rpc/pgc_graficas_publicas_2026`, {
        method: "POST",
        headers: { apikey: config.supabasePublishableKey, "Content-Type": "application/json" },
        body: "{}"
      });
      if (!response.ok) throw new Error(`Supabase respondió ${response.status}.`);
      const data = await response.json();
      if (data.estado !== "ok") throw new Error("La caché aún no ha sido calculada.");
      if (!ChartClass) {
        const chartModule = await import("https://cdn.jsdelivr.net/npm/chart.js@4.4.8/auto/+esm");
        ChartClass = chartModule.default;
      }
      render(data);
    } catch (error) {
      status.textContent = currentData
        ? "No se pudo actualizar; se conservan los últimos datos cargados."
        : "No se pudieron cargar las gráficas. Verifica las funciones de Supabase, la caché y la clave publicable.";
    } finally {
      loading = false;
    }
  }

  monthSelect.addEventListener("change", renderCombined);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refresh();
  });
  status.textContent = "Conectando con Supabase…";
  refresh();
  window.setInterval(refresh, POLL_INTERVAL_MS);
})();
