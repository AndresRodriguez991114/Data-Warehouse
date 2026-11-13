# Conectar el sitio público a Supabase y Vercel

El dashboard usa exclusivamente Supabase. El navegador consulta una función RPC de lectura que devuelve una caché de estadísticas y agregados; no accede a `fact_medicion_solar` ni a las dimensiones directamente. Supabase Cron recalcula las cachés cada cinco minutos y el navegador las vuelve a consultar con esa frecuencia mientras la página está visible.

## 1. Revisar privacidad

Las funciones públicas exponen conteos, promedios, distribuciones e información agrupada de `public.fact_medicion_solar`. No devuelven filas individuales, direcciones ni identificadores de dispositivos. Se omiten los grupos con menos de 10 mediciones; ese umbral reduce la exposición, pero no garantiza anonimato frente a comparaciones entre actualizaciones. Confirma que tienes autorización para publicar los agregados.

La actualización administrativa lee la tabla completa y puede causar carga o costos. Revisa las consultas y el rendimiento en tu proyecto antes de activar la programación. No habilites acceso público a las tablas crudas, no desactives RLS y nunca uses `service_role`, `sb_secret_...`, contraseñas o cadenas de conexión en el sitio.

## 2. Crear y poblar las cachés

En el SQL Editor del mismo proyecto de Supabase:

1. Revisa y ejecuta `../../sql/supabase/SUPABASE-CACHE-PUBLICA.sql` una sola vez. Crea la caché del resumen y sus funciones. No reemplaces objetos existentes que no reconozcas.
2. Ejecuta `../../sql/supabase/SUPABASE-GRAFICAS.sql`. Crea o actualiza la caché de gráficas y sus funciones.
3. Calcula inicialmente ambas cachés:

   ```sql
   SELECT public.pgc_actualizar_cache_energia_2026();
   SELECT public.pgc_actualizar_graficas_energia_2026();
   ```

4. Comprueba los resultados:

   ```sql
   SELECT public.pgc_dashboard_resumen_publico_2026();
   SELECT public.pgc_graficas_publicas_2026();
   ```

   Ambos deben devolver `estado: ok`. Si el análisis por ubicación encuentra `estrato`, lo usa; si no, usa `barrio`. Los grupos pequeños se omiten.

## 3. Programar el refresco cada 5 minutos

1. Habilita la extensión **pg_cron** en el panel de Supabase si aún no está activa.
2. Con un rol administrador, revisa y ejecuta `../../sql/supabase/SUPABASE-ACTUALIZACION-5MIN.sql`. El script crea una función administrativa que actualiza ambas cachés y programa un único trabajo `pgc-dashboard-cada-5-minutos` con la expresión `*/5 * * * *`. Si se vuelve a ejecutar, reemplaza ese trabajo en vez de crear duplicados.
3. Ejecuta manualmente `SELECT public.pgc_actualizar_dashboard_energia_2026();` una vez y revisa **Cron Jobs** y los registros de ejecución en Supabase para confirmar que termina sin errores y dentro del intervalo.

El navegador sondea la RPC de gráficas cada cinco minutos mientras la pestaña está visible; volver a la pestaña también actualiza si ya transcurrió ese intervalo. Si Cron no está activo, la página puede seguir mostrando la última caché disponible, pero los datos no se recalculan.

## 4. Configuración de la página

`data.js` contiene la URL del proyecto y una clave **publicable** (`sb_publishable_...`). Esa clave es visible por diseño en el navegador; nunca la sustituyas por una clave secreta. La página llama únicamente a `pgc_graficas_publicas_2026`, que lee la caché agregada. Las métricas, gráficas, hallazgos y sugerencias se calculan con la respuesta actual de esa función.

Al desplegar, incluye `index.html`, `styles.css`, `data.js`, `app.js`, `chart-aggregates.js` y `graficas.js`. Vercel sirve el sitio estático; la actualización de la base se ejecuta en Supabase, no en Vercel.

## 5. Verificación posterior al despliegue

1. Abre la página publicada y comprueba que aparezcan las métricas, el período de los datos, las gráficas por mes, clima, franja, hora y ubicación, y la retroalimentación.
2. Comprueba que el estado muestre la hora de cálculo de la caché. Tras la siguiente ejecución de Cron, la hora debe avanzar; la consulta del navegador no debe realizarse más de una vez cada cinco minutos.
3. Revisa la consola del navegador y los registros de Cron si una RPC falla. No compartas credenciales ni datos individuales al solicitar ayuda.
