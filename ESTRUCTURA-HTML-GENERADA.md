# Estructura del dashboard

## Carga de scripts

`index.html` carga `data.js`, `app.js`, `chart-aggregates.js` y `graficas.js` con `defer`, en ese orden. `data.js` contiene la URL y la clave publicable de Supabase; nunca debe contener `service_role`, `sb_secret_...` ni contraseñas.

## Contenedores dinámicos

- `#metric-mediciones`, `#metric-dispositivos`, `#metric-ubicaciones`, `#metric-generacion`, `#metric-consumo`, `#metric-bateria`: métricas de la caché.
- `#exploration-status` y `#exploration-period`: estado de la consulta y cobertura temporal.
- `#exploration-charts`: grupos de gráficas comparativas, histogramas y series temporales.
- `#grafico-mes` y `#combined-chart`: comparación conjunta por clima y franja.
- `#knowledge-list` y `#decision-list`: hallazgos y sugerencias calculados con los agregados.

## Flujo de datos

1. El navegador envía una solicitud de lectura a `pgc_graficas_publicas_2026`.
2. La función devuelve la caché agregada, con conteos, período, promedios, sumas, histogramas, agregados por hora y agregados por ubicación.
3. `graficas.js` actualiza las métricas, construye las gráficas y genera hallazgos y recomendaciones descriptivas.
4. El navegador vuelve a consultar cada cinco minutos mientras la página está visible. Supabase Cron actualiza la caché en el servidor con el mismo intervalo.

La función SQL omite grupos con menos de 10 mediciones. La dimensión de ubicación usa estrato cuando está disponible y barrio como alternativa; nunca devuelve direcciones.

## Validación

Ejecuta `node --test` para validar las agregaciones, el formato de respuesta SQL, la programación de Cron y el renderizado en navegador. La activación en Supabase requiere seguir [la guía de despliegue](docs/despliegue/CONECTAR-SUPABASE-VERCEL.md).
