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

## Documentación de gráficas

- [Clasificación de gráficas](docs/CLASIFICACION-GRAFICAS.md) - Tipos y organización de gráficas
- [Guía de gráficas clasificadas](GUIA-GRAFICAS-CLASIFICADAS.md) - Cómo usar e interpretar las gráficas
- [Resumen visual](RESUMEN-GRAFICAS.md) - Estructura y matriz de gráficas

## Acceso a gráficas

- **Página principal:** [index.html](index.html)
- **Gráficas clasificadas:** [graficas-clasificadas.html](graficas-clasificadas.html)

### Categorías de gráficas disponibles

1. **Gráficas básicas y de comparación** - Comparan valores entre categorías
2. **Gráficas de distribución y frecuencia** - Muestran cómo se distribuyen los datos
3. **Gráficas de relación y composición** - Muestran tendencias y evolución temporal
4. **Gráficas especializadas** - Análisis técnicos y combinaciones complejas

## Pruebas

Ejecutar desde la raíz del repositorio:

```powershell
node --test
```