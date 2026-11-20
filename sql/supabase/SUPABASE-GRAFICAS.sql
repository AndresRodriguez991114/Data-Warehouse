BEGIN;

-- Verifica que la tabla de hechos unificada tenga las columnas que usa el dashboard.
DO $$
DECLARE
    faltantes text;
BEGIN
    SELECT string_agg(requerida, ', ' ORDER BY requerida) INTO faltantes
    FROM unnest(ARRAY[
        'fecha_hora', 'condicion_key', 'franja_key', 'ubicacion_key', 'dispositivo_key',
        'energia_consumida_total_wh', 'energia_generada_wh', 'nivel_bateria_pct', 'irradiancia_wm2',
        'energia_eolica_wh', 'velocidad_viento_ms'
    ]) AS requerida
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'fact_medicion_energia' AND column_name = requerida
    );
    IF faltantes IS NOT NULL THEN
        RAISE EXCEPTION 'A public.fact_medicion_energia le faltan columnas: %', faltantes;
    END IF;
END;
$$;

CREATE SCHEMA IF NOT EXISTS pgc_energia_cache_2026;
REVOKE ALL ON SCHEMA pgc_energia_cache_2026 FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS pgc_energia_cache_2026.graficas (
    unico boolean PRIMARY KEY DEFAULT true CHECK (unico),
    contenido jsonb NOT NULL
);
REVOKE ALL ON TABLE pgc_energia_cache_2026.graficas FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.pgc_actualizar_graficas_energia_2026()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    INSERT INTO pgc_energia_cache_2026.graficas (unico, contenido)
    WITH clima AS (
        SELECT condicion_key, COUNT(*) AS coincidencias,
               CASE WHEN COUNT(*) = 1 THEN MAX(condicion) END AS condicion
        FROM public.dim_clima GROUP BY condicion_key
    ), hora AS (
        SELECT franja_key, COUNT(*) AS coincidencias,
               CASE WHEN COUNT(*) = 1 THEN MAX(franja_dia) END AS franja
        FROM public.dim_hora GROUP BY franja_key
    ), ubicaciones AS (
        SELECT ubicacion_key, COUNT(*) AS coincidencias,
               CASE WHEN COUNT(*) = 1 THEN MAX(to_jsonb(ubicacion)->>'estrato') END AS estrato,
               CASE WHEN COUNT(*) = 1 THEN MAX(to_jsonb(ubicacion)->>'barrio') END AS barrio
        FROM public.dim_ubicacion AS ubicacion
        GROUP BY ubicacion_key
    ), grupos AS (
        -- Mes, clima y franja: base de las comparaciones entre energía solar, eólica y consumo.
        SELECT DATE_TRUNC('month', medicion.fecha_hora)::date AS mes,
               CASE WHEN clima.coincidencias IS NULL THEN 'Sin correspondencia'
                    WHEN clima.coincidencias > 1 THEN 'Clave duplicada'
                    ELSE COALESCE(clima.condicion, 'Sin dato') END AS condicion,
               CASE WHEN hora.coincidencias IS NULL THEN 'Sin correspondencia'
                    WHEN hora.coincidencias > 1 THEN 'Clave duplicada'
                    ELSE COALESCE(hora.franja, 'Sin dato') END AS franja,
               COUNT(*) AS mediciones,
               COUNT(medicion.energia_consumida_total_wh) AS consumo_no_nulo,
               SUM(medicion.energia_consumida_total_wh::numeric) AS consumo_suma,
               COUNT(medicion.energia_generada_wh) AS generacion_no_nula,
               SUM(medicion.energia_generada_wh::numeric) AS generacion_suma,
               COUNT(medicion.energia_eolica_wh) AS eolica_no_nula,
               SUM(medicion.energia_eolica_wh::numeric) AS eolica_suma
        FROM public.fact_medicion_energia AS medicion
        LEFT JOIN clima ON clima.condicion_key = medicion.condicion_key
        LEFT JOIN hora ON hora.franja_key = medicion.franja_key
        GROUP BY 1, 2, 3
    ), horas AS (
        -- Cada agregado lleva su mes para que el dashboard pueda filtrar todas las gráficas por mes.
        SELECT DATE_TRUNC('month', fecha_hora)::date AS mes,
               EXTRACT(HOUR FROM fecha_hora)::integer AS hora,
               COUNT(*) AS mediciones,
               COUNT(energia_consumida_total_wh) AS consumo_no_nulo,
               SUM(energia_consumida_total_wh::numeric) AS consumo_suma,
               COUNT(energia_generada_wh) AS generacion_no_nula,
               SUM(energia_generada_wh::numeric) AS generacion_suma,
               COUNT(energia_eolica_wh) AS eolica_no_nula,
               SUM(energia_eolica_wh::numeric) AS eolica_suma
        FROM public.fact_medicion_energia
        GROUP BY 1, 2
    ), estratos AS (
        SELECT
            DATE_TRUNC('month', medicion.fecha_hora)::date AS mes,
            CASE WHEN ubicacion.coincidencias IS NULL THEN 'ubicacion'
                 WHEN ubicacion.coincidencias > 1 THEN 'clave'
                 WHEN ubicacion.estrato IS NOT NULL THEN 'estrato'
                 WHEN ubicacion.barrio IS NOT NULL THEN 'barrio'
                 ELSE 'ubicacion' END AS dimension,
            CASE WHEN ubicacion.coincidencias IS NULL THEN 'Sin correspondencia'
                 WHEN ubicacion.coincidencias > 1 THEN 'Clave duplicada'
                 ELSE COALESCE(ubicacion.estrato, ubicacion.barrio, 'Sin dato') END AS categoria,
            COUNT(*) AS mediciones,
            COUNT(medicion.energia_consumida_total_wh) AS consumo_no_nulo,
            SUM(medicion.energia_consumida_total_wh::numeric) AS consumo_suma
        FROM public.fact_medicion_energia AS medicion
        LEFT JOIN ubicaciones AS ubicacion ON ubicacion.ubicacion_key = medicion.ubicacion_key
        GROUP BY 1, 2, 3
    ), recurso AS (
        -- Generación según el recurso disponible: irradiancia para la solar, viento para la eólica.
        SELECT DATE_TRUNC('month', fecha_hora)::date AS mes,
               'irradiancia' AS variable,
               LEAST(FLOOR(irradiancia_wm2::numeric / 100), 12)::integer AS tramo,
               COUNT(*) AS mediciones,
               COUNT(energia_generada_wh) AS generacion_no_nula,
               SUM(energia_generada_wh::numeric) AS generacion_suma
        FROM public.fact_medicion_energia
        WHERE irradiancia_wm2 >= 0
        GROUP BY 1, 2, 3
        UNION ALL
        SELECT DATE_TRUNC('month', fecha_hora)::date,
               'viento',
               LEAST(FLOOR(velocidad_viento_ms::numeric), 20)::integer,
               COUNT(*),
               COUNT(energia_eolica_wh),
               SUM(energia_eolica_wh::numeric)
        FROM public.fact_medicion_energia
        WHERE velocidad_viento_ms >= 0
        GROUP BY 1, 2, 3
    ), totales AS (
        SELECT COUNT(*) AS mediciones,
               MIN(fecha_hora) AS primera_medicion,
               MAX(fecha_hora) AS ultima_medicion,
               COUNT(DISTINCT dispositivo_key) AS dispositivos,
               COUNT(DISTINCT ubicacion_key) AS ubicaciones,
               COUNT(energia_consumida_total_wh) AS consumo_no_nulo,
               COUNT(energia_generada_wh) AS generacion_no_nula,
               COUNT(energia_eolica_wh) AS eolica_no_nula,
               COUNT(nivel_bateria_pct) AS bateria_no_nula,
               COUNT(irradiancia_wm2) AS irradiancia_no_nula,
               COUNT(velocidad_viento_ms) AS viento_no_nulo,
               AVG(energia_consumida_total_wh)::numeric AS consumo_promedio_wh,
               AVG(energia_generada_wh)::numeric AS generacion_promedio_wh,
               AVG(energia_eolica_wh)::numeric AS eolica_promedio_wh,
               AVG(nivel_bateria_pct)::numeric AS bateria_promedio_pct,
               AVG(irradiancia_wm2)::numeric AS irradiancia_promedio_wm2,
               AVG(velocidad_viento_ms)::numeric AS viento_promedio_ms,
               SUM(energia_consumida_total_wh::numeric) AS consumo_suma,
               SUM(energia_generada_wh::numeric) AS generacion_suma,
               SUM(energia_eolica_wh::numeric) AS eolica_suma,
               MIN(fecha_hora) FILTER (WHERE energia_generada_wh IS NOT NULL) AS solar_inicio,
               MAX(fecha_hora) FILTER (WHERE energia_generada_wh IS NOT NULL) AS solar_fin,
               MIN(fecha_hora) FILTER (WHERE energia_eolica_wh IS NOT NULL) AS eolica_inicio,
               MAX(fecha_hora) FILTER (WHERE energia_eolica_wh IS NOT NULL) AS eolica_fin
        FROM public.fact_medicion_energia
    ), ventana AS (
        -- Período en que hay datos de ambas fuentes: solo ahí se comparan sus totales.
        SELECT GREATEST(solar_inicio, eolica_inicio) AS inicio, LEAST(solar_fin, eolica_fin) AS fin
        FROM totales
    ), comun AS (
        SELECT ventana.inicio, ventana.fin,
               COUNT(medicion.fecha_hora) AS mediciones,
               COALESCE(SUM(medicion.energia_generada_wh::numeric), 0) AS generacion_suma,
               COALESCE(SUM(medicion.energia_eolica_wh::numeric), 0) AS eolica_suma,
               SUM(medicion.energia_consumida_total_wh::numeric) AS consumo_suma
        FROM ventana
        LEFT JOIN public.fact_medicion_energia AS medicion
               ON medicion.fecha_hora BETWEEN ventana.inicio AND ventana.fin
        GROUP BY ventana.inicio, ventana.fin
    )
    SELECT true, jsonb_build_object(
        'estado', 'ok',
        'version', 3,
        'calculado_en', statement_timestamp(),
        'totales', (SELECT to_jsonb(totales) FROM totales),
        'periodo_comun', (SELECT to_jsonb(comun) FROM comun),
        'primera_medicion', (SELECT primera_medicion FROM totales),
        'ultima_medicion', (SELECT ultima_medicion FROM totales),
        'mediciones_total', (SELECT mediciones FROM totales),
        'grupos_omitidos', (SELECT COUNT(*) FROM grupos WHERE mediciones < 10),
        'mediciones_omitidas', (SELECT COALESCE(SUM(mediciones), 0) FROM grupos WHERE mediciones < 10),
        'grupos', (SELECT COALESCE(jsonb_agg(to_jsonb(grupos) ORDER BY mes, condicion, franja), '[]'::jsonb) FROM grupos WHERE mediciones >= 10),
        'horas_omitidas', (SELECT COUNT(*) FROM horas WHERE mediciones < 10),
        'horas', (SELECT COALESCE(jsonb_agg(to_jsonb(horas) ORDER BY mes, hora), '[]'::jsonb) FROM horas WHERE mediciones >= 10),
        'ubicaciones_omitidas', (SELECT COUNT(*) FROM estratos WHERE mediciones < 10),
        'ubicaciones', (SELECT COALESCE(jsonb_agg(to_jsonb(estratos) ORDER BY mes, dimension, categoria), '[]'::jsonb) FROM estratos WHERE mediciones >= 10),
        'recurso_omitidos', (SELECT COUNT(*) FROM recurso WHERE mediciones < 10),
        'recurso', (SELECT COALESCE(jsonb_agg(to_jsonb(recurso) ORDER BY mes, variable, tramo), '[]'::jsonb) FROM recurso WHERE mediciones >= 10)
    )
    ON CONFLICT (unico) DO UPDATE SET contenido = EXCLUDED.contenido;
$$;
REVOKE ALL ON FUNCTION public.pgc_actualizar_graficas_energia_2026() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.pgc_graficas_publicas_2026()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT COALESCE(
        (SELECT contenido FROM pgc_energia_cache_2026.graficas WHERE unico = true),
        '{"estado":"sin_cache"}'::jsonb
    );
$$;
REVOKE ALL ON FUNCTION public.pgc_graficas_publicas_2026() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pgc_graficas_publicas_2026() TO anon, authenticated;

COMMIT;
