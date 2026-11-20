(() => {
  const config = window.PROJECT_DATA;
  const api = window.ChartAggregates;
  const status = document.getElementById("exploration-status");
  const content = document.getElementById("exploration-content");
  const monthSelect = document.getElementById("grafico-mes");
  const chartsContainer = document.getElementById("exploration-charts");
  const knowledgeList = document.getElementById("knowledge-list");
  const decisionList = document.getElementById("decision-list");
  const featuredContainer = document.getElementById("featured-charts-container");
  if (!status || !content || !monthSelect || !chartsContainer) return;
  if (!api) {
    status.textContent = "No se pudo inicializar el análisis de gráficas.";
    return;
  }

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
    status.textContent = "Configura la URL de Base de datos y una clave publicable válida.";
    return;
  }
  if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co") || !isPublicKey(config.supabasePublishableKey)) {
    status.textContent = "La conexión requiere HTTPS y una clave publicable de Supabase; nunca uses una clave secreta.";
    return;
  }

  const POLL_INTERVAL_MS = 300000;
  const number = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });
  const whole = new Intl.NumberFormat("es-CO");
  // Un color fijo por fuente o variable en todo el dashboard.
  const COLORS = { solar: "#176d52", eolica: "#5479b7", consumo: "#ca6d39" };
  const SOURCES = {
    solar: { label: "Solar", variable: "generacion", color: COLORS.solar },
    eolica: { label: "Eólica", variable: "eolica", color: COLORS.eolica },
    consumo: { label: "Consumo", variable: "consumo", color: COLORS.consumo }
  };
  const METRIC_IDS = ["metric-mediciones", "metric-dispositivos", "metric-ubicaciones", "metric-generacion", "metric-irradiancia", "metric-bateria", "metric-eolica", "metric-viento", "metric-consumo"];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const charts = new Map();
  let combinedChart = null;
  let currentData = null;
  let ChartClass = null;
  let loading = false;
  let lastRequest = 0;
  const text = (tag, value, className) => {
    const element = document.createElement(tag);
    element.textContent = value === null || value === undefined ? "" : String(value);
    if (className) element.className = className;
    return element;
  };
  const cacheSchemaError = "La base de datos está devolviendo una caché con el formato anterior. En SQL Editor ejecuta sql/supabase/SUPABASE-GRAFICAS.sql y luego SELECT public.pgc_actualizar_graficas_energia_2026();";

  function validateCache(data) {
    if (!data || data.estado !== "ok" || !Array.isArray(data.grupos) || !Array.isArray(data.horas) || !Array.isArray(data.ubicaciones) || !Array.isArray(data.recurso) || !data.totales || !data.periodo_comun) {
      throw new Error(cacheSchemaError);
    }
  }

  const date = value => value ? String(value).replace("T", " ").slice(0, 16) : "sin fecha";
  const day = value => value ? String(value).slice(0, 10) : "sin fecha";

  function monthLabel(value, short) {
    if (!/^\d{4}-\d{2}/.test(String(value))) return String(value);
    const parsed = new Date(`${String(value).slice(0, 7)}-01T00:00:00Z`);
    return parsed.toLocaleDateString("es-CO", { month: short ? "short" : "long", year: "numeric", timeZone: "UTC" });
  }

  const hourLabel = hour => `${String(hour).padStart(2, "0")}:00`;

  // Agrupa horas consecutivas: [0, 1, 2, 20, 21] → "00:00–02:00, 20:00–21:00".
  function hourRanges(hours) {
    const ranges = [];
    hours.forEach(hour => {
      const last = ranges[ranges.length - 1];
      if (last && hour === last[1] + 1) last[1] = hour;
      else ranges.push([hour, hour]);
    });
    return ranges.map(([start, end]) => start === end ? hourLabel(start) : `${hourLabel(start)}–${hourLabel(end)}`).join(", ");
  }

  // Promedio por medición de cada fuente, alineado por categoría.
  function sourceSeries(groups, key, sourceKeys, format) {
    return sourceKeys.map(sourceKey => {
      const source = SOURCES[sourceKey];
      const rows = api.groupAverage(groups, key, source.variable).map(row => ({ ...row, label: format ? format(row.label) : row.label }));
      return { label: source.label, color: source.color, rows };
    });
  }

  function resourceRows(data, variable) {
    const rows = data.recurso.filter(item => item.variable === variable);
    const irradiance = variable === "irradiancia";
    const last = irradiance ? 12 : 20;
    return api.groupAverage(rows, "tramo", "generacion").map(row => {
      const bucket = Number(row.label);
      if (!Number.isInteger(bucket) || bucket < 0) throw new Error("Agregado de recurso inválido");
      const label = irradiance
        ? (bucket >= last ? "≥ 1.200 W/m²" : `${whole.format(bucket * 100)}–${whole.format(bucket * 100 + 100)} W/m²`)
        : (bucket >= last ? "≥ 20 m/s" : `${bucket}–${bucket + 1} m/s`);
      return { ...row, label };
    });
  }

  function sharedPeriod(data) {
    const common = data.periodo_comun;
    const solar = Number(common.generacion_suma);
    const wind = Number(common.eolica_suma);
    const consumed = Number(common.consumo_suma);
    const count = Number(common.mediciones);
    if (!common.inicio || !common.fin || !Number.isSafeInteger(count) || count <= 0) return null;
    if (!Number.isFinite(solar) || !Number.isFinite(wind)) throw new Error("Las sumas del período común no son válidas.");
    const generated = solar + wind;
    return {
      start: common.inicio,
      end: common.fin,
      count,
      solar,
      wind,
      consumed: Number.isFinite(consumed) ? consumed : null,
      coverage: Number.isFinite(consumed) && consumed > 0 ? generated / consumed * 100 : null,
      solarCoverage: Number.isFinite(consumed) && consumed > 0 ? solar / consumed * 100 : null,
      windCoverage: Number.isFinite(consumed) && consumed > 0 ? wind / consumed * 100 : null,
      solarShare: generated > 0 ? solar / generated * 100 : null,
      windShare: generated > 0 ? wind / generated * 100 : null
    };
  }

  // Dibuja una gráfica con una o varias series que comparten categorías.
  function draw(container, spec) {
    const { title, description, series, type, unit, id } = spec;
    const labels = [];
    series.forEach(item => item.rows.forEach(row => { if (!labels.includes(row.label)) labels.push(row.label); }));
    const lookups = series.map(item => new Map(item.rows.map(row => [row.label, row])));

    const figure = document.createElement("figure");
    figure.className = "exploration-chart";
    figure.style.setProperty("--chart-accent", series[0].color);
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
    const scroll = document.createElement("div");
    scroll.className = "chart-data-scroll";
    const table = document.createElement("table");
    const header = document.createElement("tr");
    const multiple = series.length > 1;
    const showPercent = series.some(item => item.rows.some(row => Number.isFinite(row.percent)));
    header.append(text("th", "Grupo"));
    series.forEach(item => header.append(text("th", multiple ? `${item.label} (${unit})` : unit), text("th", multiple ? `n ${item.label.toLowerCase()}` : "Mediciones")));
    if (showPercent) header.append(text("th", "% del total"));
    const head = document.createElement("thead");
    head.append(header);
    const body = document.createElement("tbody");
    labels.forEach(label => {
      const line = document.createElement("tr");
      line.append(text("td", label));
      lookups.forEach(lookup => {
        const row = lookup.get(label);
        line.append(
          text("td", !row || row.value === null ? "Sin datos" : number.format(row.value)),
          text("td", !row || row.count === null || row.count === undefined ? "—" : whole.format(row.count))
        );
      });
      if (showPercent) {
        const row = lookups[0].get(label);
        line.append(text("td", row && Number.isFinite(row.percent) ? `${number.format(row.percent)} %` : "Sin datos"));
      }
      body.append(line);
    });
    table.append(head, body);
    scroll.append(table);
    details.append(scroll);
    figure.append(caption, wrapper, details);
    container.append(figure);

    const circular = type === "doughnut";
    const datasets = series.map((item, index) => ({
      label: item.label,
      data: labels.map(label => {
        const row = lookups[index].get(label);
        return row && Number.isFinite(row.value) ? row.value : null;
      }),
      backgroundColor: circular ? spec.sliceColors : (type === "line" ? `${item.color}26` : item.color),
      borderColor: circular ? "#fff" : item.color,
      borderWidth: 2,
      borderRadius: type === "bar" ? 6 : 0,
      pointRadius: 3,
      pointHoverRadius: 6,
      tension: 0.3,
      spanGaps: false
    }));

    const chart = new ChartClass(canvas, {
      type,
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: multiple ? { mode: "index", intersect: false } : undefined,
        animation: reducedMotion.matches ? false : { duration: 900, easing: "easeOutQuart" },
        plugins: {
          legend: { display: multiple || circular, position: "top", labels: { usePointStyle: true, padding: 14 } },
          tooltip: { callbacks: { afterLabel: context => {
            const row = lookups[context.datasetIndex].get(labels[context.dataIndex]);
            if (!row) return "";
            const parts = [];
            if (Number.isFinite(row.count)) parts.push(`Mediciones: ${whole.format(row.count)}`);
            if (Number.isFinite(row.percent)) parts.push(`${number.format(row.percent)} % del total`);
            return parts.join(" · ");
          } } }
        },
        scales: circular ? {} : {
          y: { beginAtZero: true, title: { display: true, text: unit } },
          x: { title: { display: Boolean(spec.xTitle), text: spec.xTitle || "" }, ticks: { maxRotation: 55, minRotation: 0 } }
        }
      }
    });
    if (reducedMotion.matches || !("IntersectionObserver" in window)) return chart;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        if (!reducedMotion.matches) {
          chart.reset();
          chart.update();
        }
      }
    }, { threshold: 0.15 });
    observer.observe(figure);
    return {
      destroy() {
        observer.disconnect();
        chart.destroy();
      }
    };
  }

  function chartSpecs(data) {
    const shared = sharedPeriod(data);
    const sharedText = shared ? `${day(shared.start)} a ${day(shared.end)}` : null;
    return [
      {
        key: "complementariedad",
        category: "Solar y eólica",
        description: "Compara las dos fuentes con la misma unidad (Wh por medición) para ver cuándo una compensa a la otra. Solo se publican grupos con al menos 10 mediciones.",
        charts: [
          { id: "grafica-generacion-clima", title: "Generación promedio por clima", description: "Wh por medición de cada fuente según la condición climática.", type: "bar", unit: "Wh por medición", series: sourceSeries(data.grupos, "condicion", ["solar", "eolica"]) },
          { id: "grafica-energia-franja", title: "Generación y consumo por franja", description: "Wh por medición de cada fuente y del consumo en cada franja del día.", type: "bar", unit: "Wh por medición", series: sourceSeries(data.grupos, "franja", ["solar", "eolica", "consumo"]) },
          { id: "grafica-generacion-mes", title: "Generación promedio por mes", description: "Wh por medición. Un mes sin línea indica que esa fuente no tiene mediciones en él.", type: "line", unit: "Wh por medición", series: sourceSeries(data.grupos, "mes", ["solar", "eolica"], value => monthLabel(value, true)) },
          shared ? {
            id: "grafica-mezcla",
            title: "Mezcla de generación",
            description: `Participación de cada fuente en la energía generada entre ${sharedText}, el período con datos de ambas.`,
            type: "doughnut",
            unit: "Wh generados",
            sliceColors: [COLORS.solar, COLORS.eolica],
            series: [{ label: "Generación", color: COLORS.solar, rows: [
              { label: "Solar", value: shared.solar, count: null, percent: shared.solarShare },
              { label: "Eólica", value: shared.wind, count: null, percent: shared.windShare }
            ] }]
          } : null
        ].filter(Boolean)
      },
      {
        key: "recurso",
        category: "Recurso y generación",
        description: "Relaciona cada fuente con el recurso que la produce: irradiancia para la solar y velocidad del viento para la eólica.",
        charts: [
          { id: "grafica-solar-irradiancia", title: "Generación solar según irradiancia", description: "Wh por medición en intervalos de 100 W/m².", type: "bar", unit: "Wh por medición", xTitle: "Irradiancia", series: [{ label: "Solar", color: COLORS.solar, rows: resourceRows(data, "irradiancia") }] },
          { id: "grafica-eolica-viento", title: "Generación eólica según velocidad del viento", description: "Wh por medición en intervalos de 1 m/s.", type: "bar", unit: "Wh por medición", xTitle: "Velocidad del viento", series: [{ label: "Eólica", color: COLORS.eolica, rows: resourceRows(data, "viento") }] }
        ]
      },
      {
        key: "consumo",
        category: "Consumo",
        description: "Demanda que deben cubrir las dos fuentes.",
        charts: [
          { id: "grafica-consumo-ubicacion", title: `Consumo promedio por ${locationLabel(data)}`, description: "Promedio por medición, para comparar categorías con distinto número de viviendas. Usa estrato si está disponible; de lo contrario, barrio.", type: "bar", unit: "Wh por medición", series: [{ label: "Consumo", color: COLORS.consumo, rows: api.groupAverage(data.ubicaciones, "categoria", "consumo") }] }
        ]
      }
    ];
  }

  function locationLabel(data) {
    const dimensions = [...new Set(data.ubicaciones.map(item => item.dimension))];
    if (dimensions.length === 1 && dimensions[0] === "estrato") return "estrato";
    if (dimensions.length === 1 && dimensions[0] === "barrio") return "barrio";
    return "categoría de ubicación";
  }

  function renderCombined() {
    if (!currentData || !ChartClass) return;
    const container = document.getElementById("combined-chart");
    if (combinedChart) combinedChart.destroy();
    container.replaceChildren();
    const month = monthSelect.value;
    const series = ["solar", "eolica", "consumo"].map(key => ({
      label: SOURCES[key].label,
      color: SOURCES[key].color,
      rows: api.combined(currentData.grupos, month, SOURCES[key].variable)
    }));
    combinedChart = draw(container, {
      id: "grafica-conjunto",
      title: "Energía por clima y franja",
      description: `Wh por medición · ${monthLabel(month)} · cada barra combina una condición climática y una franja del día.`,
      type: "bar",
      unit: "Wh por medición",
      series
    });
  }

  function renderCategory(category, container) {
    const section = document.createElement("section");
    section.className = "chart-category";
    section.id = `categoria-${category.key}`;
    const header = document.createElement("div");
    header.className = "category-header";
    header.append(text("h3", category.category), text("p", category.description));
    section.append(header);
    const grid = document.createElement("div");
    grid.className = "exploration-charts";
    category.charts.forEach(spec => charts.set(spec.id, draw(grid, spec)));
    section.append(grid);
    container.append(section);
  }

  function displayMetric(id, value, unit) {
    const numeric = value === null || value === undefined ? null : Number(value);
    document.getElementById(id).textContent = Number.isFinite(numeric) ? `${number.format(numeric)}${unit ? ` ${unit}` : ""}` : "Sin datos";
  }

  function renderMetrics(totals) {
    const metricElements = METRIC_IDS.map(id => document.getElementById(id));
    if (metricElements.every(element => !element)) return;
    if (metricElements.some(element => !element)) throw new Error("Faltan elementos de indicadores en la página.");
    const counts = ["mediciones", "dispositivos", "ubicaciones"].map(key => Number(totals[key]));
    if (counts.some(value => !Number.isSafeInteger(value) || value < 0)) throw new Error("Los conteos de la base de datos no son válidos.");
    document.getElementById("metric-mediciones").textContent = whole.format(counts[0]);
    document.getElementById("metric-dispositivos").textContent = whole.format(counts[1]);
    document.getElementById("metric-ubicaciones").textContent = whole.format(counts[2]);
    displayMetric("metric-generacion", totals.generacion_promedio_wh, "Wh/medición");
    displayMetric("metric-irradiancia", totals.irradiancia_promedio_wm2, "W/m²");
    displayMetric("metric-bateria", totals.bateria_promedio_pct, "%");
    displayMetric("metric-eolica", totals.eolica_promedio_wh, "Wh/medición");
    displayMetric("metric-viento", totals.viento_promedio_ms, "m/s");
    displayMetric("metric-consumo", totals.consumo_promedio_wh, "Wh/medición");
  }

  function maxBy(rows) {
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
    if (!knowledgeList) return;
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
    if (!decisionList) return;
    decisionList.replaceChildren();
    items.forEach((item, index) => {
      const article = document.createElement("article");
      article.append(text("span", `ACCIÓN / ${String(index + 1).padStart(2, "0")}`, "section-number"), text("h3", item.title));
      addFields(article, item.fields);
      decisionList.append(article);
    });
  }

  const wh = (value, suffix = "Wh por medición") => `${number.format(value)} ${suffix}`;

  function renderFeedback(data) {
    const totals = data.totales;
    const shared = sharedPeriod(data);
    const solarHours = api.groupAverage(data.horas, "hora", "generacion");
    const windHours = api.groupAverage(data.horas, "hora", "eolica");
    const windByHour = new Map(windHours.map(row => [row.label, row]));
    const windOverSolar = solarHours
      .filter(row => Number.isFinite(row.value) && windByHour.has(row.label) && Number.isFinite(windByHour.get(row.label).value) && windByHour.get(row.label).value > row.value)
      .map(row => Number(row.label));
    const solarClimate = api.groupAverage(data.grupos, "condicion", "generacion").filter(item => item.count > 0);
    const windClimate = new Map(api.groupAverage(data.grupos, "condicion", "eolica").filter(item => item.count > 0).map(row => [row.label, row]));
    const consumptionByPeriod = api.groupAverage(data.grupos, "franja", "consumo").filter(item => item.count > 0);
    const peakSolarHour = maxBy(solarHours);
    const peakWindHour = maxBy(windHours);
    const bestSolarClimate = maxBy(solarClimate);
    const lowSolarClimate = minBy(solarClimate);
    const bestWindClimate = maxBy([...windClimate.values()]);
    const peakPeriod = maxBy(consumptionByPeriod);
    const topLocation = maxBy(api.groupAverage(data.ubicaciones, "categoria", "consumo"));
    const location = locationLabel(data);
    const percent = value => value === null ? "sin consumo válido" : `${number.format(value)} %`;

    const knowledge = [{
      title: "Cobertura de las dos fuentes",
      fields: [
        ["Pregunta", "¿Qué parte del consumo cubren juntas la energía solar y la eólica?"],
        ["Datos solares", `${date(totals.solar_inicio)} a ${date(totals.solar_fin)} · ${whole.format(Number(totals.generacion_no_nula))} mediciones`],
        ["Datos eólicos", `${date(totals.eolica_inicio)} a ${date(totals.eolica_fin)} · ${whole.format(Number(totals.eolica_no_nula))} mediciones`],
        ["Período común", shared ? `${date(shared.start)} a ${date(shared.end)} · ${whole.format(shared.count)} mediciones` : "Las dos fuentes no tienen fechas en común."],
        ["Hallazgo", shared ? `En el período común, la generación renovable cubre el ${percent(shared.coverage)} del consumo: ${percent(shared.solarCoverage)} la solar y ${percent(shared.windCoverage)} la eólica.` : "No se puede comparar la cobertura sin un período común."],
        ["Limitación", "Los totales dependen de cuántas instalaciones de cada tipo hay en los datos; para comparar el rendimiento de una instalación se usan los promedios por medición."]
      ]
    }];

    if (peakSolarHour || peakWindHour) {
      knowledge.push({
        title: "Complementariedad por hora del día",
        fields: [
          ["Pico solar", peakSolarHour ? `${hourLabel(peakSolarHour.label)} · ${wh(peakSolarHour.value)}` : "Sin datos suficientes"],
          ["Pico eólico", peakWindHour ? `${hourLabel(peakWindHour.label)} · ${wh(peakWindHour.value)}` : "Sin datos suficientes"],
          ["Hallazgo", windOverSolar.length ? `La eólica supera a la solar en ${windOverSolar.length} de 24 horas: ${hourRanges(windOverSolar)}.` : "La eólica no supera a la solar en ninguna hora del día."],
          ["Procedimiento", "Promedio por medición de cada fuente en cada hora de fecha_hora, en todo el período disponible."],
          ["Limitación", "Las fuentes cubren períodos distintos; el perfil horario mezcla estaciones diferentes para cada una."]
        ]
      });
    }

    if (bestSolarClimate || bestWindClimate) {
      knowledge.push({
        title: "Generación según el clima",
        fields: [
          ["Mejor clima para la solar", bestSolarClimate ? `${bestSolarClimate.label}: ${wh(bestSolarClimate.value)} (n=${whole.format(bestSolarClimate.count)})` : "Sin datos suficientes"],
          ["Mejor clima para la eólica", bestWindClimate ? `${bestWindClimate.label}: ${wh(bestWindClimate.value)} (n=${whole.format(bestWindClimate.count)})` : "Sin datos suficientes"],
          ["Peor clima para la solar", lowSolarClimate ? `${lowSolarClimate.label}: solar ${wh(lowSolarClimate.value)}${windClimate.has(lowSolarClimate.label) ? `; eólica ${wh(windClimate.get(lowSolarClimate.label).value)}` : ""}` : "Sin datos suficientes"],
          ["Interpretación", "Comparación descriptiva de promedios ponderados; no demuestra que el clima sea la única causa de las diferencias."]
        ]
      });
    }

    if (peakPeriod || topLocation) {
      knowledge.push({
        title: "Consumo por franja y ubicación",
        fields: [
          ["Franja de mayor consumo", peakPeriod ? `${peakPeriod.label}: ${wh(peakPeriod.value)} (n=${whole.format(peakPeriod.count)})` : "Sin datos suficientes"],
          [`Mayor consumo promedio por ${location}`, topLocation ? `${topLocation.label}: ${wh(topLocation.value)} (n=${whole.format(topLocation.count)})` : "Sin datos suficientes"],
          ["Protección de datos", "Los grupos con menos de 10 mediciones no se publican."]
        ]
      });
    }
    renderKnowledge(knowledge);

    const decisions = [{
      title: "Revisar el balance renovable",
      fields: [
        ["Acción propuesta", "Usar la cobertura conjunta como señal para revisar la demanda, el almacenamiento y la proporción entre instalaciones solares y eólicas."],
        ["Respaldo", shared ? `${number.format(shared.solar)} Wh solares y ${number.format(shared.wind)} Wh eólicos frente a ${shared.consumed === null ? "un consumo sin datos" : `${number.format(shared.consumed)} Wh consumidos`}; cobertura ${percent(shared.coverage)}.` : "Sin período común para comparar."],
        ["Seguimiento", "Recalcular la cobertura cuando ambas fuentes tengan datos del mismo período."],
        ["Limitación", "El balance agregado no dimensiona equipos ni identifica la causa de la diferencia."]
      ]
    }];

    if (windOverSolar.length) {
      decisions.push({
        title: "Apoyarse en la eólica en las horas sin sol",
        fields: [
          ["Acción propuesta", "Asignar a la generación eólica la demanda de las horas en que supera a la solar y reservar la batería para las horas en que ninguna fuente alcanza."],
          ["Respaldo", `Horas en que la eólica supera a la solar: ${hourRanges(windOverSolar)}.`],
          ["Seguimiento", "Contrastar el perfil horario con el consumo de la franja nocturna en cada actualización."],
          ["Limitación", "Los perfiles son promedios; un día sin viento puede no seguir este patrón."]
        ]
      });
    }

    if (lowSolarClimate && windClimate.has(lowSolarClimate.label)) {
      const wind = windClimate.get(lowSolarClimate.label);
      decisions.push({
        title: "Combinar fuentes según el clima",
        fields: [
          ["Acción propuesta", `Con «${lowSolarClimate.label}», revisar si la eólica compensa la caída de la solar antes de recurrir a la batería o a la red.`],
          ["Respaldo", `${lowSolarClimate.label}: solar ${wh(lowSolarClimate.value)}, eólica ${wh(wind.value)}.`],
          ["Seguimiento", "Comparar los promedios por clima de ambas fuentes en cada actualización."],
          ["Limitación", "La comparación es descriptiva y no prueba causalidad."]
        ]
      });
    }

    if (peakPeriod || (topLocation && data.ubicaciones.length > 1)) {
      decisions.push({
        title: "Priorizar la demanda de mayor consumo",
        fields: [
          ["Acción propuesta", "Revisar la carga de la franja y de la categoría de ubicación con mayor consumo promedio antes de cambiar horarios o equipos."],
          ["Respaldo", [peakPeriod ? `Franja «${peakPeriod.label}»: ${wh(peakPeriod.value)}` : null, topLocation ? `${location} ${topLocation.label}: ${wh(topLocation.value)}` : null].filter(Boolean).join(" · ")],
          ["Seguimiento", "Contrastar estas categorías con el perfil horario de generación."],
          ["Limitación", "No se publican grupos con menos de 10 mediciones; las categorías no identifican hogares."]
        ]
      });
    }
    renderDecisions(decisions);
  }

  function renderFeaturedCharts(data) {
    if (!featuredContainer || !ChartClass) return;
    featuredContainer.replaceChildren();
    const series = sourceSeries(data.horas, "hora", ["solar", "eolica", "consumo"], hourLabel);
    if (!series.some(item => item.rows.length)) return;
    const shared = sharedPeriod(data);

    const section = document.createElement("div");
    section.className = "featured-charts-section";
    const grid = document.createElement("div");
    grid.className = "featured-charts-grid";

    const metricsBox = document.createElement("div");
    metricsBox.className = "featured-metrics";
    [
      ["Generación solar", shared ? number.format(shared.solar) : "Sin datos", "Wh en el período común"],
      ["Generación eólica", shared ? number.format(shared.wind) : "Sin datos", "Wh en el período común"],
      ["Cobertura renovable", shared && shared.coverage !== null ? number.format(shared.coverage) : "Sin datos", "% del consumo"]
    ].forEach(([label, value, unit]) => {
      const item = document.createElement("div");
      item.className = "metric-item";
      item.append(text("span", label, "metric-label"), text("strong", value, "metric-value"), text("span", unit, "metric-unit"));
      metricsBox.append(item);
    });

    grid.append(metricsBox);
    section.append(grid);
    featuredContainer.append(section);
    charts.set("grafica-energia-hora", draw(grid, {
      id: "grafica-energia-hora",
      title: "Perfil horario: solar, eólica y consumo",
      description: `Wh por medición en cada hora del día. Muestra en qué horas cada fuente cubre la demanda.${shared ? ` Período común de las dos fuentes: ${day(shared.start)} a ${day(shared.end)}.` : ""}`,
      type: "line",
      unit: "Wh por medición",
      xTitle: "Hora del día",
      series
    }));
  }

  function render(data) {
    currentData = data;
    renderMetrics(data.totales);
    content.hidden = false;
    charts.forEach(chart => {
      if (chart && chart.destroy) chart.destroy();
    });
    charts.clear();
    if (combinedChart && combinedChart.destroy) combinedChart.destroy();
    combinedChart = null;
    chartsContainer.replaceChildren();
    renderFeaturedCharts(data);
    chartSpecs(data).forEach(category => renderCategory(category, chartsContainer));

    const months = [...new Set(data.grupos.map(group => group.mes || "Sin dato"))].sort();
    const selected = monthSelect.value;
    monthSelect.replaceChildren();
    months.forEach(month => {
      const option = text("option", monthLabel(month));
      option.value = month;
      monthSelect.append(option);
    });
    if (months.includes(selected)) monthSelect.value = selected;
    else if (months.length) monthSelect.value = months[months.length - 1];
    if (months.length) renderCombined();
    else document.getElementById("combined-chart").replaceChildren(text("p", "No hay datos mensuales suficientes para esta comparación."));

    renderFeedback(data);
    const totals = data.totales;
    document.getElementById("exploration-period").textContent = `Período: ${date(data.primera_medicion)} a ${date(data.ultima_medicion)} · ${whole.format(Number(data.mediciones_total))} mediciones · solar: ${day(totals.solar_inicio)} a ${day(totals.solar_fin)} · eólica: ${day(totals.eolica_inicio)} a ${day(totals.eolica_fin)} · los gráficos omiten grupos con menos de 10 registros.`;
    const calculated = new Date(data.calculado_en);
    status.textContent = Number.isFinite(calculated.getTime())
      ? `Datos agregados por la base de datos: ${calculated.toLocaleString("es-CO", { timeZone: "America/Bogota" })}. La caché se actualiza cada 5 minutos.`
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
      if (!response.ok) throw new Error(`Base de datos respondió ${response.status}.`);
      const data = await response.json();
      if (data.estado !== "ok") throw new Error("La caché aún no ha sido calculada.");
      validateCache(data);
      if (!ChartClass) {
        const chartModule = await import("https://cdn.jsdelivr.net/npm/chart.js@4.4.8/auto/+esm");
        ChartClass = chartModule.default;
      }
      render(data);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      METRIC_IDS.forEach(id => {
        const element = document.getElementById(id);
        if (element && !currentData) element.textContent = "No disponible";
      });
      if (!currentData) {
        document.getElementById("exploration-period").textContent = "Período no disponible hasta actualizar la caché de la base de datos.";
      }
      status.textContent = currentData
        ? `No se pudo actualizar; se conservan los últimos datos cargados. ${reason}`
        : `No se pudieron cargar las gráficas. ${reason}`;
    } finally {
      loading = false;
    }
  }

  monthSelect.addEventListener("change", renderCombined);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refresh();
  });
  status.textContent = "Conectando con la base de datos…";
  refresh();
  window.setInterval(refresh, POLL_INTERVAL_MS);
})();
