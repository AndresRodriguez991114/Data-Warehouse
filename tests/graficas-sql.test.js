const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

let PGlite;
try { PGlite = require(path.join(os.tmpdir(), "pgc-sql-check", "node_modules", "@electric-sql", "pglite")).PGlite; }
catch (error) { PGlite = null; }

test("consulta SQL conserva grupos, histogramas y permisos", { skip: !PGlite }, async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE ROLE anon NOLOGIN;
      CREATE ROLE authenticated NOLOGIN;
      CREATE SCHEMA pgc_energia_cache_2026;
      CREATE TABLE public.dim_clima (condicion_key smallint, condicion text);
      CREATE TABLE public.dim_hora (franja_key smallint, franja_dia text);
      CREATE TABLE public.fact_medicion_solar (
        fecha_hora timestamp, condicion_key smallint, franja_key smallint,
        energia_consumida_total_wh real, energia_generada_wh real, nivel_bateria_pct real
      );
      INSERT INTO public.dim_clima VALUES (1, 'Soleado'), (2, 'Nublado');
      INSERT INTO public.dim_hora VALUES (1, 'Día');
      INSERT INTO public.fact_medicion_solar
      SELECT '2026-01-01'::timestamp + value * interval '1 minute', 1, 1, 15, 25, 50
      FROM generate_series(1, 50) AS value;
      INSERT INTO public.fact_medicion_solar VALUES ('2026-01-02', 2, 1, 15, 25, 50);
    `);
    await db.exec(fs.readFileSync(path.join(__dirname, "../sql/supabase/SUPABASE-GRAFICAS.sql"), "utf8"));
    await db.exec("SELECT public.pgc_actualizar_graficas_energia_2026();");
    await db.exec("SET ROLE anon;");
    const response = await db.query("SELECT public.pgc_graficas_publicas_2026() AS data;");
    const data = response.rows[0].data;
    assert.equal(data.estado, "ok");
    assert.equal(data.mediciones_total, 51);
    assert.equal(data.grupos.length, 1);
    assert.equal(data.grupos[0].mediciones, 50);
    assert.equal(data.mediciones_omitidas, 1);
    assert.equal(data.histogramas.find(item => item.variable === "consumo").mediciones, 51);
    await assert.rejects(db.exec("SELECT public.pgc_actualizar_graficas_energia_2026();"), /permission denied/i);
  } finally { await db.close(); }
});