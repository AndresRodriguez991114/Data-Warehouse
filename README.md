# Energía sostenible

Sitio estático del proyecto de Data Warehouse, con un dashboard público, consultas SQL y material de entrega.

## Estructura

- `index.html`, `styles.css` y los archivos JavaScript: aplicación web. Permanecen en la raíz para publicar directamente con GitHub Pages o Vercel.
- [`docs/entrega/`](docs/entrega/): guía de entrega, instrucciones de Power BI, informe técnico y guion del video.
- [`docs/despliegue/`](docs/despliegue/): configuración de Supabase y despliegue en Vercel.
- [`sql/analisis/`](sql/analisis/): diagnóstico y consultas analíticas.
- [`sql/supabase/`](sql/supabase/): scripts de caché, gráficas y actualización programada.
- [`tests/`](tests/): pruebas de agregados, navegador, SQL y dashboard.

## Documentación principal

- [Guía de entrega](docs/entrega/GUIA-ENTREGA.md)
- [Power BI paso a paso](docs/entrega/POWER-BI-PASO-A-PASO.md)
- [Informe técnico](docs/entrega/INFORME-TECNICO.md)
- [Guion del video](docs/entrega/GUION-VIDEO.md)
- [Conectar Supabase y Vercel](docs/despliegue/CONECTAR-SUPABASE-VERCEL.md)

## Documentación del dashboard

- [Guía de gráficas](GUIA-GRAFICAS-CLASIFICADAS.md) - Visualizaciones, interpretación y límites
- [Resumen de gráficas](RESUMEN-GRAFICAS.md) - Agregaciones disponibles
- [Checklist de implementación](CHECKLIST-IMPLEMENTACION.md) - Código listo y activación pendiente en Supabase
- [Resumen de implementación](IMPLEMENTACION-RESUMEN.md) - Componentes y pruebas

## Acceso a gráficas

- **Página principal:** [index.html](index.html)
- **Gráficas clasificadas:** [graficas-clasificadas.html](graficas-clasificadas.html)

El dashboard usa solo funciones RPC de Supabase que devuelven cachés agregadas. Cron y el navegador están configurados para un intervalo de cinco minutos; la activación del trabajo de Cron debe realizarse en el proyecto de Supabase.

## Pruebas

Ejecutar desde la raíz del repositorio:

```powershell
node --test
```