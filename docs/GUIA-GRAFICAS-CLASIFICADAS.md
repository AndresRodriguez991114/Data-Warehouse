# Guía de gráficas y análisis

## Fuente y actualización

La página principal consulta `pgc_graficas_publicas_2026` en Supabase. La función devuelve datos agregados desde caché; el navegador no consulta las tablas de mediciones directamente. Supabase Cron recalcula las cachés cada cinco minutos y la página vuelve a consultar mientras está visible con el mismo intervalo.

Para configurar las cachés y el trabajo programado, sigue [la guía de conexión a Supabase y Vercel](docs/despliegue/CONECTAR-SUPABASE-VERCEL.md).

## Gráficas incluidas

La sección **Dashboard de energía** de `index.html` presenta doce gráficas y una comparación adicional seleccionable por mes:

| Grupo | Gráficas |
|---|---|
| Comparativos operativos | Mediciones por clima; generación promedio por clima; consumo promedio por franja; consumo y generación por ubicación |
| Distribución y frecuencia | Histogramas de consumo, generación y nivel de batería |
| Tendencias de tiempo | Generación y consumo promedio por mes; generación y consumo total por hora del día |
| Comparación interactiva | Consumo promedio por clima y franja para el mes seleccionado |

El análisis por hora usa la hora de `fecha_hora` y suma energía en todo el período; no representa un promedio diario. El análisis de ubicación usa `estrato` cuando existe en `dim_ubicacion`; si no, usa `barrio`. Los grupos con menos de 10 mediciones se omiten.

Cada gráfica incluye una tabla expandible con los valores y el conteo del grupo. Las unidades y el período se indican junto al gráfico.

Las barras usan colores variados para distinguir las categorías dentro de cada gráfica; los colores se reutilizan y no identifican una categoría de forma global. Las gráficas se animan al entrar en pantalla, salvo cuando el navegador solicita movimiento reducido.

## Hallazgos y decisiones

Los hallazgos muestran el período, el balance total, los máximos observados por hora, la comparación de promedios por clima y los grupos con mayor consumo por franja o ubicación. Las sugerencias proponen líneas de investigación y seguimiento, no causalidad ni cambios automáticos del sistema.

La cobertura se calcula como generación total / consumo total. Si el consumo es cero o no está disponible, la cobertura se informa como no calculable. Las comparaciones por clima, franja y ubicación se basan en los grupos publicados por Supabase y pueden excluir grupos pequeños.

## Solución de problemas

- Si aparece un error de carga, confirma que ambas cachés fueron calculadas y que `data.js` contiene la URL y una clave publicable válida.
- Si la fecha de cálculo no avanza, revisa la ejecución `pgc-dashboard-cada-5-minutos` en Supabase Cron.
- Si faltan categorías por hora o ubicación, revisa los conteos de esos grupos; los que tienen menos de 10 mediciones se omiten.
- No ejecutes estas funciones públicas con una clave secreta ni publiques filas, direcciones o credenciales.
