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
  // Paleta validada para daltonismo (ΔE CVD ≥ 15 entre todos los pares); el naranja se apoya en leyenda y tabla.
  const COLORS = { solar: "#0a7550", eolica: "#4a80d8", consumo: "#e98a3a" };
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
  function sourceSeries(groups, key, sourceKeys, format, longFormat) {
    return sourceKeys.map(sourceKey => {
      const source = SOURCES[sourceKey];
      const rows = api.groupAverage(groups, key, source.variable).map(row => ({
        ...row,
        label: format ? format(row.label) : row.label,
        range: longFormat ? longFormat(row.label) : undefined
      }));
      return { label: source.label, color: source.color, rows };
    });
  }

  // Intervalos del recurso: etiqueta corta para el eje y rango completo para tooltip y tabla.
  function resourceRows(data, variable) {
    const rows = data.recurso.filter(item => item.variable === variable);
    const irradiance = variable === "irradiancia";
    const last = irradiance ? 12 : 20;
    return api.groupAverage(rows, "tramo", "generacion").map(row => {
      const bucket = Number(row.label);
      if (!Number.isInteger(bucket) || bucket < 0) throw new Error("Agregado de recurso inválido");
      const label = irradiance
        ? (bucket >= last ? "≥ 1.200" : whole.format(bucket * 100))
        : (bucket >= last ? "≥ 20" : String(bucket));
      const range = irradiance
        ? (bucket >= last ? "≥ 1.200 W/m²" : `${whole.format(bucket * 100)}–${whole.format(bucket * 100 + 100)} W/m²`)
        : (bucket >= last ? "≥ 20 m/s" : `${bucket}–${bucket + 1} m/s`);
      return { ...row, label, range };
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

  // ---- Conclusiones breves que acompañan a cada gráfica ----
  const finite = rows => rows.filter(row => Number.isFinite(row.value));
  const top = rows => finite(rows).sort((left, right) => right.value - left.value)[0] || null;
  const bottom = rows => finite(rows).sort((left, right) => left.value - right.value)[0] || null;
  const whValue = value => `${number.format(value)} Wh`;

  function bestBySource(series) {
    const parts = series.map(item => {
      const best = top(item.rows);
      return best ? `la ${item.label.toLowerCase()} rinde más con «${best.range || best.label}» (${whValue(best.value)})` : null;
    }).filter(Boolean);
    if (!parts.length) return null;
    const sentence = parts.join("; ");
    return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
  }

  function periodInsight(series) {
    const [solar, wind, consumption] = series;
    const peak = top(consumption.rows);
    if (!peak) return null;
    const solarRow = solar.rows.find(row => row.label === peak.label);
    const windRow = wind.rows.find(row => row.label === peak.label);
    const values = [solarRow && Number.isFinite(solarRow.value) ? `${whValue(solarRow.value)} solares` : null, windRow && Number.isFinite(windRow.value) ? `${whValue(windRow.value)} eólicos` : null].filter(Boolean);
    return `El consumo es mayor en «${peak.label}» (${whValue(peak.value)} por medición)${values.length ? `; ahí se generan ${values.join(" y ")}` : ""}.`;
  }

  function growthInsight(rows, resource) {
    const valid = finite(rows);
    if (valid.length < 2) return null;
    const first = valid[0];
    const best = top(valid);
    if (best === first) return null;
    return `La generación pasa de ${whValue(first.value)} con ${first.range} a ${whValue(best.value)} con ${best.range} de ${resource}.`;
  }

  function spreadInsight(rows, noun) {
    const high = top(rows);
    const low = bottom(rows);
    if (!high || !low || high === low || low.value <= 0) return null;
    return `«${high.label}» consume ${number.format((high.value / low.value - 1) * 100)} % más por medición que «${low.label}»; la comparación es por medición, no por ${noun}.`;
  }

  // ---- Estilo común de las gráficas ----
  const INK = "#282d30";
  const MUTED = "#6b7479";
  const GRID = "#e9edeb";
  const compact = new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 });
  const tickNumber = value => Math.abs(value) >= 10000 ? compact.format(value) : number.format(value);

  function applyChartDefaults() {
    if (!ChartClass || !ChartClass.defaults) return;
    ChartClass.defaults.font.family = '"DM Sans", system-ui, sans-serif';
    ChartClass.defaults.font.size = 12;
    ChartClass.defaults.color = MUTED;
    ChartClass.defaults.borderColor = GRID;
  }

  // Sombrea las horas sin sol (18:00–05:59) para leer el perfil horario de un vistazo.
  const nightBands = {
    id: "franjasNocturnas",
    beforeDatasetsDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      const labels = chart.data.labels;
      if (!scales.x || labels.length < 2) return;
      const step = scales.x.getPixelForValue(1) - scales.x.getPixelForValue(0);
      ctx.save();
      ctx.fillStyle = "rgba(40, 45, 48, 0.05)";
      labels.forEach((label, index) => {
        const hour = parseInt(label, 10);
        if (!(hour < 6 || hour >= 18)) return;
        const center = scales.x.getPixelForValue(index);
        const left = Math.max(chartArea.left, center - step / 2);
        const right = Math.min(chartArea.right, center + step / 2);
        ctx.fillRect(left, chartArea.top, right - left, chartArea.bottom - chartArea.top);
      });
      ctx.fillStyle = MUTED;
      ctx.font = '600 11px "DM Sans", system-ui, sans-serif';
      ctx.textBaseline = "top";
      ctx.fillText("Noche", chartArea.left + 6, chartArea.top + 6);
      ctx.restore();
    }
  };

  function buildTable(labels, series, lookups, unit) {
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
      const first = lookups.map(lookup => lookup.get(label)).find(Boolean);
      line.append(text("td", first && first.range ? first.range : label));
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
    return details;
  }

  function buildFigure(spec) {
    const figure = document.createElement("figure");
    figure.className = "exploration-chart";
    if (spec.wide) figure.classList.add("exploration-chart--wide");
    if (spec.id) figure.id = spec.id;
    const caption = document.createElement("figcaption");
    caption.append(text("h3", spec.title), text("p", spec.description));
    if (spec.insight) caption.append(text("p", spec.insight, "chart-insight"));
    figure.append(caption);
    return figure;
  }

  // Dibuja una gráfica con una o varias series que comparten categorías.
  function draw(container, spec) {
    const { title, series, type, unit } = spec;
    const labels = [];
    series.forEach(item => item.rows.forEach(row => { if (!labels.includes(row.label)) labels.push(row.label); }));
    const lookups = series.map(item => new Map(item.rows.map(row => [row.label, row])));
    const multiple = series.length > 1;
    const horizontal = Boolean(spec.horizontal);
    const line = type === "line";
    const shortUnit = spec.shortUnit || "Wh";

    const figure = buildFigure(spec);
    const wrapper = document.createElement("div");
    wrapper.className = "chart-canvas";
    // Las barras horizontales crecen con el número de categorías para no apretar las etiquetas.
    if (horizontal) wrapper.style.height = `${Math.max(240, labels.length * (multiple ? 14 * series.length + 12 : 34) + 80)}px`;
    if (spec.tall) wrapper.classList.add("chart-canvas--tall");
    const canvas = document.createElement("canvas");
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", `${title}. ${spec.insight || spec.description}`);
    wrapper.append(canvas);
    figure.append(wrapper, buildTable(labels, series, lookups, unit));
    container.append(figure);

    const fewPoints = labels.length <= 12;
    const datasets = series.map((item, index) => ({
      label: item.label,
      data: labels.map(label => {
        const row = lookups[index].get(label);
        return row && Number.isFinite(row.value) ? row.value : null;
      }),
      backgroundColor: line ? `${item.color}1a` : item.color,
      borderColor: item.color,
      borderWidth: line ? 2 : 0,
      borderRadius: line ? 0 : 4,
      borderSkipped: "start",
      maxBarThickness: 24,
      categoryPercentage: multiple ? (horizontal ? 0.82 : 0.72) : 0.8,
      barPercentage: 0.9,
      fill: line && !multiple ? "origin" : false,
      cubicInterpolationMode: "monotone",
      borderCapStyle: "round",
      borderJoinStyle: "round",
      pointRadius: line && fewPoints ? 4 : 0,
      pointBackgroundColor: item.color,
      pointBorderColor: "#fff",
      pointBorderWidth: 2,
      pointHoverRadius: 5,
      pointHoverBorderWidth: 2,
      pointHitRadius: 12,
      spanGaps: false
    }));

    const valueAxis = {
      beginAtZero: true,
      border: { display: false },
      grid: { color: GRID, drawTicks: false },
      ticks: { padding: 8, color: MUTED, callback: value => tickNumber(value), maxTicksLimit: 6 },
      title: { display: true, text: unit, color: MUTED, font: { size: 11 } }
    };
    const categoryAxis = {
      border: { color: "#c9d1cd" },
      grid: { display: false },
      ticks: {
        color: MUTED,
        padding: 6,
        maxRotation: 0,
        autoSkip: line,
        autoSkipPadding: 10,
        callback(value) {
          const label = this.getLabelForValue(value);
          return !horizontal && typeof label === "string" && label.length > 11 ? label.split(" ") : label;
        }
      },
      title: { display: Boolean(spec.xTitle), text: spec.xTitle || "", color: MUTED, font: { size: 11 } }
    };

    const chart = new ChartClass(canvas, {
      type,
      data: { labels, datasets },
      plugins: spec.nightBands ? [nightBands] : [],
      options: {
        indexAxis: horizontal ? "y" : "x",
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 4, right: 8 } },
        interaction: multiple || line ? { mode: "index", intersect: false, axis: horizontal ? "y" : "x" } : { mode: "nearest", intersect: false },
        animation: reducedMotion.matches ? false : { duration: 700, easing: "easeOutQuart" },
        plugins: {
          legend: {
            display: multiple,
            position: "top",
            align: "start",
            labels: { color: INK, usePointStyle: true, pointStyle: line ? "circle" : "rectRounded", boxWidth: 10, boxHeight: 10, padding: 16, font: { size: 12, weight: "500" } }
          },
          tooltip: {
            backgroundColor: "#fff",
            titleColor: INK,
            bodyColor: "#3d4549",
            footerColor: MUTED,
            borderColor: "#dfe3e2",
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            boxPadding: 4,
            usePointStyle: true,
            titleFont: { weight: "600" },
            footerFont: { weight: "400", size: 11 },
            callbacks: {
              title: items => {
                if (!items.length) return "";
                const row = lookups[items[0].datasetIndex].get(labels[items[0].dataIndex]);
                return row && row.range ? row.range : String(labels[items[0].dataIndex]);
              },
              label: context => {
                const value = context.parsed[horizontal ? "x" : "y"];
                return ` ${context.dataset.label}: ${Number.isFinite(value) ? `${number.format(value)} ${shortUnit}` : "sin datos"}`;
              },
              footer: items => {
                const counts = items.map(item => lookups[item.datasetIndex].get(labels[item.dataIndex])).filter(row => row && Number.isFinite(row.count));
                if (!counts.length) return "";
                return multiple ? `Mediciones: ${counts.map(row => whole.format(row.count)).join(" / ")}` : `Mediciones: ${whole.format(counts[0].count)}`;
              }
            }
          }
        },
        scales: horizontal ? { x: valueAxis, y: categoryAxis } : { x: categoryAxis, y: valueAxis }
      }
    });
    return withReplay(chart, figure);
  }

  // Repite la animación de entrada cuando la gráfica aparece en pantalla.
  function withReplay(chart, figure) {
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

  // Parte de un todo con dos fuentes: barra segmentada en lugar de una dona de dos porciones.
  function drawShare(container, spec, shared) {
    const figure = buildFigure(spec);
    const parts = [
      { label: "Solar", value: shared.solar, share: shared.solarShare, color: COLORS.solar },
      { label: "Eólica", value: shared.wind, share: shared.windShare, color: COLORS.eolica }
    ];
    const bar = document.createElement("div");
    bar.className = "share-bar";
    bar.setAttribute("role", "img");
    bar.setAttribute("aria-label", parts.map(part => `${part.label}: ${part.share === null ? "sin datos" : `${number.format(part.share)} %`} (${number.format(part.value)} Wh)`).join("; "));
    parts.forEach(part => {
      if (!(part.share > 0)) return;
      const block = document.createElement("div");
      block.className = "share-bar__part";
      block.style.flexGrow = String(part.share);
      block.style.background = part.color;
      block.title = `${part.label}: ${number.format(part.share)} % · ${number.format(part.value)} Wh`;
      if (part.share >= 12) block.append(text("span", `${Math.round(part.share)} %`));
      bar.append(block);
    });
    const legend = document.createElement("ul");
    legend.className = "share-legend";
    parts.forEach(part => {
      const item = document.createElement("li");
      const swatch = text("span", "", "share-legend__swatch");
      swatch.style.background = part.color;
      item.append(swatch, text("strong", part.label), text("span", `${number.format(part.value)} Wh${part.share === null ? "" : ` · ${number.format(part.share)} %`}`));
      legend.append(item);
    });
    // Qué parte del consumo cubre cada fuente: medidor con riel del mismo tono.
    const coverage = document.createElement("div");
    coverage.className = "coverage";
    coverage.append(text("p", "Cobertura del consumo en el mismo período", "coverage__title"));
    [["Solar", shared.solarCoverage, COLORS.solar], ["Eólica", shared.windCoverage, COLORS.eolica], ["Solar + eólica", shared.coverage, INK]].forEach(([label, value, color]) => {
      const row = document.createElement("div");
      row.className = "coverage__row";
      const track = document.createElement("div");
      track.className = "coverage__track";
      track.style.background = `${color}1f`;
      const fill = document.createElement("div");
      fill.className = "coverage__fill";
      fill.style.background = color;
      fill.style.width = `${Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))}%`;
      track.append(fill);
      row.append(text("span", label, "coverage__label"), track, text("span", Number.isFinite(value) ? `${number.format(value)} %` : "Sin datos", "coverage__value"));
      coverage.append(row);
    });
    const rows = parts.map(part => ({ label: part.label, value: part.value, count: null, percent: part.share }));
    const series = [{ label: "Generación", color: COLORS.solar, rows }];
    figure.append(bar, legend, coverage, buildTable(rows.map(row => row.label), series, [new Map(rows.map(row => [row.label, row]))], "Wh generados"));
    container.append(figure);
    return null;
  }

  function chartSpecs(data) {
    const shared = sharedPeriod(data);
    const sharedText = shared ? `${day(shared.start)} a ${day(shared.end)}` : null;
    const climate = sourceSeries(data.grupos, "condicion", ["solar", "eolica"]);
    const period = sourceSeries(data.grupos, "franja", ["solar", "eolica", "consumo"]);
    const years = new Set(data.grupos.map(group => String(group.mes).slice(0, 4)));
    const monthShort = value => {
      const label = monthLabel(value, true).replace(/\./g, "").replace(/ de /, " ");
      return years.size > 1 ? label : label.split(" ")[0];
    };
    const monthly = sourceSeries(data.grupos, "mes", ["solar", "eolica"], monthShort, value => monthLabel(value));
    const irradiance = resourceRows(data, "irradiancia");
    const wind = resourceRows(data, "viento");
    // Un estrato numérico se lee mejor con su nombre: «Estrato 3» en lugar de «3».
    const stratum = locationLabel(data) === "estrato";
    const location = api.groupAverage(data.ubicaciones, "categoria", "consumo").map(row => ({ ...row, label: stratum && /^\d+$/.test(String(row.label)) ? `Estrato ${row.label}` : row.label }));
    const monthsWith = item => finite(item.rows).length;
    return [
      {
        key: "complementariedad",
        category: "Solar y eólica",
        description: "Compara las dos fuentes con la misma unidad (Wh por medición) para ver cuándo una compensa a la otra. Solo se publican grupos con al menos 10 mediciones.",
        charts: [
          { id: "grafica-generacion-clima", title: "Generación promedio por clima", description: "Wh por medición de cada fuente según la condición climática.", insight: bestBySource(climate), type: "bar", unit: "Wh por medición", series: climate },
          { id: "grafica-energia-franja", title: "Generación y consumo por franja", description: "Wh por medición de cada fuente y del consumo en cada franja del día.", insight: periodInsight(period), type: "bar", unit: "Wh por medición", series: period },
          { id: "grafica-generacion-mes", title: "Generación promedio por mes", description: "Wh por medición. Un mes sin punto indica que esa fuente no tiene mediciones en él.", insight: `Hay datos solares en ${monthsWith(monthly[0])} meses y eólicos en ${monthsWith(monthly[1])}. ${bestBySource(monthly) || ""}`.trim(), type: "line", unit: "Wh por medición", series: monthly },
          shared ? {
            id: "grafica-mezcla",
            share: true,
            title: "Mezcla de generación",
            description: `Participación de cada fuente en la energía generada entre ${sharedText}, el período con datos de ambas.`,
            insight: shared.solarShare === null ? null : `La ${shared.solarShare >= 50 ? "solar" : "eólica"} aporta la mayor parte: ${number.format(Math.max(shared.solarShare, shared.windShare))} % de la energía generada.`
          } : null
        ].filter(Boolean)
      },
      {
        key: "recurso",
        category: "Recurso y generación",
        description: "Relaciona cada fuente con el recurso que la produce: irradiancia para la solar y velocidad del viento para la eólica.",
        charts: [
          { id: "grafica-solar-irradiancia", title: "Generación solar según irradiancia", description: "Wh por medición en intervalos de 100 W/m².", insight: growthInsight(irradiance, "irradiancia"), type: "bar", unit: "Wh por medición", xTitle: "Irradiancia (W/m²)", series: [{ label: "Solar", color: COLORS.solar, rows: irradiance }] },
          { id: "grafica-eolica-viento", title: "Generación eólica según velocidad del viento", description: "Wh por medición en intervalos de 1 m/s.", insight: growthInsight(wind, "viento"), type: "bar", unit: "Wh por medición", xTitle: "Velocidad del viento (m/s)", series: [{ label: "Eólica", color: COLORS.eolica, rows: wind }] }
        ]
      },
      {
        key: "consumo",
        category: "Consumo",
        description: "Demanda que deben cubrir las dos fuentes.",
        charts: [
          { id: "grafica-consumo-ubicacion", wide: true, horizontal: true, title: `Consumo promedio por ${locationLabel(data)}`, description: "Promedio por medición, para comparar categorías con distinto número de viviendas. Usa estrato si está disponible; de lo contrario, barrio.", insight: spreadInsight(location, "vivienda"), type: "bar", unit: "Wh por medición", series: [{ label: "Consumo", color: COLORS.consumo, rows: location }] }
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
    const renewable = series[0].rows.map(row => {
      const windRow = series[1].rows.find(item => item.label === row.label);
      const total = (Number.isFinite(row.value) ? row.value : 0) + (windRow && Number.isFinite(windRow.value) ? windRow.value : 0);
      return { label: row.label, value: total };
    });
    series[1].rows.forEach(row => { if (!renewable.some(item => item.label === row.label) && Number.isFinite(row.value)) renewable.push({ label: row.label, value: row.value }); });
    const best = top(renewable);
    combinedChart = draw(container, {
      id: "grafica-conjunto",
      wide: true,
      horizontal: true,
      title: `Solar, eólica y consumo en ${monthLabel(month)}`,
      description: "Wh por medición · cada fila combina una condición climática y una franja del día.",
      insight: best ? `En ${monthLabel(month)}, la combinación con más generación renovable es «${best.label}» (${whValue(best.value)} por medición entre solar y eólica).` : null,
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
    category.charts.forEach(spec => {
      const drawn = spec.share ? drawShare(grid, spec, sharedPeriod(currentData)) : draw(grid, spec);
      if (drawn) charts.set(spec.id, drawn);
    });
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

    // Energía en la unidad legible más cercana (Wh, kWh o MWh).
    const energy = value => {
      if (!Number.isFinite(value)) return ["Sin datos", ""];
      if (Math.abs(value) >= 1e6) return [number.format(value / 1e6), "MWh"];
      if (Math.abs(value) >= 1e3) return [number.format(value / 1e3), "kWh"];
      return [number.format(value), "Wh"];
    };
    const [solarValue, solarUnit] = energy(shared ? shared.solar : NaN);
    const [windValue, windUnit] = energy(shared ? shared.wind : NaN);
    const metricsBox = document.createElement("div");
    metricsBox.className = "featured-metrics";
    [
      ["Cobertura renovable", shared && shared.coverage !== null ? `${number.format(shared.coverage)} %` : "Sin datos", "del consumo, solar + eólica", "metric-item metric-item--hero"],
      ["Generación solar", solarValue, `${solarUnit} en el período común`.trim(), "metric-item", COLORS.solar],
      ["Generación eólica", windValue, `${windUnit} en el período común`.trim(), "metric-item", COLORS.eolica]
    ].forEach(([label, value, unit, className, color]) => {
      const item = document.createElement("div");
      item.className = className;
      const labelElement = text("span", "", "metric-label");
      if (color) {
        const key = text("span", "", "metric-key");
        key.style.background = color;
        labelElement.append(key);
      }
      labelElement.append(document.createTextNode(label));
      item.append(labelElement, text("strong", value, "metric-value"), text("span", unit, "metric-unit"));
      metricsBox.append(item);
    });

    const solarRows = series[0].rows;
    const windLookup = new Map(series[1].rows.map(row => [row.label, row]));
    const windHours = solarRows.filter(row => {
      const windRow = windLookup.get(row.label);
      return Number.isFinite(row.value) && windRow && Number.isFinite(windRow.value) && windRow.value > row.value;
    }).map(row => parseInt(row.label, 10));

    grid.append(metricsBox);
    section.append(grid);
    featuredContainer.append(section);
    charts.set("grafica-energia-hora", draw(grid, {
      id: "grafica-energia-hora",
      tall: true,
      nightBands: true,
      title: "Perfil horario: solar, eólica y consumo",
      description: `Wh por medición en cada hora del día; la zona gris marca las horas sin sol.${shared ? ` Período común de las dos fuentes: ${day(shared.start)} a ${day(shared.end)}.` : ""}`,
      insight: windHours.length ? `La eólica supera a la solar en ${windHours.length} de 24 horas (${hourRanges(windHours)}): es la fuente que sostiene la noche.` : "La solar supera a la eólica en todas las horas con datos.",
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
    // Por defecto, el mes más reciente con generación solar y eólica, para que la comparación tenga ambas fuentes.
    const complete = months.filter(month => data.grupos.some(group => (group.mes || "Sin dato") === month && Number(group.generacion_no_nula) > 0)
      && data.grupos.some(group => (group.mes || "Sin dato") === month && Number(group.eolica_no_nula) > 0));
    if (months.includes(selected)) monthSelect.value = selected;
    else if (complete.length) monthSelect.value = complete[complete.length - 1];
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
        applyChartDefaults();
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
