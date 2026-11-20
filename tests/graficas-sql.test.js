const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

let PGlite;
try { PGlite = require(path.join(os.tmpdir(), "pgc-sql-check", "node_modules", "@electric-sql", "pglite")).PGlite; }
catch (error) { PGlite = null; }

const script = () => fs.readFileSync(path.join(__dirname, "../sql/supabase/SUPABASE-GRAFICAS.sql"), "utf8");

const schema = `
  CREATE ROLE anon NOLOGIN;
  CREATE ROLE authenticated NOLOGIN;
  CREATE TABLE public.dim_clima (condicion_key smallint, condicion text);
  CREATE TABLE public.dim_hora (franja_key smallint, franja_dia text);
  CREATE TABLE public.dim_ubicacion (ubicacion_key integer, barrio text);
`;

test("consulta SQL agrega energía solar y eólica, calcula el período común y limita permisos", { skip: !PGlite }, async () => {
  const db = new PGlite();
  try {
    await db.exec(`${schema}
      CREATE TABLE public.fact_medicion_energia (
        fecha_hora timestamp, condicion_key smallint, franja_key smallint,
        ubicacion_key integer, dispositivo_key integer,
        energia_consumida_total_wh real, energia_generada_wh real, nivel_bateria_pct real,
        irradiancia_wm2 real, potencia_panel_w real,
        velocidad_viento_ms real, direccion_viento_grados real, potencia_eolica_w real, energia_eolica_wh real
      );
      INSERT INTO public.dim_clima VALUES (1, 'Soleado'), (2, 'Nublado');
      INSERT INTO public.dim_hora VALUES (1, 'Día');
      INSERT INTO public.dim_ubicacion VALUES (1, 'Centro');
      -- 50 mediciones solares entre 00:01 y 00:50, más una aislada al día siguiente.
      INSERT INTO public.fact_medicion_energia (fecha_hora, condicion_key, franja_key, ubicacion_key, dispositivo_key, energia_consumida_total_wh, energia_generada_wh, nivel_bateria_pct, irradiancia_wm2)
      SELECT '2026-01-01'::timestamp + value * interval '1 minute', 1, 1, 1, 1, 15, 25, 50, 450
      FROM generate_series(1, 50) AS value;
      INSERT INTO public.fact_medicion_energia (fecha_hora, condicion_key, franja_key, ubicacion_key, dispositivo_key, energia_consumida_total_wh, energia_generada_wh, nivel_bateria_pct, irradiancia_wm2)
      VALUES ('2026-01-02', 2, 1, 1, 1, 15, 25, 50, 450);
      -- 20 mediciones eólicas entre 00:31 y 00:50, de otro dispositivo.
      INSERT INTO public.fact_medicion_energia (fecha_hora, condicion_key, franja_key, ubicacion_key, dispositivo_key, energia_consumida_total_wh, velocidad_viento_ms, direccion_viento_grados, potencia_eolica_w, energia_eolica_wh)
      SELECT '2026-01-01'::timestamp + value * interval '1 minute', 1, 1, 1, 2, 10, 6.5, 90, 48, 12
      FROM generate_series(31, 50) AS value;
    `);
    await db.exec(script());
    await db.exec("SELECT public.pgc_actualizar_graficas_energia_2026();");
    await db.exec("SET ROLE anon;");
    const data = (await db.query("SELECT public.pgc_graficas_publicas_2026() AS data;")).rows[0].data;
    assert.equal(data.estado, "ok");
    assert.equal(data.version, 2);
    assert.equal(data.mediciones_total, 71);
    assert.equal(data.totales.generacion_suma, 1275);
    assert.equal(data.totales.eolica_suma, 240);
    assert.equal(data.totales.eolica_no_nula, 20);
    assert.equal(data.totales.viento_promedio_ms, 6.5);
    // Solo el tramo con datos de ambas fuentes: de 00:31 a 00:50.
    assert.match(data.periodo_comun.inicio, /2026-01-01T00:31/);
    assert.match(data.periodo_comun.fin, /2026-01-01T00:50/);
    assert.equal(data.periodo_comun.mediciones, 40);
    assert.equal(data.periodo_comun.generacion_suma, 500);
    assert.equal(data.periodo_comun.eolica_suma, 240);
    assert.equal(data.periodo_comun.consumo_suma, 500);
    assert.equal(data.grupos.length, 1);
    assert.equal(data.grupos[0].mediciones, 70);
    assert.equal(data.grupos[0].eolica_no_nula, 20);
    assert.equal(data.mediciones_omitidas, 1);
    assert.equal(data.horas[0].eolica_suma, 240);
    assert.equal(data.ubicaciones[0].categoria, "Centro");
    assert.deepEqual(data.recurso.map(item => [item.variable, item.tramo, item.mediciones]), [["irradiancia", 4, 51], ["viento", 6, 20]]);
    await assert.rejects(db.exec("SELECT public.pgc_actualizar_graficas_energia_2026();"), /permission denied/i);
  } finally { await db.close(); }
});

test("el script se detiene con un mensaje claro si faltan columnas", { skip: !PGlite }, async () => {
  const db = new PGlite();
  try {
    await db.exec(`${schema}
      CREATE TABLE public.fact_medicion_energia (
        fecha_hora timestamp, condicion_key smallint, franja_key smallint,
        ubicacion_key integer, dispositivo_key integer,
        energia_consumida_total_wh real, energia_generada_wh real, nivel_bateria_pct real,
        irradiancia_wm2 real, energia_eolica_wh real
      );
    `);
    await assert.rejects(db.exec(script()), /faltan columnas: velocidad_viento_ms/);
  } finally { await db.close(); }
});
