# 📐 Estructura HTML Generada - Gráficas Clasificadas

## Vista General

La página `graficas-clasificadas.html` genera una estructura HTML clara y organizada:

```html
<section class="section">
  <div class="section-heading">
    <h2>Gráficas clasificadas por tipo</h2>
  </div>
  
  <!-- Status y Período -->
  <div id="exploration-status">Cargando gráficas...</div>
  <p id="exploration-period">Período: 2026-10-13 a 2026-11-13</p>
  
  <!-- Contenido Principal -->
  <div id="exploration-content">
    
    <!-- CATEGORÍA 1: COMPARACIÓN -->
    <div class="chart-category">
      <div class="category-header">
        <h3>Gráficas básicas y de comparación</h3>
        <p>Comparan valores entre diferentes categorías...</p>
      </div>
      <div class="exploration-charts">
        <figure class="exploration-chart">
          <figcaption>
            <h3>Mediciones por condición climática</h3>
            <p>Frecuencia de mediciones por condición</p>
          </figcaption>
          <div class="chart-canvas">
            <canvas id="grafica-mediciones-clima"></canvas>
          </div>
          <details class="chart-data">
            <summary>Ver datos de la gráfica</summary>
            <table><!-- Tabla de datos --></table>
          </details>
        </figure>
        <!-- Más gráficas de comparación -->
      </div>
    </div>
    
    <!-- CATEGORÍA 2: DISTRIBUCIÓN -->
    <div class="chart-category">
      <div class="category-header">
        <h3>Gráficas de distribución y frecuencia</h3>
        <p>Muestran la distribución de datos en intervalos...</p>
      </div>
      <div class="exploration-charts">
        <!-- Gráficas de distribución -->
      </div>
    </div>
    
    <!-- CATEGORÍA 3: RELACIÓN -->
    <div class="chart-category">
      <div class="category-header">
        <h3>Gráficas de relación y composición</h3>
        <p>Muestran tendencias y evolución temporal...</p>
      </div>
      <div class="exploration-charts">
        <!-- Gráficas de relación -->
      </div>
    </div>
    
    <!-- CATEGORÍA 4: ESPECIALIZADA -->
    <div class="chart-category">
      <div class="category-header">
        <h3>Gráficas especializadas</h3>
        <p>Gráficas especializadas para análisis técnicos...</p>
      </div>
      <div class="exploration-charts">
        <!-- Gráfica interactiva con selector de mes -->
        <div class="exploration-filter">
          <label for="grafico-mes">Filtrar por mes:</label>
          <select id="grafico-mes">
            <option value="2026-10">Octubre 2026</option>
            <option value="2026-11">Noviembre 2026</option>
          </select>
        </div>
        <div id="combined-chart"></div>
      </div>
    </div>
    
  </div>
</section>
```

---

## Estructura de una Gráfica Individual

```html
<figure class="exploration-chart" id="grafica-distribucion-consumo">
  
  <!-- Encabezado con Título y Descripción -->
  <figcaption>
    <h3>Distribución del consumo</h3>
    <p>Intervalos de 10 Wh · límite superior excluido · número de mediciones</p>
  </figcaption>
  
  <!-- Canvas para la Gráfica -->
  <div class="chart-canvas">
    <canvas 
      role="img" 
      aria-label="Distribución del consumo">
    </canvas>
  </div>
  
  <!-- Tabla de Datos Expandible -->
  <details class="chart-data">
    
    <summary>Ver datos de la gráfica</summary>
    
    <table>
      <thead>
        <tr>
          <th>Grupo</th>
          <th>Mediciones</th>
          <th>Mediciones</th>
          <th>% del total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>0 a 10 Wh</td>
          <td>45.250</td>
          <td>45.250</td>
          <td>12,5%</td>
        </tr>
        <tr>
          <td>10 a 20 Wh</td>
          <td>67.340</td>
          <td>67.340</td>
          <td>18,6%</td>
        </tr>
        <!-- Más filas -->
      </tbody>
    </table>
    
  </details>
  
</figure>
```

---

## Clases CSS Utilizadas

### Contenedores principales
- `.chart-category` - Contenedor de una categoría completa
- `.category-header` - Encabezado de la categoría
- `.exploration-charts` - Grid de gráficas

### Gráficas individuales
- `.exploration-chart` - Contenedor de una gráfica
- `.chart-canvas` - Área de dibujo de la gráfica
- `.chart-data` - Contenedor de datos expandible

### Filtros
- `.exploration-filter` - Contenedor de filtros
- `#grafico-mes` - Selector de mes

---

## Flujo de Renderización JavaScript

```javascript
// 1. Cargar datos desde Supabase
async function refresh() {
  const data = await fetch('/rest/v1/rpc/pgc_graficas_publicas_2026');
}

// 2. Renderizar por categoría
function render(data) {
  Object.entries(chartClassification).forEach(([key, category]) => {
    renderCategory(key, category, container);
  });
}

// 3. Para cada categoría, renderizar gráficas
function renderCategory(categoryKey, categoryData, container) {
  const categorySection = document.createElement('div');
  categorySection.className = 'chart-category';
  
  // Encabezado de categoría
  const categoryHeader = document.createElement('div');
  categoryHeader.className = 'category-header';
  categoryHeader.append(
    text('h3', categoryData.category),
    text('p', categoryData.description)
  );
  
  // Grid de gráficas
  const chartsGrid = document.createElement('div');
  chartsGrid.className = 'exploration-charts';
  
  // Renderizar cada gráfica
  categoryData.specs.forEach(spec => {
    const chart = draw(chartsGrid, ...spec);
    charts.set(spec.id, chart);
  });
  
  categorySection.append(categoryHeader, chartsGrid);
  container.append(categorySection);
}

// 4. Actualizar cada 60 segundos
window.setInterval(refresh, 60000);
```

---

## Datos Mostrados en Cada Gráfica

### Información Visual
- **Tipo de gráfica:** Barras, línea, pastel, histograma
- **Colores:** Verde (generación), Naranja (consumo), etc.
- **Etiquetas:** Claras y en español
- **Unidades:** Wh, %, Mediciones, etc.

### Información Textual
```
Título: Distribución del consumo
Descripción: Intervalos de 10 Wh · límite superior excluido · número de mediciones

Tabla de datos:
┌──────────────┬──────────┬──────────┬──────────┐
│ Grupo        │ Mediciones│ Mediciones│ % del total│
├──────────────┼──────────┼──────────┼──────────┤
│ 0 a 10 Wh    │ 45.250   │ 45.250   │ 12,5%   │
│ 10 a 20 Wh   │ 67.340   │ 67.340   │ 18,6%   │
└──────────────┴──────────┴──────────┴──────────┘
```

---

## Accesibilidad (ARIA)

```html
<!-- Roles y etiquetas ARIA -->
<canvas 
  role="img"
  aria-label="Distribución del consumo">
</canvas>

<div class="chart-canvas">
  <canvas role="img" aria-label="Título de la gráfica"></canvas>
</div>

<div 
  role="meter"
  aria-valuemin="0"
  aria-valuemax="10000"
  aria-valuenow="5000"
  aria-label="Generación: 5.000,00 Wh">
</div>
```

---

## Estilos CSS Aplicados

### Categoría
```css
.chart-category {
  margin: 48px 0;
  padding-top: 32px;
  border-top: 2px solid var(--ink);
}

.chart-category:first-of-type {
  border-top: 0;
  margin-top: 24px;
  padding-top: 0;
}
```

### Encabezado de Categoría
```css
.category-header {
  margin-bottom: 28px;
}

.category-header h3 {
  font-size: 20px;
  font-family: var(--display);
  color: var(--ink);
  margin: 0 0 8px;
}

.category-header p {
  font-size: 13px;
  color: var(--muted);
  margin: 0;
  max-width: 620px;
}
```

### Grid de Gráficas
```css
.exploration-charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 32px;
  margin: 24px 0;
}

@media (max-width: 700px) {
  .exploration-charts {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}
```

---

## Ejemplo de Renderización Completa

```html
<!DOCTYPE html>
<html>
<head>
  <title>Gráficas Clasificadas</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="exploration-content" hidden>
    
    <!-- GRÁFICAS BÁSICAS Y DE COMPARACIÓN -->
    <div class="chart-category">
      <div class="category-header">
        <h3>Gráficas básicas y de comparación</h3>
        <p>Comparan valores entre diferentes categorías...</p>
      </div>
      <div class="exploration-charts">
        <figure class="exploration-chart" id="grafica-mediciones-clima">
          <figcaption>
            <h3>Mediciones por condición climática</h3>
            <p>Frecuencia de mediciones por condición</p>
          </figcaption>
          <div class="chart-canvas">
            <canvas></canvas>
          </div>
          <details class="chart-data">
            <summary>Ver datos de la gráfica</summary>
            <table>...</table>
          </details>
        </figure>
        
        <figure class="exploration-chart" id="grafica-generacion-clima">
          <figcaption>
            <h3>Generación promedio por clima</h3>
            <p>Promedio ponderado por mediciones no nulas</p>
          </figcaption>
          <div class="chart-canvas">
            <canvas></canvas>
          </div>
          <details class="chart-data">...</details>
        </figure>
        
        <figure class="exploration-chart" id="grafica-consumo-franja">
          <figcaption>
            <h3>Consumo promedio por franja</h3>
            <p>Promedio ponderado por mediciones no nulas</p>
          </figcaption>
          <div class="chart-canvas">
            <canvas></canvas>
          </div>
          <details class="chart-data">...</details>
        </figure>
      </div>
    </div>
    
    <!-- GRÁFICAS DE DISTRIBUCIÓN Y FRECUENCIA -->
    <div class="chart-category">
      <div class="category-header">
        <h3>Gráficas de distribución y frecuencia</h3>
        <p>Muestran la distribución de datos en intervalos...</p>
      </div>
      <div class="exploration-charts">
        <!-- 3 gráficas de histogramas -->
      </div>
    </div>
    
    <!-- GRÁFICAS DE RELACIÓN Y COMPOSICIÓN -->
    <div class="chart-category">
      <div class="category-header">
        <h3>Gráficas de relación y composición</h3>
        <p>Muestran tendencias y evolución temporal...</p>
      </div>
      <div class="exploration-charts">
        <!-- 2 gráficas de líneas -->
      </div>
    </div>
    
    <!-- GRÁFICAS ESPECIALIZADAS -->
    <div class="chart-category">
      <div class="category-header">
        <h3>Gráficas especializadas</h3>
        <p>Gráficas especializadas para análisis técnicos...</p>
      </div>
      <div class="exploration-filter">
        <label for="grafico-mes">Filtrar por mes:</label>
        <select id="grafico-mes"></select>
      </div>
      <div id="combined-chart"></div>
    </div>
    
  </div>
  
  <script src="chart-aggregates.js"></script>
  <script src="graficas.js"></script>
</body>
</html>
```

---

## Interactividad

### Eventos
- **Cambio de selector de mes:** Actualiza gráfica combinada
- **Hover en gráfica:** Muestra tooltip con valores
- **Click en leyenda:** Oculta/muestra series
- **Expandir detalles:** Muestra tabla de datos

### Updates
- Las gráficas se actualizan cada 60 segundos
- Los datos se cargan desde Supabase
- Se mantienen en caché localmente
- Fallback si hay error de conexión

---

## Resumen

La estructura HTML generada es:
- ✅ **Semántica** - Usa HTML5 correctamente
- ✅ **Accesible** - Incluye ARIA labels
- ✅ **Responsive** - Adapta a todos los tamaños
- ✅ **Organizada** - Claramente estructurada por categorías
- ✅ **Interactiva** - Permite exploración de datos
- ✅ **Performante** - Carga y renderiza eficientemente
