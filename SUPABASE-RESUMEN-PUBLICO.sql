BEGIN;

CREATE FUNCTION public.pgc_dashboard_resumen_publico_2026()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT CASE WHEN COUNT(*) < 10 THEN
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
    FROM public.fact_medicion_solar;
$$;

REVOKE ALL ON FUNCTION public.pgc_dashboard_resumen_publico_2026() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pgc_dashboard_resumen_publico_2026() TO anon, authenticated;

COMMIT;