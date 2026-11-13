# Conectar el sitio público a Supabase y Vercel

La conexión aún requiere configuración en tu proyecto. El dashboard muestra un resumen histórico hasta que se complete. El sitio consulta una caché al abrir la página y, mientras esté visible, como máximo una vez por minuto. La caché debe actualizarse por separado, manualmente o con una tarea programada. No es una visualización instantánea cada dos segundos; si la tarea falla o no existe, el resumen queda antiguo aunque el sitio siga consultándolo.

## 1. Revisar privacidad antes de publicar

La función propuesta devuelve públicamente conteos, período y promedios globales de toda `public.fact_medicion_solar`. **Cualquier persona podrá consultarlos**, también directamente fuera del sitio. No devuelve filas, identificadores individuales, nombres, ubicaciones ni direcciones y no modifica las políticas actuales de las tablas. La función usa `SECURITY DEFINER`, por lo que omite las restricciones de filas de su propietario: revísala antes de ejecutarla y úsala solo si tienes autorización para publicar esos agregados. El mínimo de 10 filas no garantiza anonimato, especialmente al comparar resúmenes sucesivos.

Revisa por separado en Supabase las políticas RLS y permisos existentes de `fact_medicion_solar` y las dimensiones, en particular `dim_ubicacion`, que contiene direcciones. Este script no corrige permisos inseguros preexistentes ni los cambia: no actives acceso público a las tablas crudas ni desactives RLS. Revisa las políticas con cuidado antes de modificarlas para no interrumpir otras aplicaciones.

La actualización de la caché lee toda la tabla y puede causar carga o costos. Los visitantes consultan solo el resumen precalculado, pero pueden invocar esa función pública repetidamente; para una publicación prolongada considera limitación de solicitudes del lado servidor y monitorea el uso. Si no puedes aceptar el riesgo, no publiques la función.

## 2. Activar el resumen

1. En Supabase, abre **SQL Editor > New query**.
2. Copia el contenido de `SUPABASE-CACHE-PUBLICA.sql`, revísalo y ejecútalo una vez. Crea un esquema y una tabla de caché privados, una función de actualización administrativa y reemplaza la función pública de este dashboard para que lea la caché. No altera las tablas de mediciones ni sus políticas. Si los nombres ya existen inesperadamente, no reemplaces nada sin revisarlo.
3. En una consulta nueva ejecuta `SELECT public.pgc_actualizar_cache_energia_2026();`. Este cálculo recorre toda la tabla y puede tardar. No habilites su ejecución para usuarios públicos. Luego ejecuta `SELECT public.pgc_dashboard_resumen_publico_2026();`: debe devolver `estado: ok` y los indicadores. Si falla, comparte el mensaje sin contraseñas.
4. La clave publicable y la URL ya están configuradas en `data.js`. Es una clave pública: aparecerá en el navegador y en el repositorio. Nunca uses ni compartas `service_role`, `sb_secret_...`, contraseñas o cadenas de conexión.
5. Para refrescar la caché automáticamente, primero verifica que el cálculo manual termine en menos de un minuto. Con `pg_cron` habilitado y acceso de administrador, programa `SELECT public.pgc_actualizar_cache_energia_2026();` cada minuto desde Supabase Cron. Vigila duración, errores y costos; si es demasiado pesado, usa un intervalo mayor. Sin tarea programada, vuelve a ejecutar el cálculo manualmente y los datos no serán actuales.

## 3. Activar avisos de cambio

El sitio vuelve a leer la caché cada minuto mientras la pestaña esté visible. Los avisos son opcionales y **no actualizan la caché por sí mismos**: se necesita la tarea programada indicada antes.

1. Revisa y ejecuta `SUPABASE-NOTIFICACIONES.sql` una sola vez en SQL Editor. Crea una función y un **trigger** en `fact_medicion_solar`: es un cambio en el comportamiento de escritura de la tabla. El aviso público lleva un objeto vacío, sin filas ni identificadores. Si el envío falla, la escritura continúa y se registra una advertencia.
2. Las notificaciones se generan una vez por sentencia de inserción, actualización, eliminación o truncado. Una fuente que escriba constantemente puede generar muchos mensajes y costos de Realtime; revisa los límites de tu plan. En cargas masivas prueba primero en un entorno de prueba.
3. Con la página abierta, inserta o actualiza un registro **solo en un entorno de prueba autorizado**, espera la actualización de la caché y comprueba la página. Si el canal no está disponible, la consulta periódica sigue funcionando. La fecha «Resumen calculado» es la fecha del cálculo de la caché, no la hora de la última medición.

## 4. Publicar en Vercel

1. Sube el sitio al repositorio de GitHub autorizado: `index.html`, `styles.css`, `data.js`, `app.js` y `live-dashboard.js`. No subas secretos ni datos individuales.
2. En Vercel, selecciona **Add New > Project**, importa el repositorio y utiliza la carpeta raíz del sitio. Como es HTML estático, selecciona **Other** si solicita framework y deja vacíos los comandos de compilación y el directorio de salida si Vercel los solicita. Despliega el proyecto.
3. Abre la URL que Vercel proporcione, revisa las secciones y confirma que el dashboard muestre una hora de consulta reciente y datos reales. Abre una ventana privada para comprobar el acceso público. Verifica los cambios con una actualización autorizada en la base de prueba y revisa la consola y los registros de Supabase si hay errores.

El sitio incluye sus propias gráficas y no integra Power BI: el requisito original de Power BI interactivo permanece sin cumplir. Faltan distribuciones y análisis por grupos para completar los conocimientos y decisiones del proyecto.