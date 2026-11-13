(() => {
  const config = window.PROJECT_DATA;
  const api = window.ChartAggregates;
  const status = document.getElementById("exploration-status");
  const content = document.getElementById("exploration-content");
  const monthSelect = document.getElementById("grafico-mes");
  if (!config || !api || !config.supabasePublishableKey || !config.supabaseUrl) return;

  function isPublicKey(key) {
    if (key.startsWith("sb_publishable_")) return true;
    try { return JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).role === "anon"; }
    catch (error) { return false; }
  }
  let url;
  try { url = new URL(config.supabaseUrl); } catch (error) { return; }
  if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co") || !isPublicKey(config.supabasePublishableKey)) return;

  const number = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });
  const whole = new Intl.NumberFormat("es-CO");
  const charts = [];
  let combinedChart = null;
  let currentData = null;
  let ChartClass = null;
  let loading = false;
  const text = (tag, value) => { const element = document.createElement(tag); element.textContent = value; return element; };

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
    const chart = new ChartClass(canvas, {
      type,
      data: { labels: rows.map(row => row.label), datasets: [{ label: unit, data: rows.map(row => row.value), backgroundColor: color, borderColor: color, borderWidth: 2, pointRadius: 3, tension: 0.1 }] },
      options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false }, tooltip: { callbacks: { afterLabel: context => { const row = rows[context.dataIndex]; return `Mediciones: ${whole.format(row.count)}${Number.isFinite(row.percent) ? ` (${number.format(row.percent)} % del total)` : ""}`; } } } }, scales: { y: { beginAtZero: true, title: { display: true, text: unit } }, x: { ticks: { maxRotation: 55, minRotation: 0 } } } }
    });
    return chart;
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

  function render(data) {
    if (!data || data.estado !== "ok" || !Array.isArray(data.grupos) || !Array.isArray(data.histogramas)) throw new Error("Caché de gráficas no disponible");
    currentData = data;
    content.hidden = false;
    const container = document.getElementById("exploration-charts");
    charts.splice(0).forEach(chart => chart.destroy());
    container.replaceChildren();
    const groups = data.grupos;
    const specifications = [
      ["Distribución del consumo", "Intervalos de 10 Wh · límite superior excluido · número de mediciones", histogram(data, "consumo"), "bar", "Mediciones", "#ca6d39", "grafica-distribucion-consumo"],
      ["Distribución de la generación", "Intervalos de 10 Wh · límite superior excluido · número de mediciones", histogram(data, "generacion"), "bar", "Mediciones", "#176d52", "grafica-distribucion-generacion"],
      ["Distribución del nivel de batería", "Intervalos de 20 % · límite superior excluido, salvo 100 %", histogram(data, "bateria"), "bar", "Mediciones", "#668f61", "grafica-distribucion-bateria"],
      ["Mediciones por condición climática", "Frecuencia de mediciones por condición", api.groupCounts(groups, "condicion"), "bar", "Mediciones", "#b36d43"],
      ["Generación promedio por mes", "Promedio ponderado por mediciones no nulas", api.groupAverage(groups, "mes", "generacion"), "line", "Wh por medición", "#176d52"],
      ["Consumo promedio por mes", "Promedio ponderado por mediciones no nulas", api.groupAverage(groups, "mes", "consumo"), "line", "Wh por medición", "#ca6d39"],
      ["Generación promedio por clima", "Promedio ponderado por mediciones no nulas", api.groupAverage(groups, "condicion", "generacion"), "bar", "Wh por medición", "#176d52", "grafica-generacion-clima"],
      ["Consumo promedio por franja", "Promedio ponderado por mediciones no nulas", api.groupAverage(groups, "franja", "consumo"), "bar", "Wh por medición", "#ca6d39", "grafica-consumo-franja"]
    ];
    specifications.forEach(specification => charts.push(draw(container, ...specification)));
    const months = [...new Set(groups.map(group => group.mes || "Sin dato"))].sort();
    const selected = monthSelect.value;
    monthSelect.replaceChildren();
    months.forEach(month => { const option = text("option", month); option.value = month; monthSelect.append(option); });
    if (months.includes(selected)) monthSelect.value = selected;
    else if (months.length) monthSelect.value = months[months.length - 1];
    renderCombined();
    const date = value => value ? String(value).replace("T", " ").slice(0, 19) : "Sin fecha";
    document.getElementById("exploration-period").textContent = `Período: ${date(data.primera_medicion)} a ${date(data.ultima_medicion)} · ${whole.format(Number(data.mediciones_total))} mediciones en la fuente · sin filtros generales.`;
    const calculated = new Date(data.calculado_en);
    status.textContent = Number.isFinite(calculated.getTime()) ? `Gráficas calculadas: ${calculated.toLocaleString("es-CO", { timeZone: "UTC" })} UTC.` : "Hora de cálculo no disponible.";
  }

  async function refresh() {
    if (loading || document.hidden) return;
    loading = true;
    try {
      const response = await fetch(`${url.origin}/rest/v1/rpc/pgc_graficas_publicas_2026`, { method: "POST", headers: { apikey: config.supabasePublishableKey, "Content-Type": "application/json" }, body: "{}" });
      if (!response.ok) throw new Error("No hay respuesta de la base");
      const data = await response.json();
      if (data.estado !== "ok") throw new Error("Caché no inicializada");
      if (!ChartClass) {
        const chartModule = await import("https://cdn.jsdelivr.net/npm/chart.js@4.4.8/auto/+esm");
        ChartClass = chartModule.default;
      }
      render(data);
    } catch (error) {
      status.textContent = currentData ? "No se pudo actualizar; se conservan las últimas gráficas cargadas." : "Gráficas pendientes: aún no se ha configurado o calculado la caché de análisis.";
    } finally { loading = false; }
  }
  monthSelect.addEventListener("change", renderCombined);
  refresh();
  window.setInterval(refresh, 60000);
})();