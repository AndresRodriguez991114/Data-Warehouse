SELECT
    COUNT(*) AS mediciones,
    MIN(fecha_hora) AS primera_medicion,
    MAX(fecha_hora) AS ultima_medicion,
    COUNT(DISTINCT dispositivo_key) AS dispositivos_con_mediciones,
    COUNT(DISTINCT ubicacion_key) AS ubicaciones_con_mediciones,
    COUNT(*) FILTER (WHERE fecha_hora IS NULL) AS fecha_hora_faltante,
    COUNT(*) FILTER (WHERE dispositivo_key IS NULL) AS dispositivo_faltante,
    COUNT(*) FILTER (WHERE ubicacion_key IS NULL) AS ubicacion_faltante,
    COUNT(*) FILTER (WHERE energia_generada_wh IS NULL) AS generacion_faltante,
    COUNT(*) FILTER (WHERE energia_consumida_total_wh IS NULL) AS consumo_faltante,
    COUNT(*) FILTER (WHERE nivel_bateria_pct IS NULL) AS bateria_faltante,
    COUNT(*) FILTER (WHERE energia_generada_wh < 0) AS generacion_negativa,
    COUNT(*) FILTER (WHERE energia_consumida_total_wh < 0) AS consumo_negativo,
    COUNT(*) FILTER (WHERE nivel_bateria_pct < 0 OR nivel_bateria_pct > 100) AS bateria_fuera_de_rango,
    ROUND(AVG(energia_generada_wh)::numeric, 2) AS generacion_promedio_wh_por_medicion,
    ROUND(AVG(energia_consumida_total_wh)::numeric, 2) AS consumo_promedio_wh_por_medicion,
    ROUND(AVG(nivel_bateria_pct)::numeric, 2) AS bateria_promedio_pct
FROM public.fact_medicion_solar;