# Clasificación de Gráficas - Proyecto Energía Solar Comunitaria

## Descripción General

Las gráficas del proyecto ahora se organizan según **cuatro categorías principales** basadas en la forma en que presentan y organizan los datos. Esta clasificación facilita la comprensión del análisis y permite identificar rápidamente qué tipo de gráfica es más apropiada para cada pregunta.

## Tipos de Gráficas

### 1. Gráficas Básicas y de Comparación 📊

**Objetivo:** Comparan valores entre diferentes categorías o grupos para identificar diferencias y tendencias.

**Uso:** Determinar cuáles son las características más frecuentes o cómo varían los promedios según diferentes factores.

**Gráficas incluidas:**
- **Mediciones por condición climática** - Frecuencia de mediciones por condición (Despejado, Nublado, Lluvia, etc.)
- **Generación promedio por clima** - Promedio ponderado de energía generada según condiciones climáticas
- **Consumo promedio por franja** - Promedio ponderado de consumo en diferentes franjas horarias (Día, Noche)

**Tipos de gráficas:** Gráficas de barras

**Colores utilizados:**
- Generación: Verde (#176d52)
- Consumo: Naranja (#ca6d39)
- Condición climática: Marrón (#b36d43)

---

### 2. Gráficas de Distribución y Frecuencia 📈

**Objetivo:** Mostrar cómo se distribuyen los datos en intervalos o rangos para identificar patrones de frecuencia.

**Uso:** Ver dónde se concentran la mayoría de las mediciones y qué tan dispersos están los datos.

**Gráficas incluidas:**
- **Distribución del consumo** - Intervalos de 10 Wh (0-10, 10-20, ... 190-200+)
- **Distribución de la generación** - Intervalos de 10 Wh
- **Distribución del nivel de batería** - Intervalos de 20% (0-20%, 20-40%, ... 80-100%)

**Tipos de gráficas:** Gráficas de barras (histogramas)

**Características:**
- El límite superior de cada intervalo está excluido (excepto el último)
- Se muestra el número absoluto de mediciones y el porcentaje del total
- Información adicional en tabla expandible debajo de cada gráfica

---

### 3. Gráficas de Relación y Composición 📉

**Objetivo:** Mostrar tendencias, evolución temporal y combinaciones de variables para identificar relaciones.

**Uso:** Analizar cómo varían las variables a lo largo del tiempo y qué patrones se repiten.

**Gráficas incluidas:**
- **Generación promedio por mes** - Evolución temporal de la generación promedio
- **Consumo promedio por mes** - Evolución temporal del consumo promedio
- **Consumo por clima y franja** (interactivo) - Análisis combinado filtrando por mes

**Tipos de gráficas:** 
- Gráficas de líneas (para análisis temporal)
- Gráficas de barras (para combinaciones)

**Característica especial:**
- La gráfica "Consumo por clima y franja" es **interactiva** - permite cambiar el mes para ver cómo varía la combinación de variables

---

### 4. Gráficas Especializadas 🔬

**Objetivo:** Análisis técnicos específicos del sistema energético.

**Uso:** Hacer análisis multidimensionales y combinaciones de variables particulares.

**Gráficas incluidas:**
- **Balance energético general** - Relación entre generación total y consumo total del período
- **Consumo por clima y franja** (versión interactiva) - Permite analizar las interacciones entre múltiples dimensiones

**Tipos de gráficas:** Gráficas de pastel, gráficas de burbujas, análisis combinados

---

## Estructura de Archivos

### Archivos nuevos creados:

1. **chart-classification.js**
   - Define la clasificación de todas las gráficas
   - Organiza las gráficas por categoría
   - Proporciona funciones para acceder a las gráficas clasificadas

2. **graficas-clasificadas.html**
   - Página dedicada a visualizar las gráficas clasificadas
   - Interfaz organizada por tipo de gráfica
   - Filtros interactivos para análisis específicos

### Archivos modificados:

1. **graficas.js**
   - Ahora usa la clasificación de gráficas
   - Renderiza las gráficas agrupadas por categoría
   - Mejora la estructura visual con encabezados de categoría

2. **styles.css**
   - Nuevos estilos para las categorías de gráficas
   - Estilos para los encabezados de categoría
   - Mejoras en la presentación visual

3. **index.html** (opcional)
   - Puede incluir un enlace a la página de gráficas clasificadas

---

## Cómo Usar

### Acceso a las gráficas clasificadas:

```html
<!-- Desde index.html, agregar enlace -->
<a href="graficas-clasificadas.html">Ver gráficas clasificadas</a>
```

### Importar la clasificación en otros archivos:

```javascript
// Importar todas las funciones de clasificación
import { chartClassification, getAllChartsByCategory, getChartById } from './chart-classification.js';

// Obtener todas las categorías
const categories = getAllChartsByCategory();

// Obtener una gráfica específica
const chart = getChartById('grafica-distribucion-consumo');
```

---

## Guía de Colores

| Elemento | Color | Código |
|----------|-------|--------|
| Generación | Verde oscuro | #176d52 |
| Consumo | Naranja | #ca6d39 |
| Batería | Verde medio | #668f61 |
| Condición climática | Marrón | #b36d43 |
| Tinta (texto) | Gris oscuro | #282d30 |
| Fondo | Gris claro | #f5f6f5 |

---

## Propiedades de Cada Gráfica

Cada gráfica contiene:

- **id:** Identificador único de la gráfica
- **title:** Título legible en español
- **description:** Descripción del contenido y metodología
- **chartType:** Tipo de gráfica (bar, line, pie, etc.)
- **unit:** Unidad de medida mostrada
- **color:** Color principal de la gráfica
- **dataSource:** Función que obtiene los datos (histogram, groupAverage, groupCounts, combined)
- **variable:** Variable específica (consumo, generacion, bateria)
- **isInteractive:** Si la gráfica permite interacción del usuario

---

## Ejemplo de Uso en JavaScript

```javascript
// Obtener la clasificación completa
const comparacion = chartClassification.comparacion;
console.log(comparacion.category); // "Gráficas básicas y de comparación"
console.log(comparacion.description);
console.log(comparacion.charts); // Array de 3 gráficas

// Renderizar todas las categorías
Object.entries(chartClassification).forEach(([key, category]) => {
  console.log(`${category.category}:`);
  category.charts.forEach(chart => {
    console.log(`  - ${chart.title}`);
  });
});
```

---

## Ventajas de esta Clasificación

✅ **Organización clara:** Las gráficas están agrupadas por tipo, facilitando la búsqueda  
✅ **Comprensión rápida:** Cada categoría explica su propósito claramente  
✅ **Escalabilidad:** Fácil agregar nuevas gráficas a categorías existentes  
✅ **Mantenibilidad:** Cambios en una gráfica no afectan otras categorías  
✅ **Documentación:** Cada gráfica está completamente documentada  
✅ **Accesibilidad:** Los usuarios pueden navegar por tipo de análisis que necesitan  

---

## Próximas Mejoras

- [ ] Agregar filtros adicionales por rango de fechas
- [ ] Exportar gráficas a formatos PDF/PNG
- [ ] Agregar gráficas de análisis estadístico avanzado
- [ ] Crear comparativas entre períodos diferentes
- [ ] Agregar análisis predictivo
