# Resumen de implementación del dashboard

## Conexión y refresco

- La página consulta exclusivamente una función RPC de Supabase que devuelve una caché agregada.
- El navegador actualiza la respuesta cada cinco minutos mientras la pestaña está visible.
- `SUPABASE-ACTUALIZACION-5MIN.sql` programa en Supabase Cron el refresco combinado del resumen y las gráficas.
- El navegador usa una clave publicable. No se exponen tablas crudas ni una clave secreta.

## Análisis visible

El dashboard presenta seis métricas, doce gráficas y una comparación mensual interactiva. Incluye series por hora, clima, franja, mes, distribución de energía/batería y ubicación. Para ubicación usa estrato si está en la dimensión; si no, barrio. Los grupos con menos de 10 mediciones no se publican.

Los hallazgos y sugerencias de seguimiento se calculan con los agregados recibidos. Son descriptivos y muestran conteos, período y limitaciones para no confundir asociación con causalidad.

## Archivos principales

- `index.html`, `app.js`, `data.js`: página, contenido de proyecto y configuración publicable de Supabase.
- `chart-aggregates.js`, `graficas.js`: agregaciones de presentación, visualizaciones y retroalimentación.
- `sql/supabase/SUPABASE-CACHE-PUBLICA.sql`: caché y RPC de resumen.
- `sql/supabase/SUPABASE-GRAFICAS.sql`: caché y RPC de gráficas.
- `sql/supabase/SUPABASE-ACTUALIZACION-5MIN.sql`: función y programación de Cron.
- `docs/despliegue/CONECTAR-SUPABASE-VERCEL.md`: instalación y verificación.

## Verificación

Ejecuta `node --test` desde la raíz para correr las pruebas de agregados, SQL, programación de Cron y navegador. Para que el sitio en producción muestre datos actuales, también es necesario ejecutar los scripts en el proyecto autorizado de Supabase y comprobar el trabajo de Cron.
