BEGIN;

CREATE SCHEMA pgc_energia_cache_2026;
REVOKE ALL ON SCHEMA pgc_energia_cache_2026 FROM PUBLIC, anon, authenticated;

CREATE TABLE pgc_energia_cache_2026.resumen (
    unico boolean PRIMARY KEY DEFAULT true CHECK (unico),
    contenido jsonb NOT NULL
);
REVOKE ALL ON TABLE pgc_energia_cache_2026.resumen FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.pgc_actualizar_cache_energia_2026()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    INSERT INTO pgc_energia_cache_2026.resumen (unico, contenido)
    SELECT true, CASE WHEN COUNT(*) < 10 THEN
        jsonb_build_object('estado', 'insuficientes')
    ELSE jsonb_build_object(
        'estado', 'ok',
        'consultado_en', statement_timestamp(),
        'mediciones', COUNT(*),
        'primera_medicion', MIN(fecha_hora),
        'ultima_medicion', MAX(fecha_hora),
        'dispositivos', COUNT(DISTINCT dispositivo_key),
        'ubicaciones', COUNT(DISTINCT ubicacion_key),
        'generacion_no_nula', COUNT(energia_generada_wh),
        'consumo_no_nulo', COUNT(energia_consumida_total_wh),
        'bateria_no_nula', COUNT(nivel_bateria_pct),
        'generacion_promedio_wh', AVG(energia_generada_wh),
        'consumo_promedio_wh', AVG(energia_consumida_total_wh),
        'bateria_promedio_pct', AVG(nivel_bateria_pct)
    ) END
    FROM public.fact_medicion_solar
    ON CONFLICT (unico) DO UPDATE SET contenido = EXCLUDED.contenido;
$$;
REVOKE ALL ON FUNCTION public.pgc_actualizar_cache_energia_2026() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.pgc_dashboard_resumen_publico_2026()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT COALESCE(
        (SELECT contenido FROM pgc_energia_cache_2026.resumen WHERE unico = true),
        '{"estado":"sin_cache"}'::jsonb
    );
$$;
REVOKE ALL ON FUNCTION public.pgc_dashboard_resumen_publico_2026() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pgc_dashboard_resumen_publico_2026() TO anon, authenticated;

COMMIT;