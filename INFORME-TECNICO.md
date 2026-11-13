# Informe técnico: Energía sostenible

**Estado:** plantilla pendiente de completar y verificar. Eliminar esta nota solo cuando se hayan sustituido todos los campos entre corchetes y se hayan incorporado evidencias reales.

## Identificación

- Proyecto: Energía sostenible.
- Institución: Universidad de Cundinamarca. Referencia académica en la portada: Big Data.
- Programa académico: Ingeniería de Sistemas y Computación.
- Sede o extensión: Extensión Chía.
- Integrantes: Cesar Eduardo Bolivar Gonzalez y Andres Yesid Rodriguez Bermudez.
- Docente: Edison Gustavo Canon Varela.
- Año de la portada: 2026.
- URL del sitio publicado: [URL comprobada].
- Fecha de elaboración: [fecha].

## 1. Problema, justificación y objetivos

El proyecto aborda la necesidad de observar la generación y el consumo para analizar la gestión energética. Según el informe previo del equipo, el módulo corresponde a la Casa 1, una maqueta de vivienda inteligente en Cajicá. Su panel carga una batería que alimenta una tira de LED representativa del consumo. El prototipo beneficia el aprendizaje y el monitoreo del equipo; no prueba el abastecimiento de viviendas reales ni de todo el municipio.

El objetivo del informe previo es implementar almacenamiento y preparación de datos mediante un modelo relacional, simulación de mediciones, modelo multidimensional y ETL en SSIS. Sus objetivos específicos comprenden representar dispositivos y eventos, simular mediciones, diseñar el esquema estrella, validar la carga y responder preguntas sobre eficiencia energética. [Completar antecedentes externos consultados, si existen].

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

El informe previo describe un ESP32-S3, panel de 0 a 6 V, batería de litio, dos sensores ACS712, divisores resistivos y dos pantallas LCD. El microcontrolador mide voltaje y corriente cada dos segundos; una tira de LED representa la carga. Los actores descritos son el habitante de la casa y el administrador o estudiante que monitorea y prepara la información.

El flujo descrito es ESP32 → MQTT → Node-RED → SQL Server (`Telemetria_Real`) → limpieza → `Medicion` → SSIS → Data Warehouse → análisis. El informe anterior contiene fotografías, capturas del flujo y tableros, y describe una incidencia de permisos al enviar alertas por correo. [Incorporar las evidencias disponibles y comprobar el estado de la incidencia].

## 5. Origen y preparación de los datos

- Fuente y tablas del Data Warehouse: el esquema proporcionado en Supabase incluye `fact_medicion_solar` y las dimensiones `dim_fecha`, `dim_hora`, `dim_clima`, `dim_dispositivo` y `dim_ubicacion`. [Confirmar el flujo y las relaciones].
- Período y registros reportados por la consulta: 1.000.000 de mediciones, del 1 de enero de 2026 a las 00:00 al 28 de julio de 2026 a las 07:45. La fecha de extracción está pendiente de documentar; las fechas se almacenan sin zona horaria.
- Variables, unidades, granularidad y claves: [detalles].
- Modelo relacional y multidimensional del informe previo: en SQL Server, `Barrio`, `Casa`, `Lugar_Publico`, `Dispositivo`, `Telemetria_Real`, `Medicion` y `Alerta`; el DW descrito contiene `Fact_Mediciones` y dimensiones de tiempo, dispositivo y ubicación. La granularidad declarada es dispositivo × ubicación × hora. [Incluir diagramas y validar su correspondencia con Supabase].
- Simulación descrita en el informe previo: cuatro dispositivos con 250.000 registros cada uno, cada dos segundos, entre el 1 y el 6 de octubre de 2026; generación con perfil día/noche y variación de nubosidad, carga y eventos. Son parámetros del escenario documentado, no evidencia de que correspondan a los datos consultados en Supabase.
- ETL en SSIS descrito: carga de dimensiones, marca de agua, extracción, conversión, validación de voltajes y búsqueda de claves, registro de rechazos y agregación por hora; se reprocesa desde el inicio de la última hora de corte. El informe señala 1.000 rechazos y 556 filas de hechos como resultados esperados, pero sus campos de resultados están vacíos. [Verificar ejecución y conteos].
- Calidad: la consulta reportó cero faltantes en fecha y hora, claves de dispositivo y ubicación, generación, consumo y nivel de batería; cero valores negativos de generación o consumo; y cero niveles de batería fuera de 0 a 100 %. Esto no comprueba duplicados, integridad referencial ni otros valores atípicos. [Documentar reglas del ETL y revisión adicional].

**Diferencias pendientes de conciliación:** el diagnóstico de Supabase reporta enero-julio de 2026 y 50 dispositivos, mientras que el escenario del informe previo describe octubre de 2026 y cuatro dispositivos. Una captura del informe muestra 1.003.209 extraídos, 249.956 filas cargadas y cero rechazos, distintos de los valores esperados de su tabla. Otra captura reporta generación nocturna, aunque el escenario esperado indica cero. No se conoce si corresponden a ejecuciones o conjuntos distintos; no mezclar sus cifras ni presentar los valores esperados como resultados observados.

## 6. Indicadores y análisis

El equipo proporcionó el resultado de `DIAGNOSTICO-DATOS.sql` para toda la tabla, sin filtros adicionales:

| Indicador | Definición y resultado |
| --- | --- |
| Mediciones | 1.000.000 filas. |
| Dispositivos con mediciones | 50 claves de dispositivo distintas; no implica que estén activos actualmente. |
| Ubicaciones con mediciones | 50 claves de ubicación distintas. |
| Generación promedio | 80,54 Wh por medición, sobre 1.000.000 valores no nulos. |
| Consumo promedio | 72,75 Wh por medición, sobre 1.000.000 valores no nulos. |
| Nivel de batería promedio | 53,43 %, sobre 1.000.000 valores no nulos. |

Los promedios son por medición, no totales. No se debe concluir un balance energético ni sumar Wh hasta conocer si las lecturas son incrementales, no superpuestas y comparables. Los resultados fueron proporcionados por el equipo y deben acompañarse de la evidencia de ejecución y fecha de extracción.

El sitio presenta dos gráficas preliminares con estos resultados: una compara los promedios de generación y consumo y otra muestra el nivel medio de batería. Ambas abarcan el período completo de Supabase sin filtros adicionales y usan un millón de valores no nulos por variable. No muestran distribuciones ni tendencias y no sustituyen los análisis y la integración interactiva exigidos. [Añadir capturas legibles y verificar los resultados en la fuente].

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

La consulta de diagnóstico de Supabase fue facilitada por el equipo; queda pendiente repetirla o conservar una captura, registrar la fecha de extracción y contrastar el resultado con la fuente. También es necesario conciliar los períodos, dispositivos, conteos y resultados nocturnos mencionados en la sección 5. Registrar tamaños de grupo y tratamiento de faltantes y atípicos; las asociaciones no demuestran causalidad. [Anexar consultas y capturas].

## 9. Dos decisiones sustentadas

| Elemento | Decisión 1 | Decisión 2 |
| --- | --- | --- |
| Acción propuesta | [Completar] | [Completar] |
| Hallazgo, valores y evidencia | [Completar] | [Completar] |
| Proceso, dispositivo, ubicación o grupo | [Completar] | [Completar] |
| Mejora esperada e indicador de seguimiento | [Completar] | [Completar] |
| Limitaciones | [Completar] | [Completar] |

## 10. Publicación e integración

URL del sitio: [completar y verificar]. El dashboard interactivo de Power BI no está incluido en esta versión, por lo que el requisito de integración y su prueba de filtros permanecen sin cumplir. [Insertar evidencias reales de publicación del sitio].

## 11. Conclusiones y referencias

[Evaluar el cumplimiento de cada objetivo, limitaciones, oportunidades de mejora y aporte al contexto].

- Bolivar Gonzalez, Cesar Eduardo y Rodriguez Bermudez, Andres Yesid. *Energía sostenible*. Documento del proyecto compartido por el equipo, 2026, páginas 2-17 y anexos.
- Resultado de la consulta de diagnóstico de Supabase proporcionado por el equipo. [Fecha de extracción pendiente].
- [Agregar otras fuentes efectivamente consultadas].