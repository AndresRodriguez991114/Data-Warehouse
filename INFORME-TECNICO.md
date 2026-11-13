# Informe técnico: proyecto de energía solar comunitaria

**Estado:** plantilla pendiente de completar y verificar. Eliminar esta nota solo cuando se hayan sustituido todos los campos entre corchetes y se hayan incorporado evidencias reales.

## Identificación

- Proyecto: [nombre oficial].
- Programa, sede o extensión y ciclo: [datos].
- Integrantes y tipo de proyecto: [datos].
- URL del sitio publicado: [URL comprobada].
- Fecha de elaboración: [fecha].

## 1. Problema, justificación y objetivos

Describir el problema concreto de generación solar y consumo, su contexto y población beneficiaria. Registrar el objetivo general y los específicos aprobados. Explicar la pertinencia de la solución y sus antecedentes con citas verificables.

## 2. Estructura del sitio

El sitio organiza el proyecto en secciones de contexto, metodología, gestión de datos, dashboard, conocimientos, decisiones y cierre. [Describir la versión finalmente publicada, navegación, tecnología, accesibilidad y URL].

## 3. Metodología y cronograma CRISP-DM

| Etapa | Actividades realizadas | Fecha y responsable | Evidencia verificable |
| --- | --- | --- | --- |
| Comprensión del negocio | [Completar] | [Completar] | [Enlace o captura] |
| Comprensión de los datos | [Completar] | [Completar] | [Enlace o captura] |
| Preparación de los datos | [Completar] | [Completar] | [Enlace o captura] |
| Modelado | [Completar] | [Completar] | [Enlace o captura] |
| Evaluación | [Completar] | [Completar] | [Enlace o captura] |
| Despliegue | [Completar] | [Completar] | [Enlace o captura] |

## 4. Desarrollo de la solución

Describir módulo, usuarios, procesos, dispositivos, funcionalidades, arquitectura y tecnologías efectivamente utilizadas. [Incluir diagrama o captura real y explicar el flujo]. Distinguir productos esperados de productos alcanzados, con evidencias de funcionamiento.

## 5. Origen y preparación de los datos

- Fuente y tablas del Data Warehouse: [identificarlas; Supabase es la fuente indicada, pero debe confirmarse el flujo].
- Período analizado, fecha de extracción y número de registros: [valores verificados].
- Variables, unidades, granularidad y claves: [detalles].
- Modelo relacional y multidimensional: [tablas, hechos, dimensiones y relaciones; incluir diagramas reales].
- Simulación del millón de mediciones: [procedimiento, variables, supuestos, período y conteo realmente comprobado].
- ETL en SSIS: [origen, extracción, transformaciones, destino, ejecución y evidencia].
- Calidad: [reglas, registros faltantes, duplicados, valores inválidos y atípicos; decisiones y conteos].

## 6. Indicadores y análisis

Para cada uno de los cinco indicadores, registrar pregunta, definición o medida, unidad, numerador y denominador cuando corresponda, filtros y resultado. Explicar cómo se evita sumar potencias como si fueran energía o duplicar mediciones.

| Visualización | Tipo | Pregunta y variables | Procedimiento y filtros | Resultado, unidad y número de registros |
| --- | --- | --- | --- | --- |
| [Nombre] | Univariado 1 | [Completar] | [Completar] | [Completar] |
| [Nombre] | Univariado 2 | [Completar] | [Completar] | [Completar] |
| [Nombre] | Univariado 3 | [Completar] | [Completar] | [Completar] |
| [Nombre] | Bivariado 1 | [Completar] | [Completar] | [Completar] |
| [Nombre] | Bivariado 2 | [Completar] | [Completar] | [Completar] |
| [Nombre] | Bivariado 3 | [Completar] | [Completar] | [Completar] |
| [Nombre] | Multivariado | [Tres o más variables] | [Agrupación conjunta directa y filtros] | [Valores y tamaño de cada grupo] |

Documentar las cinco medidas concretas y sus fórmulas o definiciones: [completar]. Para tasas, indicar denominador; para promedio y mediana, interpretar la distribución. Incluir capturas legibles de los gráficos con títulos, unidades y filtros.

## 7. Cinco conocimientos evidentes

Repetir la siguiente ficha cinco veces, con una visualización correspondiente a cada una. Identificar también sus filtros, período y cantidad de registros.

### Conocimiento [1 a 5]: [título]

1. Pregunta y relación con el problema: [completar].
2. Variables y unidades: [completar].
3. Procedimiento reproducible, agrupación y filtros: [completar].
4. Resultado numérico y evidencia gráfica: [completar e insertar captura].
5. Hallazgo: [completar].
6. Interpretación contextual: [completar].
7. Utilidad: [completar].
8. Limitación: [completar].

## 8. Validación

Registrar cómo se contrastó cada resultado con los datos originales o una consulta reproducible, la cantidad de registros de los grupos comparados y el tratamiento de faltantes y atípicos. [Anexar consultas o capturas]. Explicar por qué las asociaciones observadas no demuestran causalidad.

## 9. Dos decisiones sustentadas

| Elemento | Decisión 1 | Decisión 2 |
| --- | --- | --- |
| Acción propuesta | [Completar] | [Completar] |
| Hallazgo, valores y evidencia | [Completar] | [Completar] |
| Proceso, dispositivo, ubicación o grupo | [Completar] | [Completar] |
| Mejora esperada e indicador de seguimiento | [Completar] | [Completar] |
| Limitaciones | [Completar] | [Completar] |

## 10. Publicación e integración

URL del sitio: [completar]. Modalidad de inserción de Power BI: [completar]. Permisos del docente: [verificación]. Prueba de carga y filtros: [fecha y resultado]. [Insertar capturas de GitHub Pages y del informe interactivo funcionando].

## 11. Conclusiones y referencias

[Evaluar el cumplimiento de cada objetivo, limitaciones, oportunidades de mejora y aporte al contexto].

[Listar únicamente las fuentes consultadas, con autor, título, fecha y URL cuando corresponda].