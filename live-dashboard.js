(() => {
  const config = window.PROJECT_DATA;
  const status = document.getElementById("live-status");
  if (!config || !config.supabasePublishableKey || !config.supabaseUrl) return;

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
    url = new URL(config.supabaseUrl);
  } catch (error) {
    status.textContent = "La URL de Base de datosno es válida.";
    return;
  }
  if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co")) {
    status.textContent = "La URL debe corresponder a un proyecto de Base de datoscon HTTPS.";
    return;
  }
  if (!isPublicKey(config.supabasePublishableKey)) {
    status.textContent = "Configuración inválida: utiliza solo una clave publicable o anon, nunca una clave secreta.";
    return;
  }

  const number = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });
  const whole = new Intl.NumberFormat("es-CO");
  const POLL_INTERVAL_MS = 300000;
  const setText = (id, value) => { document.getElementById(id).textContent = value; };
  const finiteNumber = value => value === null || value === undefined ? null : Number(value);
  const display = (value, unit) => Number.isFinite(value) ? `${number.format(value)} ${unit}` : "Sin datos";
  const dateText = value => value ? String(value).replace("T", " ").slice(0, 19) : "Sin fecha";
  const queryTime = value => {
    const date = new Date(value);
    return value && Number.isFinite(date.getTime()) ? `${date.toLocaleString("es-CO", { timeZone: "America/Bogota" })}` : "hora no disponible";
  };

  function render(summary) {
    if (!summary || summary.estado !== "ok") throw new Error("No hay suficientes registros para mostrar el resumen público.");
    const generation = finiteNumber(summary.generacion_promedio_wh);
    const consumption = finiteNumber(summary.consumo_promedio_wh);
    const battery = finiteNumber(summary.bateria_promedio_pct);
    const counts = [summary.mediciones, summary.dispositivos, summary.ubicaciones, summary.generacion_no_nula, summary.consumo_no_nulo, summary.bateria_no_nula].map(finiteNumber);
    if (counts.some(value => !Number.isSafeInteger(value) || value < 0)) throw new Error("El resumen recibido no tiene conteos válidos.");

    setText("metric-mediciones", whole.format(counts[0]));
    setText("metric-dispositivos", whole.format(counts[1]));
    setText("metric-ubicaciones", whole.format(counts[2]));
    setText("metric-generacion", display(generation, "Wh"));
    setText("metric-consumo", display(consumption, "Wh"));
    setText("metric-bateria", display(battery, "%"));
    setText("chart-generacion", display(generation, "Wh"));
    setText("chart-consumo", display(consumption, "Wh"));
    setText("chart-bateria", display(battery, "%"));
    setText("energy-denominators", `Wh por medición · generación: ${whole.format(counts[3])}; consumo: ${whole.format(counts[4])} valores no nulos`);
    setText("battery-denominator", `Porcentaje · ${whole.format(counts[5])} registros no nulos`);
    setText("live-period", ` Período: ${dateText(summary.primera_medicion)} a ${dateText(summary.ultima_medicion)}.`);

    const maximum = Math.max(100, Math.ceil(Math.max(0, generation || 0, consumption || 0) / 10) * 10);
    setText("energy-axis-max", `${number.format(maximum)} Wh`);
    document.getElementById("bar-generacion").style.width = `${Number.isFinite(generation) && generation >= 0 ? generation / maximum * 100 : 0}%`;
    document.getElementById("bar-consumo").style.width = `${Number.isFinite(consumption) && consumption >= 0 ? consumption / maximum * 100 : 0}%`;
    document.getElementById("bar-bateria").style.width = `${Number.isFinite(battery) && battery >= 0 && battery <= 100 ? battery : 0}%`;
    const invalid = [generation, consumption].some(value => Number.isFinite(value) && value < 0) || (Number.isFinite(battery) && (battery < 0 || battery > 100));
    status.textContent = `Resumen calculado: ${queryTime(summary.consultado_en)}${invalid ? " Hay promedios fuera de rango; revisa los datos." : ""}`;
  }

  let client;
  let lastRequest = 0;
  let pending = false;
  async function refresh() {
    if (!client || pending || Date.now() - lastRequest < POLL_INTERVAL_MS) return;
    pending = true;
    lastRequest = Date.now();
    try {
      const { data, error } = await client.rpc("pgc_dashboard_resumen_publico_2026");
      if (error) throw error;
      render(data);
    } catch (error) {
      status.textContent = "No se pudo actualizar el resumen. Se conservan los últimos valores mostrados; revisa la función y la clave publicable.";
    } finally {
      pending = false;
    }
  }

  async function start() {
    status.textContent = "Conectando con la base de datos…";
    try {
      const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.91.0/+esm");
      client = createClient(config.supabaseUrl, config.supabasePublishableKey);
      await refresh();
      client.channel("pgc-energia-publico").on("broadcast", { event: "mediciones-actualizadas" }, () => { if (!document.hidden) refresh(); }).subscribe();
      document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
      window.setInterval(() => { if (!document.hidden) refresh(); }, POLL_INTERVAL_MS);
    } catch (error) {
      status.textContent = "No se pudo conectar con Supabase. Se muestran los valores históricos.";
    }
  }
  start();
})();