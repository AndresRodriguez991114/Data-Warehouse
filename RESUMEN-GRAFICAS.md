# 📊 Resumen de Gráficas Clasificadas

## Estructura de Categorías

```
GRÁFICAS DEL PROYECTO
│
├── 1️⃣ GRÁFICAS BÁSICAS Y DE COMPARACIÓN
│   ├── 📊 Mediciones por condición climática
│   │   └── Tipo: Barras | Unidad: Mediciones | Color: Marrón
│   ├── 📊 Generación promedio por clima
│   │   └── Tipo: Barras | Unidad: Wh/medición | Color: Verde
│   └── 📊 Consumo promedio por franja
│       └── Tipo: Barras | Unidad: Wh/medición | Color: Naranja
│
├── 2️⃣ GRÁFICAS DE DISTRIBUCIÓN Y FRECUENCIA
│   ├── 📈 Distribución del consumo
│   │   └── Tipo: Histograma | Intervalos: 10 Wh | Color: Naranja
│   ├── 📈 Distribución de la generación
│   │   └── Tipo: Histograma | Intervalos: 10 Wh | Color: Verde
│   └── 📈 Distribución del nivel de batería
│       └── Tipo: Histograma | Intervalos: 20% | Color: Verde medio
│
├── 3️⃣ GRÁFICAS DE RELACIÓN Y COMPOSICIÓN
│   ├── 📉 Generación promedio por mes
│   │   └── Tipo: Línea | Unidad: Wh/medición | Color: Verde
│   └── 📉 Consumo promedio por mes
│       └── Tipo: Línea | Unidad: Wh/medición | Color: Naranja
│
└── 4️⃣ GRÁFICAS ESPECIALIZADAS
    ├── 🔬 Consumo por clima y franja (interactivo)
    │   └── Tipo: Barras | Unidad: Wh/medición | Filtro: Mes
    └── 🔬 Balance energético general
        └── Tipo: Pastel/Comparativo | Unidad: Wh
```

## Matriz de Gráficas

| # | Nombre | Categoría | Tipo | Unidad | Color | Variables |
|---|--------|-----------|------|--------|-------|-----------|
| 1 | Mediciones por condición climática | Comparación | Barras | Mediciones | Marrón | Condición |
| 2 | Generación promedio por clima | Comparación | Barras | Wh/med | Verde | Condición + Generación |
| 3 | Consumo promedio por franja | Comparación | Barras | Wh/med | Naranja | Franja + Consumo |
| 4 | Distribución del consumo | Distribución | Histograma | Mediciones | Naranja | Consumo |
| 5 | Distribución de la generación | Distribución | Histograma | Mediciones | Verde | Generación |
| 6 | Distribución del nivel de batería | Distribución | Histograma | Mediciones | Verde medio | Batería |
| 7 | Generación promedio por mes | Relación | Línea | Wh/med | Verde | Mes + Generación |
| 8 | Consumo promedio por mes | Relación | Línea | Wh/med | Naranja | Mes + Consumo |
| 9 | Consumo por clima y franja | Especializada | Barras | Wh/med | Verde | Clima + Franja + Consumo |
| 10 | Balance energético general | Especializada | Pastel | Wh | Multi | Generación vs Consumo |

## Propósito de Cada Categoría

### 🔷 Comparación (3 gráficas)
**¿Cuándo usarlas?**
- Necesitas comparar valores entre categorías
- Quieres identificar qué categoría tiene el valor más alto o más bajo
- Buscas diferencias entre grupos

**Preguntas que responden:**
- ¿En qué condición climática se genera más energía?
- ¿Cuál franja horaria consume más energía?
- ¿Qué condición climática es más frecuente?

### 🔶 Distribución (3 gráficas)
**¿Cuándo usarlas?**
- Necesitas ver cómo se distribuyen los datos
- Quieres identificar valores anómalos o extremos
- Buscas entender la concentración de datos

**Preguntas que responden:**
- ¿Cuál es el rango de consumo más frecuente?
- ¿Dónde se concentra la mayoría de mediciones?
- ¿Hay valores extremos o anomalías?

### 🔹 Relación (2 gráficas)
**¿Cuándo usarlas?**
- Necesitas ver tendencias en el tiempo
- Quieres identificar patrones cíclicos
- Buscas entender cómo evolucionan las variables

**Preguntas que responden:**
- ¿Cómo varía la generación a lo largo del tiempo?
- ¿Hay meses con mayor o menor consumo?
- ¿Qué patrón siguen las variables?

### 🟢 Especializada (2+ gráficas)
**¿Cuándo usarlas?**
- Necesitas análisis complejos con múltiples dimensiones
- Quieres combinar variables de forma especial
- Buscas responder preguntas específicas del negocio

**Preguntas que responden:**
- ¿Cómo interactúan el clima y la franja horaria en el consumo?
- ¿Qué es más importante: generación o consumo?
- ¿Cuál es la cobertura energética del sistema?

## Flujo de Análisis Recomendado

```
1. EMPEZAR CON COMPARACIÓN
   "¿Cuál es la tendencia general?"
   ↓
2. PROFUNDIZAR CON DISTRIBUCIÓN
   "¿Dónde se concentran los datos?"
   ↓
3. ANALIZAR RELACIÓN
   "¿Cómo cambia en el tiempo?"
   ↓
4. EXPLORAR ESPECIALIZADA
   "¿Qué patrones complejos hay?"
```

## Acceso Rápido

### Para desarrolladores
```javascript
// Importar clasificación
import { chartClassification } from './chart-classification.js';

// Acceder a una categoría
const comparacion = chartClassification.comparacion;

// Iterar sobre gráficas
comparacion.charts.forEach(chart => {
  console.log(chart.title); // "Mediciones por condición climática"
});
```

### Para usuarios
1. Abre `graficas-clasificadas.html`
2. Lee el encabezado de cada categoría
3. Haz scroll para ver todas las gráficas
4. Usa el filtro de mes para la gráfica interactiva
5. Expande "Ver datos de la gráfica" para ver números exactos

## Personalización

### Agregar nueva gráfica
1. Editar `chart-classification.js`
2. Agregar entrada a la categoría correspondiente
3. Incluir los campos: title, description, chartType, unit, color, etc.
4. Verificar que los datos estén disponibles

### Cambiar colores
Editar en `chart-classification.js` o `styles.css`:
- Verde generación: `#176d52`
- Naranja consumo: `#ca6d39`
- Verde batería: `#668f61`

### Modificar categorías
1. Editar la estructura en `chart-classification.js`
2. Actualizar estilos en `styles.css`
3. Actualizar documentación

## Estadísticas

| Métrica | Cantidad |
|---------|----------|
| Total de gráficas | 10+ |
| Categorías | 4 |
| Tipos de gráficas | 5 (barras, línea, pastel, histograma, especializada) |
| Variables analizadas | 4 (consumo, generación, batería, clima) |
| Dimensiones | 5 (clima, franja, mes, tiempo, ubicación) |

## Notas Técnicas

- **Framework:** Chart.js 4.4.8
- **Backend:** Supabase (función RPC)
- **Actualización:** Cada 60 segundos
- **Responsivo:** Sí (móvil, tablet, desktop)
- **Accesibilidad:** WCAG 2.1 (en progreso)

## Timeline de Implementación

- ✅ Estructura de clasificación (chart-classification.js)
- ✅ Página HTML dedicada (graficas-clasificadas.html)
- ✅ Renderización categorizada (graficas.js)
- ✅ Documentación completa
- 🔄 Tests unitarios (próximo)
- 🔄 Integración en index.html (próximo)
- 🔄 Análisis estadístico avanzado (futuro)
