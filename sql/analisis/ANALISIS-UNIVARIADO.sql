WITH dispositivos AS (
    SELECT dispositivo_key, COUNT(*) AS coincidencias,
           CASE WHEN COUNT(*) = 1 THEN MAX(tipo_dispositivo) END AS tipo_dispositivo
    FROM public.dim_dispositivo
    GROUP BY dispositivo_key
), frecuencias AS (
    SELECT 'consumo_wh' AS variable,
           FLOOR(medicion.energia_consumida_total_wh::numeric / 10) * 10 AS inicio_tramo_wh,
           NULL::text AS categoria,
           COUNT(*) AS mediciones
    FROM public.fact_medicion_solar AS medicion
    GROUP BY 2
    UNION ALL
    SELECT 'generacion_wh',
           FLOOR(medicion.energia_generada_wh::numeric / 10) * 10,
           NULL::text,
           COUNT(*)
    FROM public.fact_medicion_solar AS medicion
    GROUP BY 2
    UNION ALL
    SELECT 'tipo_dispositivo', NULL::numeric,
           CASE WHEN dispositivo.coincidencias IS NULL THEN '[clave sin correspondencia]'
                WHEN dispositivo.coincidencias > 1 THEN '[clave duplicada]'
                WHEN dispositivo.tipo_dispositivo IS NULL THEN '[tipo sin dato]'
                ELSE dispositivo.tipo_dispositivo END,
           COUNT(*)
    FROM public.fact_medicion_solar AS medicion
    LEFT JOIN dispositivos AS dispositivo ON medicion.dispositivo_key = dispositivo.dispositivo_key
    GROUP BY 3
)
SELECT variable, inicio_tramo_wh, categoria, mediciones
FROM frecuencias
ORDER BY variable, inicio_tramo_wh, categoria;