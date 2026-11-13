BEGIN;

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
        SELECT DATE_TRUNC('month', medicion.fecha_hora)::date AS mes,
               CASE WHEN clima.coincidencias IS NULL THEN 'Sin correspondencia'
                    WHEN clima.coincidencias > 1 THEN 'Clave duplicada'
                    ELSE COALESCE(clima.condicion, 'Sin dato') END AS condicion,
               CASE WHEN hora.coincidencias IS NULL THEN 'Sin correspondencia'
                    WHEN hora.coincidencias > 1 THEN 'Clave duplicada'
                    ELSE COALESCE(hora.franja, 'Sin dato') END AS franja,
               COUNT(*) AS mediciones,
            MIN(medicion.fecha_hora) AS primera_medicion,
            MAX(medicion.fecha_hora) AS ultima_medicion,
               COUNT(medicion.energia_consumida_total_wh) AS consumo_no_nulo,
               SUM(medicion.energia_consumida_total_wh::numeric) AS consumo_suma,
               COUNT(medicion.energia_generada_wh) AS generacion_no_nula,
               SUM(medicion.energia_generada_wh::numeric) AS generacion_suma
        FROM public.fact_medicion_solar AS medicion
        LEFT JOIN clima ON clima.condicion_key = medicion.condicion_key
        LEFT JOIN hora ON hora.franja_key = medicion.franja_key
        GROUP BY 1, 2, 3
    ), horas AS (
        SELECT EXTRACT(HOUR FROM fecha_hora)::integer AS hora,
               COUNT(*) AS mediciones,
               COUNT(energia_consumida_total_wh) AS consumo_no_nulo,
               SUM(energia_consumida_total_wh::numeric) AS consumo_suma,
               COUNT(energia_generada_wh) AS generacion_no_nula,
               SUM(energia_generada_wh::numeric) AS generacion_suma
        FROM public.fact_medicion_solar
        GROUP BY 1
    ), estratos AS (
        SELECT
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
            SUM(medicion.energia_consumida_total_wh::numeric) AS consumo_suma,
            COUNT(medicion.energia_generada_wh) AS generacion_no_nula,
            SUM(medicion.energia_generada_wh::numeric) AS generacion_suma
        FROM public.fact_medicion_solar AS medicion
        LEFT JOIN ubicaciones AS ubicacion ON ubicacion.ubicacion_key = medicion.ubicacion_key
        GROUP BY 1, 2
    ), totales AS (
        SELECT COUNT(*) AS mediciones,
               MIN(fecha_hora) AS primera_medicion,
               MAX(fecha_hora) AS ultima_medicion,
               COUNT(DISTINCT dispositivo_key) AS dispositivos,
               COUNT(DISTINCT ubicacion_key) AS ubicaciones,
               COUNT(energia_consumida_total_wh) AS consumo_no_nulo,
               COUNT(energia_generada_wh) AS generacion_no_nula,
               COUNT(nivel_bateria_pct) AS bateria_no_nula,
               AVG(energia_consumida_total_wh)::numeric AS consumo_promedio_wh,
               AVG(energia_generada_wh)::numeric AS generacion_promedio_wh,
               AVG(nivel_bateria_pct)::numeric AS bateria_promedio_pct,
               SUM(energia_consumida_total_wh::numeric) AS consumo_suma,
               SUM(energia_generada_wh::numeric) AS generacion_suma
        FROM public.fact_medicion_solar
    ), histogramas AS (
        SELECT 'consumo' AS variable,
               CASE WHEN energia_consumida_total_wh IS NULL THEN NULL
                    WHEN energia_consumida_total_wh < 0 THEN -1
                    WHEN energia_consumida_total_wh >= 200 THEN 20
                    ELSE FLOOR(energia_consumida_total_wh::numeric / 10)::integer END AS tramo,
               COUNT(*) AS mediciones
        FROM public.fact_medicion_solar GROUP BY 2
        UNION ALL
        SELECT 'generacion',
               CASE WHEN energia_generada_wh IS NULL THEN NULL
                    WHEN energia_generada_wh < 0 THEN -1
                    WHEN energia_generada_wh >= 200 THEN 20
                    ELSE FLOOR(energia_generada_wh::numeric / 10)::integer END,
               COUNT(*)
        FROM public.fact_medicion_solar GROUP BY 2
        UNION ALL
        SELECT 'bateria',
               CASE WHEN nivel_bateria_pct IS NULL THEN NULL
                    WHEN nivel_bateria_pct < 0 THEN -1
                    WHEN nivel_bateria_pct > 100 THEN 5
                    WHEN nivel_bateria_pct = 100 THEN 4
                    ELSE FLOOR(nivel_bateria_pct::numeric / 20)::integer END,
               COUNT(*)
        FROM public.fact_medicion_solar GROUP BY 2
    )
    SELECT true, jsonb_build_object(
        'estado', 'ok',
        'calculado_en', statement_timestamp(),
        'totales', (SELECT to_jsonb(totales) FROM totales),
        'primera_medicion', (SELECT primera_medicion FROM totales),
        'ultima_medicion', (SELECT ultima_medicion FROM totales),
        'mediciones_total', (SELECT mediciones FROM totales),
        'grupos_omitidos', (SELECT COUNT(*) FROM grupos WHERE mediciones < 10),
        'mediciones_omitidas', (SELECT COALESCE(SUM(mediciones), 0) FROM grupos WHERE mediciones < 10),
        'grupos', (SELECT COALESCE(jsonb_agg(to_jsonb(grupos) - 'primera_medicion' - 'ultima_medicion' ORDER BY mes, condicion, franja), '[]'::jsonb) FROM grupos WHERE mediciones >= 10),
        'horas_omitidas', (SELECT COUNT(*) FROM horas WHERE mediciones < 10),
        'horas', (SELECT COALESCE(jsonb_agg(to_jsonb(horas) ORDER BY hora), '[]'::jsonb) FROM horas WHERE mediciones >= 10),
        'ubicaciones_omitidas', (SELECT COUNT(*) FROM estratos WHERE mediciones < 10),
        'ubicaciones', (SELECT COALESCE(jsonb_agg(to_jsonb(estratos) ORDER BY dimension, categoria), '[]'::jsonb) FROM estratos WHERE mediciones >= 10),
        'histogramas', (SELECT COALESCE(jsonb_agg(to_jsonb(histogramas) ORDER BY variable, tramo), '[]'::jsonb) FROM histogramas WHERE mediciones >= 10),
        'tramos_omitidos', (SELECT COUNT(*) FROM histogramas WHERE mediciones < 10)
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