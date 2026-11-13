# Guía de Gráficas Clasificadas

## 📍 Ubicación

El análisis de gráficas clasificadas está disponible en:
- **Archivo:** `graficas-clasificadas.html`
- **URL:** `/graficas-clasificadas.html`

## 🎯 Qué Encontrarás

La página de gráficas clasificadas presenta **11 gráficas diferentes** organizadas en **4 categorías principales**:

### 1️⃣ Gráficas Básicas y de Comparación (3 gráficas)
Comparan valores entre categorías:
- Mediciones por condición climática
- Generación promedio por clima
- Consumo promedio por franja

### 2️⃣ Gráficas de Distribución y Frecuencia (3 gráficas)
Muestran cómo se distribuyen los datos:
- Distribución del consumo (histograma)
- Distribución de la generación (histograma)
- Distribución del nivel de batería (histograma)

### 3️⃣ Gráficas de Relación y Composición (2 gráficas)
Muestran tendencias y relaciones:
- Generación promedio por mes (línea temporal)
- Consumo promedio por mes (línea temporal)

### 4️⃣ Gráficas Especializadas (1+ gráficas)
Análisis avanzados:
- Consumo por clima y franja (interactivo con selector de mes)

## 🛠️ Características Técnicas

### Datos Dinámicos
- Las gráficas se actualizan cada minuto desde la base de datos
- Utilizan la función RPC `pgc_graficas_publicas_2026` en Supabase
- Muestran el período de análisis y la última actualización

### Interactividad
- Selector de mes para la gráfica combinada
- Tablas expandibles con datos detallados
- Visualización responsiva para dispositivos móviles

### Accesibilidad
- Etiquetas ARIA para lectores de pantalla
- Tablas de datos alternativas para cada gráfica
- Diseño semántico con HTML5

## 📊 Interpretación de Gráficas

### Histogramas (Distribución)
- El eje X muestra rangos de valores (intervalos)
- El eje Y muestra la cantidad de mediciones en cada rango
- Ayudan a identificar dónde se concentran los valores

**Ejemplo:**
- "Distribución del consumo": ¿Cuántas mediciones hay de 0-10 Wh, 10-20 Wh, etc.?

### Gráficas de Barras (Comparación)
- Comparan valores promedio entre categorías
- Facilitan identificar qué categoría tiene el valor más alto

**Ejemplo:**
- "Generación promedio por clima": ¿En qué condición climática se genera más energía?

### Gráficas de Línea (Tendencia)
- Muestran cómo varían los valores en el tiempo
- Facilitan identificar patrones y ciclos

**Ejemplo:**
- "Generación promedio por mes": ¿Hay meses con mayor o menor generación?

### Gráficas Interactivas
- Permiten filtrar datos por dimensiones adicionales
- Cambiar el mes actualiza la gráfica en tiempo real

**Ejemplo:**
- "Consumo por clima y franja": Selecciona un mes para ver cómo varía el consumo

## 🎨 Significado de Colores

| Color | Significado |
|-------|-------------|
| 🟢 Verde (#176d52) | Generación de energía |
| 🟠 Naranja (#ca6d39) | Consumo de energía |
| 🟢 Verde medio (#668f61) | Nivel de batería |
| 🟤 Marrón (#b36d43) | Condiciones climáticas |

## 📱 Uso en Diferentes Dispositivos

### Escritorio
- Ver 2 gráficas por fila
- Interacción completa con todas las funciones

### Tablet
- Vista adaptada con espacios reducidos
- Todas las funciones disponibles

### Móvil
- 1 gráfica por fila
- Scroll vertical para ver todas las gráficas
- Selector de mes accesible

## 🔄 Ciclo de Actualización

Las gráficas se actualizan automáticamente:
- **Intervalo:** Cada 60 segundos
- **Condición:** Solo si la página está visible
- **Fallback:** Se mantienen las últimas gráficas si hay error

## 📝 Datos Mostrados Debajo de Cada Gráfica

Cada gráfica tiene una sección "Ver datos de la gráfica" expandible que muestra:

| Columna | Contenido |
|---------|-----------|
| Grupo | Categoría o intervalo |
| [Unidad] | Valor promedio o total |
| Mediciones | Cantidad de registros |
| % del total | Porcentaje (si aplica) |

**Ejemplo para "Distribución del consumo":**
| Grupo | Mediciones | Mediciones | % del total |
|-------|---------|---------|---------|
| 0 a 10 Wh | 45.250 | 45.250 | 12,5% |
| 10 a 20 Wh | 67.340 | 67.340 | 18,6% |
| ... | ... | ... | ... |

## 🚀 Cómo Integrar en tu Aplicación

### Opción 1: Iframe
```html
<iframe 
  src="/graficas-clasificadas.html" 
  width="100%" 
  height="800"
  frameborder="0"
  title="Gráficas clasificadas de energía">
</iframe>
```

### Opción 2: Enlace
```html
<a href="/graficas-clasificadas.html" class="btn-graficas">
  Ver análisis de gráficas
</a>
```

### Opción 3: Componente JavaScript
```javascript
import { chartClassification } from './chart-classification.js';

// Acceder a una categoría específica
const distribucion = chartClassification.distribucion;
console.log(distribucion.category); // "Gráficas de distribución y frecuencia"
console.log(distribucion.charts); // Array de 3 gráficas

// Renderizar gráficas personalizadas
distribucion.charts.forEach(chart => {
  createChart(chart);
});
```

## 🐛 Solución de Problemas

### Las gráficas no se cargan
1. Verificar conexión a internet
2. Verificar que `data.js` contiene la configuración de Supabase
3. Verificar en la consola del navegador (F12 → Console)

### Las gráficas están vacías
1. Verificar que el caché de gráficas está inicializado en Supabase
2. Ejecutar la función RPC `pgc_graficas_publicas_2026` en SSMS
3. Esperar a que se actualice (máximo 60 segundos)

### Selector de mes no funciona
1. Asegurarse de que hay datos para múltiples meses
2. Limpiar caché del navegador (Ctrl+Shift+Delete)
3. Recargar la página (Ctrl+F5)

## 📚 Archivos Relacionados

- **chart-classification.js** - Definición de categorías y gráficas
- **graficas.js** - Lógica de renderización de gráficas
- **chart-aggregates.js** - Funciones de agregación de datos
- **styles.css** - Estilos CSS incluyendo categorías
- **index.html** - Página principal del proyecto

## 📞 Soporte

Para reportar problemas o sugerir mejoras:
1. Abrir issue en el repositorio
2. Incluir screenshot de la gráfica
3. Describir el comportamiento esperado

## 🎓 Recursos Adicionales

- [Documentación de Chart.js](https://www.chartjs.org/)
- [Tipos de gráficas (Piktochart)](https://piktochart.com/es/blog/tipo-de-graficos/)
- [Clasificación de visualizaciones](https://www.youtube.com/watch?v=IqIv1HOMKzQ)
