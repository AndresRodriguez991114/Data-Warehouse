# Checklist del dashboard Supabase

## Código

- [x] Métricas cargadas desde agregados de Supabase, sin cifras SQL Server fijadas en el dashboard.
- [x] Comparativos por clima, franja, hora, mes, distribución y ubicación.
- [x] Agrupación por estrato con alternativa a barrio si `estrato` no existe.
- [x] Hallazgos y sugerencias calculados con datos agregados.
- [x] Grupos con menos de 10 mediciones excluidos de la respuesta pública.
- [x] Sondeo del navegador cada cinco minutos.
- [x] SQL idempotente para programar un único refresco de ambas cachés cada cinco minutos.
- [x] Pruebas de navegador, agregados, SQL y programación de Cron.

## Activación requerida en Supabase

- [ ] Revisar y ejecutar `SUPABASE-CACHE-PUBLICA.sql` si la caché del resumen aún no existe.
- [ ] Ejecutar `SUPABASE-GRAFICAS.sql` y poblar ambas cachés.
- [ ] Habilitar `pg_cron` y ejecutar `SUPABASE-ACTUALIZACION-5MIN.sql` con permisos de administrador.
- [ ] Verificar el trabajo `pgc-dashboard-cada-5-minutos` y que la hora de cálculo avance.
- [ ] Desplegar la página y confirmar que las métricas y visualizaciones cargan.

La secuencia detallada está en [Conectar Supabase y Vercel](docs/despliegue/CONECTAR-SUPABASE-VERCEL.md). No uses claves secretas ni habilites acceso público a las tablas crudas.
