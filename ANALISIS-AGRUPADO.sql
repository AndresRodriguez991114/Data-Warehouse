WITH ubicaciones AS (
    SELECT ubicacion_key, COUNT(*) AS coincidencias,
           CASE WHEN COUNT(*) = 1 THEN MAX(barrio) END AS barrio
    FROM public.dim_ubicacion
    GROUP BY ubicacion_key
), dispositivos AS (
    SELECT dispositivo_key, COUNT(*) AS coincidencias,
           CASE WHEN COUNT(*) = 1 THEN MAX(tipo_dispositivo) END AS tipo_dispositivo
    FROM public.dim_dispositivo
    GROUP BY dispositivo_key
)
SELECT
    DATE_TRUNC('month', medicion.fecha_hora)::date AS mes,
    ubicacion.barrio,
    dispositivo.tipo_dispositivo,
    COUNT(*) AS mediciones,
    COUNT(medicion.energia_consumida_total_wh) AS consumo_no_nulo,
    ROUND(AVG(medicion.energia_consumida_total_wh)::numeric, 2) AS consumo_promedio_wh_por_medicion,
    COUNT(medicion.energia_generada_wh) AS generacion_no_nula,
    ROUND(AVG(medicion.energia_generada_wh)::numeric, 2) AS generacion_promedio_wh_por_medicion,
    COUNT(medicion.nivel_bateria_pct) AS bateria_no_nula,
    ROUND(AVG(medicion.nivel_bateria_pct)::numeric, 2) AS bateria_promedio_pct,
    COUNT(*) FILTER (WHERE medicion.nivel_bateria_pct < 0 OR medicion.nivel_bateria_pct > 100) AS bateria_fuera_de_rango,
    COUNT(*) FILTER (WHERE ubicacion.coincidencias IS NULL) AS ubicacion_sin_correspondencia,
    COUNT(*) FILTER (WHERE ubicacion.coincidencias > 1) AS ubicacion_duplicada,
    COUNT(*) FILTER (WHERE dispositivo.coincidencias IS NULL) AS dispositivo_sin_correspondencia,
    COUNT(*) FILTER (WHERE dispositivo.coincidencias > 1) AS dispositivo_duplicado
FROM public.fact_medicion_solar AS medicion
LEFT JOIN ubicaciones AS ubicacion ON medicion.ubicacion_key = ubicacion.ubicacion_key
LEFT JOIN dispositivos AS dispositivo ON medicion.dispositivo_key = dispositivo.dispositivo_key
GROUP BY DATE_TRUNC('month', medicion.fecha_hora)::date, ubicacion.barrio, dispositivo.tipo_dispositivo
ORDER BY mes, ubicacion.barrio, dispositivo.tipo_dispositivo;