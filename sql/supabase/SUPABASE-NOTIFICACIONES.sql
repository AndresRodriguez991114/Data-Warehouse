BEGIN;

CREATE FUNCTION public.pgc_dashboard_notificar_cambio_2026()
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

CREATE TRIGGER pgc_dashboard_notificar_cambio_2026
AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE ON public.fact_medicion_solar
FOR EACH STATEMENT EXECUTE FUNCTION public.pgc_dashboard_notificar_cambio_2026();

COMMIT;