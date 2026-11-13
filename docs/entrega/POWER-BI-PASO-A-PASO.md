# Power BI con el Data Warehouse de energía solar

Esta guía utiliza los nombres de tablas y columnas proporcionados. Los resultados, la calidad de los datos, las relaciones y la definición de cada medición aún deben verificarse; no se han consultado los registros.

## 1. Diagnóstico inicial

En Supabase, abrir **SQL Editor**, pegar el contenido de `../../sql/analisis/DIAGNOSTICO-DATOS.sql` y ejecutarlo. La consulta solo lee datos y devuelve una fila con cantidad, período, promedios, faltantes y valores que requieren revisión. Compartir los resultados agregados, sin contraseñas ni datos personales.

Los promedios son por registro no nulo, no por vivienda ni necesariamente por hora. La columna de dispositivos cuenta identificadores distintos con mediciones, no confirma que estén activos actualmente. Los valores negativos o fuera de rango son señales para investigar, no razones automáticas para eliminarlos.

## 2. Conectar Power BI Desktop

1. En Supabase, consultar **Connect / Conectar** o la configuración de base de datos del proyecto para obtener el servidor PostgreSQL, puerto, nombre de base de datos y usuario. La URL web `https://zlvqxkezmlswzfozlhwy.supabase.co` no es el servidor PostgreSQL que se debe ingresar en Power BI. Utilizar la conexión directa o el pooler compatible disponible para tu red. No compartir la contraseña ni guardar credenciales en el sitio.
2. En Power BI Desktop, elegir **Obtener datos > Base de datos > Base de datos PostgreSQL**. Introducir el servidor y puerto indicados por Supabase, por ejemplo `servidor:puerto`, y el nombre de la base. Elegir **Importar**. Introducir usuario y contraseña directamente en la ventana de Power BI cuando los solicite. Si Desktop solicita el controlador PostgreSQL, seguir su indicación de instalación.
3. En el navegador de tablas, seleccionar `fact_medicion_solar`, `dim_fecha`, `dim_hora`, `dim_clima`, `dim_dispositivo` y `dim_ubicacion` del esquema `public`. Cargar o transformar los datos. El millón de filas puede tardar: comprobar el conteo real y no suponer que la carga se completó si hay un error.
4. En la vista **Modelo**, comprobar que las claves de cada dimensión no tengan duplicados y que las claves de los hechos tengan correspondencia. Crear o verificar relaciones activas de uno a varios, con filtro de la dimensión al hecho:

| Dimensión, lado 1 | Hechos, lado varios |
| --- | --- |
| `dim_fecha[fecha_key]` | `fact_medicion_solar[fecha_key]` |
| `dim_hora[franja_key]` | `fact_medicion_solar[franja_key]` |
| `dim_clima[condicion_key]` | `fact_medicion_solar[condicion_key]` |
| `dim_dispositivo[dispositivo_key]` | `fact_medicion_solar[dispositivo_key]` |
| `dim_ubicacion[ubicacion_key]` | `fact_medicion_solar[ubicacion_key]` |

Aunque `dim_dispositivo` también tiene `ubicacion_key`, evitar activar una segunda ruta ambigua de filtrado. Comprobar si la ubicación en la medición coincide con la asignada al dispositivo. Si una clave no es única o faltan correspondencias, investigarlo antes de interpretar gráficos; no asumir que las relaciones son válidas solo por su nombre.

## 3. Crear las medidas

En Power BI, seleccionar la tabla de hechos y usar **Modelado > Nueva medida** para cada fórmula:

```DAX
Mediciones = COUNTROWS(fact_medicion_solar)
```

```DAX
Dispositivos con mediciones = DISTINCTCOUNTNOBLANK(fact_medicion_solar[dispositivo_key])
```

```DAX
Generación promedio (Wh por medición) = AVERAGE(fact_medicion_solar[energia_generada_wh])
```

```DAX
Consumo promedio (Wh por medición) = AVERAGE(fact_medicion_solar[energia_consumida_total_wh])
```

```DAX
Batería promedio (%) = AVERAGE(fact_medicion_solar[nivel_bateria_pct])
```

```DAX
Mediciones con consumo válido = COUNT(fact_medicion_solar[energia_consumida_total_wh])
```

```DAX
Mediciones con generación válida = COUNT(fact_medicion_solar[energia_generada_wh])
```

Los promedios excluyen valores vacíos. Las dos medidas de conteo válido permiten explicar su denominador. Si la configuración regional de Power BI usa otro separador de argumentos, ajustar las fórmulas que lo requieran. **No sumar Wh** hasta confirmar que los valores son energía de intervalos no superpuestos y que no se cuentan varias veces los mismos consumos; si son lecturas acumuladas, primero calcular diferencias válidas. No sumar potencia en W como si fuera energía.

## 4. Construir los gráficos

Agregar cinco tarjetas con las cinco primeras medidas. Incluir en títulos o contexto el período, la unidad y los filtros activos. Agregar segmentadores para `dim_fecha[fecha]`, `dim_ubicacion[barrio]` y `dim_dispositivo[tipo_dispositivo]`, una vez verificadas las relaciones.

| Requisito y pregunta | Visual y campos | Medida / cuidado |
| --- | --- | --- |
| Univariado: ¿cómo se distribuye el consumo? | Histograma con grupos de `energia_consumida_total_wh` | Número de mediciones por intervalo; indicar Wh y faltantes. |
| Univariado: ¿cómo se distribuye la generación? | Histograma con grupos de `energia_generada_wh` | Número de mediciones por intervalo; indicar Wh y faltantes. |
| Univariado: ¿qué tipos de dispositivo aparecen? | Barras de `tipo_dispositivo` | `Mediciones`; aclarar que son registros, no dispositivos únicos. |
| Bivariado: ¿cómo varía el consumo por barrio? | Barras de `barrio` | `Consumo promedio (Wh por medición)` y `Mediciones con consumo válido`. |
| Bivariado: ¿cómo cambia el consumo por fecha? | Línea de `dim_fecha[fecha]` | Promedio de consumo y conteo válido; evitar comparar días con coberturas muy distintas sin aclararlo. |
| Bivariado: ¿cómo varía la generación por tipo de dispositivo? | Barras de `tipo_dispositivo` | Promedio de generación y conteo válido. |
| Multivariado: ¿cómo varía el consumo por barrio, mes y tipo? | Matriz: filas `barrio`; columnas `anio`, `mes` y `tipo_dispositivo` | Promedio de consumo y conteo válido. Cada celda combina simultáneamente barrio, año, mes y tipo. Comprobar grupos pequeños y faltantes. |

Para crear un histograma, hacer clic derecho en el campo numérico, elegir **Nuevo grupo** y configurar intervalos apropiados a los valores observados. Añadir la medida de conteo como valor. Ajustar el tamaño de intervalo y no descartar atípicos sin investigarlos.

## 5. Documentar y validar

Usar cinco de los gráficos anteriores para completar los conocimientos del sitio: pregunta, variables, procedimiento, valores, hallazgo, interpretación, utilidad, limitación y nombre del gráfico con filtros. Comparar promedios solo junto con sus conteos, período y cobertura. Revisar faltantes y valores inusuales; no afirmar causalidad.

Después formular dos decisiones, cada una con acción, hallazgo y cifras de respaldo, destinatario, mejora esperada, indicador de seguimiento y limitaciones. Aún no se pueden afirmar hallazgos ni decisiones sustentadas sin resultados reales.

Para publicación, acceso del docente e inserción del informe interactivo, seguir la sección 3 de `GUIA-ENTREGA.md`. Power BI Desktop por sí solo no proporciona un enlace interactivo insertable.