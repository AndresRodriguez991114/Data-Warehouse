BEGIN;

CREATE OR REPLACE FUNCTION public.pgc_actualizar_dashboard_energia_2026()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    PERFORM public.pgc_actualizar_cache_energia_2026();
    PERFORM public.pgc_actualizar_graficas_energia_2026();
END;
$$;
REVOKE ALL ON FUNCTION public.pgc_actualizar_dashboard_energia_2026() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
    existing_job_id bigint;
BEGIN
    IF to_regnamespace('cron') IS NULL THEN
        RAISE EXCEPTION 'Activa la extensión pg_cron en Supabase antes de programar la actualización.';
    END IF;

    FOR existing_job_id IN
        SELECT jobid
        FROM cron.job
        WHERE jobname = 'pgc-dashboard-cada-5-minutos'
    LOOP
        PERFORM cron.unschedule(existing_job_id);
    END LOOP;

    PERFORM cron.schedule(
        'pgc-dashboard-cada-5-minutos',
        '*/5 * * * *',
        'SELECT public.pgc_actualizar_dashboard_energia_2026();'
    );
END;
$$;

COMMIT;
