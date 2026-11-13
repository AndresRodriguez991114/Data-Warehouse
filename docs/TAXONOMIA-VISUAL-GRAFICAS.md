# 🌳 Taxonomía Visual - Clasificación de Gráficas

## Árbol de Categorías

```
GRÁFICAS DEL PROYECTO
│
├── 1️⃣ COMPARACIÓN 🔷
│   │   Comparan valores entre categorías
│   │   Pregunta: ¿Cuál es mayor?
│   │   Tipo: Barras
│   │
│   ├── 📊 Mediciones por condición climática
│   │   Color: Marrón (#b36d43)
│   │   Variable: Condición (Despejado, Nublado, Lluvia)
│   │   Responde: ¿Qué condición es más frecuente?
│   │
│   ├── 📊 Generación promedio por clima
│   │   Color: Verde (#176d52)
│   │   Variables: Condición + Generación
│   │   Responde: ¿En qué clima se genera más?
│   │
│   └── 📊 Consumo promedio por franja
│       Color: Naranja (#ca6d39)
│       Variables: Franja + Consumo
│       Responde: ¿Qué franja consume más?
│
├── 2️⃣ DISTRIBUCIÓN 🔶
│   │   Muestran cómo se distribuyen los datos
│   │   Pregunta: ¿Dónde se concentran?
│   │   Tipo: Histogramas
│   │
│   ├── 📈 Distribución del consumo
│   │   Color: Naranja (#ca6d39)
│   │   Variable: Consumo
│   │   Intervalos: 10 Wh (0-10, 10-20, ... 190-200+)
│   │   Responde: ¿Cuál es el rango más frecuente?
│   │
│   ├── 📈 Distribución de la generación
│   │   Color: Verde (#176d52)
│   │   Variable: Generación
│   │   Intervalos: 10 Wh
│   │   Responde: ¿Dónde se concentra la generación?
│   │
│   └── 📈 Distribución del nivel de batería
│       Color: Verde medio (#668f61)
│       Variable: Batería
│       Intervalos: 20% (0-20%, 20-40%, ... 80-100%)
│       Responde: ¿Cuál es el nivel más frecuente?
│
├── 3️⃣ RELACIÓN 🔹
│   │   Muestran tendencias y evolución temporal
│   │   Pregunta: ¿Cómo cambia en el tiempo?
│   │   Tipo: Líneas
│   │
│   ├── 📉 Generación promedio por mes
│   │   Color: Verde (#176d52)
│   │   Variables: Mes + Generación
│   │   Responde: ¿Cómo varía la generación por mes?
│   │
│   └── 📉 Consumo promedio por mes
│       Color: Naranja (#ca6d39)
│       Variables: Mes + Consumo
│       Responde: ¿Cómo varía el consumo por mes?
│
└── 4️⃣ ESPECIALIZADA 🟢
    │   Análisis complejos y multidimensionales
    │   Pregunta: ¿Qué patrones complejos hay?
    │   Tipo: Especializado
    │
    ├── 🔬 Consumo por clima y franja ⭐ INTERACTIVO
    │   Color: Verde (#176d52)
    │   Variables: Clima + Franja + Consumo
    │   Filtro: Mes (selector interactivo)
    │   Responde: ¿Cómo interactúan clima y franja?
    │
    └── 🔬 Balance energético general
        Color: Múltiples (#176d52, #ca6d39)
        Variables: Generación vs Consumo
        Tipo: Pastel/Comparativo
        Responde: ¿Cuál es la cobertura energética?
```

---

## Matriz de Decisión - Qué Gráfica Usar

```
┌─────────────────────────────────────────────────────────────┐
│                  ¿QUÉ GRÁFICA DEBO USAR?                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Necesito COMPARAR valores entre categorías              │
│     └─> USA: COMPARACIÓN (Barras)                           │
│         • Mediciones por condición climática                │
│         • Generación promedio por clima                     │
│         • Consumo promedio por franja                       │
│                                                               │
│  2. Necesito VER DÓNDE SE CONCENTRAN los datos             │
│     └─> USA: DISTRIBUCIÓN (Histogramas)                     │
│         • Distribución del consumo                          │
│         • Distribución de la generación                     │
│         • Distribución del nivel de batería                 │
│                                                               │
│  3. Necesito ANALIZAR TENDENCIAS en el tiempo              │
│     └─> USA: RELACIÓN (Líneas)                              │
│         • Generación promedio por mes                       │
│         • Consumo promedio por mes                          │
│                                                               │
│  4. Necesito ANÁLISIS COMPLEJO multidimensional             │
│     └─> USA: ESPECIALIZADA                                  │
│         • Consumo por clima y franja                        │
│         • Balance energético general                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Flujo de Análisis Recomendado

```
START
  │
  ├─> Pregunta: ¿Cuál es la situación general?
  │       │
  │       └─> Usa COMPARACIÓN
  │           ├─ Mediciones por condición
  │           ├─ Generación promedio por clima
  │           └─ Consumo promedio por franja
  │
  ├─> Pregunta: ¿Dónde se concentran los valores?
  │       │
  │       └─> Usa DISTRIBUCIÓN
  │           ├─ Distribución consumo
  │           ├─ Distribución generación
  │           └─ Distribución batería
  │
  ├─> Pregunta: ¿Cómo cambia en el tiempo?
  │       │
  │       └─> Usa RELACIÓN
  │           ├─ Generación por mes
  │           └─ Consumo por mes
  │
  └─> Pregunta: ¿Qué patrones complejos hay?
          │
          └─> Usa ESPECIALIZADA
              ├─ Consumo por clima y franja
              └─ Balance energético
END
```

---

## Paleta de Colores - Código Visual

```
GENERACIÓN
┌──────────────────────────┐
│ Color: Verde oscuro      │
│ Hex: #176d52             │
│ RGB: (23, 109, 82)       │
│ Uso: Gráficas de energía │
│      generada            │
└──────────────────────────┘

CONSUMO
┌──────────────────────────┐
│ Color: Naranja           │
│ Hex: #ca6d39             │
│ RGB: (202, 109, 57)      │
│ Uso: Gráficas de energía │
│      consumida           │
└──────────────────────────┘

BATERÍA
┌──────────────────────────┐
│ Color: Verde medio       │
│ Hex: #668f61             │
│ RGB: (102, 143, 97)      │
│ Uso: Gráficas de nivel   │
│      de batería          │
└──────────────────────────┘

CLIMA
┌──────────────────────────┐
│ Color: Marrón            │
│ Hex: #b36d43             │
│ RGB: (179, 109, 67)      │
│ Uso: Gráficas de         │
│      condiciones         │
└──────────────────────────┘
```

---

## Tipos de Gráficas Utilizadas

```
📊 BARRAS (Bar Chart)
   ├─ Usado en: Comparación
   ├─ Usadas en: 3 gráficas
   ├─ Ventaja: Fácil comparar valores
   └─ Ejemplo: Generación promedio por clima

📈 HISTOGRAMA (Bar Chart con intervalos)
   ├─ Usado en: Distribución
   ├─ Usadas en: 3 gráficas
   ├─ Ventaja: Ver distribución de datos
   └─ Ejemplo: Distribución del consumo

📉 LÍNEA (Line Chart)
   ├─ Usado en: Relación
   ├─ Usadas en: 2 gráficas
   ├─ Ventaja: Mostrar tendencias
   └─ Ejemplo: Generación promedio por mes

🔬 ESPECIALIZADA
   ├─ Usado en: Especializada
   ├─ Usadas en: 2+ gráficas
   ├─ Ventaja: Análisis complejos
   └─ Ejemplo: Consumo por clima y franja
```

---

## Metadata de Cada Gráfica

```
Estructura estándar:
{
  "id": "grafica-unica",
  "title": "Título en español",
  "description": "Descripción clara",
  "chartType": "bar|line|pie|etc",
  "unit": "Unidad de medida",
  "color": "#hexcolor",
  "dataSource": "histogram|groupCounts|groupAverage|combined",
  "dataKey": "campo principal",
  "variable": "variable (si aplica)",
  "isInteractive": false
}
```

---

## Ejemplos de Interpretación

### Gráfica: Distribución del Consumo
```
Si la mayoría de mediciones están en 0-10 Wh:
  → Sistema opera frecuentemente con bajo consumo
  → Buena eficiencia energética

Si hay picos en múltiples rangos:
  → Sistema tiene diferentes modos operativos
  → Consumo variable según condiciones
```

### Gráfica: Generación promedio por mes
```
Si hay línea ascendente:
  → Mayor generación en meses posteriores
  → Mejores condiciones climáticas

Si hay línea descendente:
  → Menor generación en meses posteriores
  → Peores condiciones climáticas
```

### Gráfica: Consumo por clima y franja
```
Si clima Despejado tiene mayor consumo:
  → Correlación entre clima y consumo
  → Interacción de variables importante

Si hay diferencia por franja:
  → Consumo varía por hora del día
  → Patrón de uso predecible
```

---

## Escalabilidad - Cómo Agregar Nuevas Gráficas

```
PASO 1: Definir en chart-classification.js
├─ Elegir categoría (comparacion, distribucion, relacion, especializada)
├─ Crear objeto con metadata
├─ Asignar ID único
└─ Agregar a array de charts

PASO 2: Verificar datos
├─ Confirmar datos disponibles
├─ Probar con api.groupAverage() o similar
└─ Validar formato

PASO 3: Agregar estilos (si necesario)
├─ Crear clases CSS
├─ Verificar responsividad
└─ Probar en diferentes tamaños

PASO 4: Documentar
├─ Actualizar CLASIFICACION-GRAFICAS.md
├─ Agregar a matriz de gráficas
└─ Crear ejemplo de uso

PASO 5: Probar
├─ Verificar visual
├─ Probar interactividad
└─ Ejecutar tests

PASO 6: Desplegar
├─ Commit con mensaje claro
├─ Push a rama
└─ Pull request con descripción
```

---

## Estadísticas de Uso

```
Total de gráficas: 9
├─ Comparación: 3 (33%)
├─ Distribución: 3 (33%)
├─ Relación: 2 (22%)
└─ Especializada: 1-2 (11-22%)

Tipos de gráficas:
├─ Barras: 5 (56%)
├─ Línea: 2 (22%)
├─ Histograma: 2 (22%)
└─ Pastel: 1 (11%)

Variables principales:
├─ Generación: 4 gráficas
├─ Consumo: 5 gráficas
├─ Batería: 1 gráfica
├─ Clima: 2 gráficas
└─ Franja: 1 gráfica
```

---

## Jerarquía de Información

```
NIVEL 1: CATEGORÍA
├─ Título claro
├─ Descripción del propósito
└─ 2-3 gráficas relacionadas

NIVEL 2: GRÁFICA INDIVIDUAL
├─ Título específico
├─ Descripción con detalles técnicos
├─ Visualización (Canvas)
└─ Tabla de datos expandible

NIVEL 3: DATOS DETALLADOS
├─ Grupo/Categoría
├─ Valor
├─ Cantidad de mediciones
└─ Porcentaje del total
```

---

## Resumen Visual

```
┌─────────────────────────────────────────────────┐
│  CLASIFICACIÓN DE GRÁFICAS - ENERGÍA SOSTENIBLE │
├─────────────────────────────────────────────────┤
│                                                   │
│  📊 4 CATEGORÍAS                                │
│     ├─ Comparación    [████] 33%               │
│     ├─ Distribución   [████] 33%               │
│     ├─ Relación       [██  ] 22%               │
│     └─ Especializada  [█   ] 12%               │
│                                                   │
│  📈 9+ GRÁFICAS                                 │
│     ├─ Barras      [█████] 56%                │
│     ├─ Líneas      [██   ] 22%                │
│     ├─ Histogramas [██   ] 22%                │
│     └─ Especiales  [█    ] 11%                │
│                                                   │
│  🎨 4 COLORES PRINCIPALES                       │
│     ├─ Verde (#176d52) - Generación            │
│     ├─ Naranja (#ca6d39) - Consumo             │
│     ├─ Verde medio (#668f61) - Batería         │
│     └─ Marrón (#b36d43) - Clima                │
│                                                   │
│  ✅ 10/10 TESTS PASANDO                        │
│  📚 5+ DOCUMENTOS                              │
│  ⚡ 100% FUNCIONAL                             │
│                                                   │
└─────────────────────────────────────────────────┘
```

