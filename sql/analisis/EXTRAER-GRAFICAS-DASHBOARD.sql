USE [CiudadInteligente_Cajica_DW];
GO

SET NOCOUNT ON;

-- Serie horaria: suma los hechos por hora del día en todo el período cargado.
;WITH hechos_hora AS (
    SELECT
        tiempo.hora,
        tiempo.fecha,
        TRY_CONVERT(decimal(28, 4), hecho.energia_generada_wh) AS energia_generada_wh,
        TRY_CONVERT(decimal(28, 4), hecho.energia_consumida_total_wh) AS energia_consumida_total_wh,
        TRY_CONVERT(bigint, hecho.cantidad_mediciones) AS cantidad_mediciones
    FROM dbo.Fact_Mediciones AS hecho
    INNER JOIN dbo.Dim_Tiempo AS tiempo
        ON tiempo.id_tiempo = hecho.id_tiempo
)
SELECT
    hora,
    MIN(fecha) AS primera_fecha,
    MAX(fecha) AS ultima_fecha,
    COUNT(DISTINCT fecha) AS dias_con_dato,
    COUNT_BIG(*) AS filas_agregadas,
    SUM(cantidad_mediciones) AS mediciones_origen,
    SUM(energia_generada_wh) AS energia_generada_wh,
    SUM(energia_consumida_total_wh) AS energia_consumida_total_wh,
    SUM(energia_generada_wh) - SUM(energia_consumida_total_wh) AS balance_wh,
    CAST(
        100.0 * SUM(energia_generada_wh)
        / NULLIF(SUM(energia_consumida_total_wh), 0)
        AS decimal(19, 4)
    ) AS cobertura_generacion_pct
FROM hechos_hora
GROUP BY hora
ORDER BY hora;

-- Comparación por estrato: conserva también ubicaciones sin dimensión/estrato.
;WITH hechos_estrato AS (
    SELECT
        CASE
            WHEN ubicacion.id_ubicacion IS NULL THEN N'Sin ubicación'
            WHEN ubicacion.estrato IS NULL THEN N'Sin estrato'
            ELSE CONVERT(nvarchar(50), ubicacion.estrato)
        END AS estrato,
        TRY_CONVERT(decimal(28, 4), hecho.energia_generada_wh) AS energia_generada_wh,
        TRY_CONVERT(decimal(28, 4), hecho.energia_consumida_total_wh) AS energia_consumida_total_wh,
        TRY_CONVERT(bigint, hecho.cantidad_mediciones) AS cantidad_mediciones
    FROM dbo.Fact_Mediciones AS hecho
    LEFT JOIN dbo.Dim_Ubicacion AS ubicacion
        ON ubicacion.id_ubicacion = hecho.id_ubicacion
)
SELECT
    estrato,
    COUNT_BIG(*) AS filas_agregadas,
    SUM(cantidad_mediciones) AS mediciones_origen,
    SUM(energia_generada_wh) AS energia_generada_wh,
    SUM(energia_consumida_total_wh) AS energia_consumida_total_wh,
    SUM(energia_generada_wh) - SUM(energia_consumida_total_wh) AS balance_wh,
    CAST(
        100.0 * SUM(energia_generada_wh)
        / NULLIF(SUM(energia_consumida_total_wh), 0)
        AS decimal(19, 4)
    ) AS cobertura_generacion_pct
FROM hechos_estrato
GROUP BY estrato
ORDER BY
    CASE WHEN TRY_CONVERT(int, estrato) IS NULL THEN 1 ELSE 0 END,
    TRY_CONVERT(int, estrato),
    estrato;
