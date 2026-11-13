const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

let PGlite;
try { PGlite = require(path.join(os.tmpdir(), "pgc-sql-check", "node_modules", "@electric-sql", "pglite")).PGlite; }
catch (error) { PGlite = null; }

test("el Cron programa una única actualización cada cinco minutos", { skip: !PGlite }, async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE ROLE anon NOLOGIN;
      CREATE ROLE authenticated NOLOGIN;
      CREATE TABLE public.refresh_counts (name text PRIMARY KEY, calls integer NOT NULL);
      INSERT INTO public.refresh_counts VALUES ('resumen', 0), ('graficas', 0);
      CREATE FUNCTION public.pgc_actualizar_cache_energia_2026() RETURNS void
      LANGUAGE plpgsql AS $$ BEGIN UPDATE public.refresh_counts SET calls = calls + 1 WHERE name = 'resumen'; END $$;
      CREATE FUNCTION public.pgc_actualizar_graficas_energia_2026() RETURNS void
      LANGUAGE plpgsql AS $$ BEGIN UPDATE public.refresh_counts SET calls = calls + 1 WHERE name = 'graficas'; END $$;
      CREATE SCHEMA cron;
      CREATE TABLE cron.job (jobid bigserial PRIMARY KEY, jobname text, schedule text, command text);
      CREATE FUNCTION cron.unschedule(target_jobid bigint) RETURNS boolean
      LANGUAGE plpgsql AS $$ BEGIN DELETE FROM cron.job WHERE jobid = target_jobid; RETURN FOUND; END $$;
      CREATE FUNCTION cron.schedule(target_name text, target_schedule text, target_command text) RETURNS bigint
      LANGUAGE plpgsql AS $$
      DECLARE new_jobid bigint;
      BEGIN
        INSERT INTO cron.job (jobname, schedule, command)
        VALUES (target_name, target_schedule, target_command)
        RETURNING jobid INTO new_jobid;
        RETURN new_jobid;
      END $$;
    `);

    const script = fs.readFileSync(path.join(__dirname, "../sql/supabase/SUPABASE-ACTUALIZACION-5MIN.sql"), "utf8");
    await db.exec(script);
    await db.exec(script);
    const jobs = await db.query("SELECT jobname, schedule, command, COUNT(*) OVER () AS job_count FROM cron.job;");
    assert.equal(jobs.rows.length, 1);
    assert.equal(jobs.rows[0].jobname, "pgc-dashboard-cada-5-minutos");
    assert.equal(jobs.rows[0].schedule, "*/5 * * * *");
    assert.match(jobs.rows[0].command, /pgc_actualizar_dashboard_energia_2026/);

    await db.exec("SELECT public.pgc_actualizar_dashboard_energia_2026();");
    const calls = await db.query("SELECT name, calls FROM public.refresh_counts ORDER BY name;");
    assert.deepEqual(calls.rows, [{ name: "graficas", calls: 1 }, { name: "resumen", calls: 1 }]);
  } finally {
    await db.close();
  }
});
