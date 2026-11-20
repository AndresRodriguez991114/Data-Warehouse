# Energía sostenible

Sitio estático del proyecto de Data Warehouse, con un dashboard público, consultas SQL y material de entrega.

## Estructura

- `index.html`, `styles.css` y los archivos JavaScript: aplicación web. Permanecen en la raíz para publicar directamente con GitHub Pages o Vercel.
- [`sql/analisis/`](sql/analisis/): diagnóstico y consultas analíticas.
- [`sql/supabase/`](sql/supabase/): scripts de caché, gráficas y actualización programada.
- [`tests/`](tests/): pruebas de agregados, navegador, SQL y dashboard.

## Material de exposición

- [GUION-EXPOSICION.docx](GUION-EXPOSICION.docx): guion de la exposición del proyecto.

## Acceso a gráficas

- **Página principal:** [index.html](index.html)
- **Gráficas clasificadas:** [graficas-clasificadas.html](graficas-clasificadas.html)

El dashboard usa solo funciones RPC de Supabase que devuelven cachés agregadas. Cron y el navegador están configurados para un intervalo de cinco minutos; la activación del trabajo de Cron debe realizarse en el proyecto de Supabase.

## Pruebas

Ejecutar desde la raíz del repositorio:

```powershell
node --test
```