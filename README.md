# Energía sostenible

Sitio estático del proyecto de Data Warehouse, con un dashboard público, consultas SQL y material de entrega.

## Estructura

- `index.html`, `styles.css` y los archivos JavaScript: aplicación web. Permanecen en la raíz para publicar directamente con GitHub Pages o Vercel.
- [`docs/entrega/`](docs/entrega/): guía de entrega, instrucciones de Power BI, informe técnico y guion del video.
- [`docs/despliegue/`](docs/despliegue/): configuración de Supabase y despliegue en Vercel.
- [`sql/analisis/`](sql/analisis/): diagnóstico y consultas analíticas.
- [`sql/supabase/`](sql/supabase/): scripts activos de caché, gráficas y notificaciones.
- [`tests/`](tests/): pruebas de agregados, navegador, SQL y dashboard.

## Documentación principal

- [Guía de entrega](docs/entrega/GUIA-ENTREGA.md)
- [Power BI paso a paso](docs/entrega/POWER-BI-PASO-A-PASO.md)
- [Informe técnico](docs/entrega/INFORME-TECNICO.md)
- [Guion del video](docs/entrega/GUION-VIDEO.md)
- [Conectar Supabase y Vercel](docs/despliegue/CONECTAR-SUPABASE-VERCEL.md)

## Pruebas

Ejecutar desde la raíz del repositorio:

```powershell
node --test
```