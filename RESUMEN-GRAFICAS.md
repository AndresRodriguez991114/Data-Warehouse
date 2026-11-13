# Resumen de gráficas

Las visualizaciones de `index.html` se generan desde los agregados almacenados en Supabase. Se consultan mediante `pgc_graficas_publicas_2026`; Supabase Cron y el navegador usan un intervalo de cinco minutos.

| Visualización | Tipo | Agregación |
|---|---|---|
| Mediciones por condición climática | Barras | Conteo por condición |
| Generación promedio por clima | Barras | Promedio ponderado por valores no nulos |
| Consumo promedio por franja | Barras | Promedio ponderado por valores no nulos |
| Consumo total por ubicación | Barras | Suma por estrato o, si no existe, barrio |
| Generación total por ubicación | Barras | Suma por estrato o, si no existe, barrio |
| Distribución del consumo | Histograma | Intervalos de 10 Wh |
| Distribución de la generación | Histograma | Intervalos de 10 Wh |
| Distribución del nivel de batería | Histograma | Intervalos de 20 % |
| Generación promedio por mes | Línea | Promedio ponderado por valores no nulos |
| Consumo promedio por mes | Línea | Promedio ponderado por valores no nulos |
| Generación total por hora del día | Línea | Suma de `fecha_hora`, horas 0–23 |
| Consumo total por hora del día | Línea | Suma de `fecha_hora`, horas 0–23 |
| Consumo por clima y franja | Barras interactivas | Promedio conjunto, con selector de mes |

Cada gráfico incluye una tabla expandible con valores y conteos. Las funciones de Supabase omiten grupos con menos de 10 mediciones. La suma por hora cubre el período completo, por lo que no debe interpretarse como valor promedio de un día.

Los hallazgos y sugerencias de seguimiento se calculan con la misma respuesta agregada. Para la instalación y verificación, consulta [la guía de conexión](docs/despliegue/CONECTAR-SUPABASE-VERCEL.md).
