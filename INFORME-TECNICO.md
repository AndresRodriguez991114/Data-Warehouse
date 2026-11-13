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

El sitio preparado incorpora, además, gráficas de distribuciones, comparaciones y un análisis conjunto. Los resultados siguientes corresponden a la caché calculada el 13 de noviembre de 2026 a las 05:26:40 UTC, con datos del 1 de enero al 28 de julio de 2026 a las 07:45. La consulta pública reportó 1.000.000 de mediciones; las frecuencias de cada variable y los grupos conjuntos sumaron esa misma cantidad, con cero tramos y cero grupos omitidos. Las gráficas en línea pueden cambiar si se actualiza la caché. [Adjuntar capturas de este corte].

| Visualización | Tipo | Pregunta y variables | Procedimiento y filtros | Resultado, unidad y número de registros |
| --- | --- | --- | --- | --- |
| Distribución del consumo | Univariado 1 | ¿En qué intervalos aparecen las lecturas de consumo? | Frecuencia por intervalos de 10 Wh; límite superior excluido. | Intervalo de 30 a menos de 40 Wh: 132.199 lecturas, 13,22 % del millón. |
| Distribución de generación | Univariado 2 | ¿En qué intervalo se concentran las lecturas de generación? | Frecuencia por intervalos de 10 Wh; límite superior excluido. | De 0 a menos de 10 Wh: 514.909 lecturas, 51,49 % del millón. |
| Distribución de batería | Univariado 3 | ¿Qué niveles de batería se registran con mayor frecuencia? | Frecuencia por intervalos de 20 puntos porcentuales. | De 20 % a menos de 40 %: 431.037 lecturas, 43,10 % del millón. |
| Generación por clima | Bivariado 1 | ¿Cómo cambia la generación promedio por condición climática? | Promedio por condición, ponderado por lecturas no nulas. | Despejado: 119,38 Wh, n=261.450; muy nublado / lluvia: 22,63 Wh, n=32.200. |
| Consumo por franja | Bivariado 2 | ¿Cómo varía el consumo por franja horaria? | Promedio por franja, ponderado por lecturas no nulas. | Noche: 93,58 Wh, n=249.600; madrugada: 38,89 Wh, n=250.800. |
| Consumo por mes | Bivariado 3 | ¿Cómo cambia el consumo promedio por mes? | Promedio mensual ponderado por lecturas no nulas. | Enero: 72,73 Wh, n=148.800; febrero: 73,04 Wh, n=134.400; julio parcial: 72,61 Wh, n=131.200. |
| Consumo por mes, clima y franja | Multivariado | ¿Cómo varía el consumo nocturno de julio al considerar el clima? | Agrupar conjuntamente mes, condición y franja; filtrar julio de 2026 y noche. | Muy nublado / lluvia: 94,58 Wh, n=2.050; parcialmente nublado: 93,33 Wh, n=15.400. |

Los porcentajes de las distribuciones usan como denominador el millón de registros. Los promedios se expresan en Wh por medición y se ponderan por la cantidad de valores no nulos, no por el número de grupos. Los resultados no constituyen totales de energía. [Incluir capturas legibles con títulos, unidades y filtros].

## 7. Cinco conocimientos evidentes

Los cinco conocimientos siguientes usan el corte y período indicados en la sección 6. Cada evidencia gráfica corresponde a la visualización del mismo nombre en el sitio; [insertar capturas del corte].

### 1. Generación concentrada en valores bajos

- **Pregunta:** ¿En qué intervalo se concentra la generación registrada?
- **Variables:** energía generada en Wh y número de mediciones.
- **Procedimiento:** agrupar en intervalos de 10 Wh y dividir la frecuencia entre 1.000.000.
- **Resultado y evidencia:** de 0 a menos de 10 Wh hay 514.909 lecturas (51,49 %). Gráfica: distribución de generación.
- **Hallazgo:** más de la mitad se concentra en el primer intervalo.
- **Interpretación:** las lecturas bajas son frecuentes en el conjunto.
- **Utilidad:** orientar una revisión por momento y condiciones.
- **Limitación:** no identifica una causa ni representa viviendas o energía total; la duración de cada registro sigue sin confirmarse para Supabase.

### 2. Distribución del nivel de batería

- **Pregunta:** ¿En qué intervalo se concentra el nivel de batería?
- **Variables:** nivel de batería (%) y número de mediciones.
- **Procedimiento:** agrupar en intervalos de 20 puntos porcentuales y dividir por 1.000.000.
- **Resultado y evidencia:** de 20 % a menos de 40 % hay 431.037 lecturas (43,10 %). Gráfica: distribución de batería.
- **Hallazgo:** es el intervalo más frecuente.
- **Interpretación:** ese nivel aparece con frecuencia en las lecturas registradas.
- **Utilidad:** orientar el seguimiento de umbrales de alerta.
- **Limitación:** son lecturas, no baterías ni tiempo acumulado; no prueba un riesgo de descarga.

### 3. Generación por condición climática

- **Pregunta:** ¿Cómo difiere la generación promedio entre condiciones climáticas?
- **Variables:** condición climática y energía generada por medición.
- **Procedimiento:** sumar las lecturas de cada condición y dividir entre el número de valores no nulos.
- **Resultado y evidencia:** despejado, 119,38 Wh (n=261.450); muy nublado / lluvia, 22,63 Wh (n=32.200). Gráfica: generación por clima.
- **Hallazgo:** el promedio de la categoría despejada es mayor.
- **Interpretación:** existe una asociación descriptiva en el conjunto consultado.
- **Utilidad:** priorizar la revisión de disponibilidad de generación en condiciones menos favorables.
- **Limitación:** no demuestra causalidad; hora, dispositivos y cobertura pueden influir.

### 4. Consumo por franja horaria

- **Pregunta:** ¿En qué franja se observa mayor consumo promedio por medición?
- **Variables:** franja del día y consumo en Wh por medición.
- **Procedimiento:** agrupar por franja y dividir la suma numérica por el número de lecturas no nulas.
- **Resultado y evidencia:** noche, 93,58 Wh (n=249.600); madrugada, 38,89 Wh (n=250.800). Gráfica: consumo por franja.
- **Hallazgo:** noche es el promedio más alto y madrugada el más bajo entre las franjas.
- **Interpretación:** el consumo registrado difiere según la franja.
- **Utilidad:** priorizar la revisión de la carga nocturna y del respaldo de batería.
- **Limitación:** no es energía total ni demuestra la causa de la diferencia; depende de la definición y cobertura de las franjas.

### 5. Consumo por mes, clima y franja

- **Pregunta:** ¿Cómo varía el consumo nocturno de julio al considerar el clima?
- **Variables:** mes, condición climática, franja y consumo en Wh por medición.
- **Procedimiento:** agrupar conjuntamente las tres dimensiones y filtrar julio de 2026 y noche; calcular promedio y cantidad de valores no nulos por condición.
- **Resultado y evidencia:** muy nublado / lluvia, 94,58 Wh (n=2.050); parcialmente nublado, 93,33 Wh (n=15.400). Gráfica: consumo por clima y franja, seleccionar julio.
- **Hallazgo:** el primer promedio supera al segundo en 1,25 Wh por medición.
- **Interpretación:** describe una combinación concreta, no todos los meses.
- **Utilidad:** delimitar qué combinación examinar antes de actuar.
- **Limitación:** los grupos tienen tamaños distintos, julio está incompleto y no se ha demostrado causalidad ni relevancia práctica de la diferencia.

## 8. Validación

La consulta de diagnóstico de Supabase fue facilitada por el equipo; queda pendiente repetirla o conservar una captura, registrar la fecha de extracción y contrastar el resultado con la fuente. También es necesario conciliar los períodos, dispositivos, conteos y resultados nocturnos mencionados en la sección 5. Registrar tamaños de grupo y tratamiento de faltantes y atípicos; las asociaciones no demuestran causalidad. [Anexar consultas y capturas].

## 9. Dos decisiones sustentadas

| Elemento | Decisión 1 | Decisión 2 |
| --- | --- | --- |
| Acción propuesta | Evaluar la gestión de la carga y el respaldo de batería durante la noche. | Priorizar el monitoreo de generación en condiciones muy nubladas o de lluvia. |
| Hallazgo, valores y evidencia | Consumo promedio nocturno 93,58 Wh (n=249.600), frente a 38,89 Wh en madrugada (n=250.800); gráfica de consumo por franja. | Generación promedio 22,63 Wh (n=32.200), frente a 119,38 Wh en despejado (n=261.450); gráfica de generación por clima. |
| Proceso, dispositivo, ubicación o grupo | Consumo y almacenamiento en la franja nocturna del escenario simulado. | Seguimiento de generación solar por condición climática en el escenario analizado. |
| Mejora esperada e indicador de seguimiento | Buscar un consumo nocturno más controlado; comparar promedio de Wh por medición y conteos en períodos equivalentes. | Detectar desviaciones de disponibilidad; seguir el promedio de generación por medición y los conteos de cada condición. |
| Limitaciones | Duración de las lecturas no confirmada; no demuestra ahorro o autonomía real. | Asociación, no causalidad; validar con horas, dispositivos y cobertura comparables antes de aplicar a una instalación real. |

## 10. Publicación e integración

URL del sitio: [completar y verificar]. El dashboard interactivo de Power BI no está incluido en esta versión, por lo que el requisito de integración y su prueba de filtros permanecen sin cumplir. [Insertar evidencias reales de publicación del sitio].

## 11. Conclusiones y referencias

[Evaluar el cumplimiento de cada objetivo, limitaciones, oportunidades de mejora y aporte al contexto].

- Bolivar Gonzalez, Cesar Eduardo y Rodriguez Bermudez, Andres Yesid. *Energía sostenible*. Documento del proyecto compartido por el equipo, 2026, páginas 2-17 y anexos.
- Resultado de la consulta de diagnóstico de Supabase proporcionado por el equipo. [Fecha de extracción pendiente].
- [Agregar otras fuentes efectivamente consultadas].