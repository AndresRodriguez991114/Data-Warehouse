BEGIN;

CREATE OR REPLACE FUNCTION public.pgc_dashboard_notificar_cambio_2026()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    PERFORM realtime.send('{}'::jsonb, 'mediciones-actualizadas', 'pgc-energia-publico', false);
    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'No fue posible emitir la notificación del dashboard PGC';
    RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.pgc_dashboard_notificar_cambio_2026() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS pgc_dashboard_notificar_cambio_2026 ON public.fact_medicion_energia;
CREATE TRIGGER pgc_dashboard_notificar_cambio_2026
AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE ON public.fact_medicion_energia
FOR EACH STATEMENT EXECUTE FUNCTION public.pgc_dashboard_notificar_cambio_2026();

COMMIT;