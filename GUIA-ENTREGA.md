# Guía rápida de entrega

Este material es una base, no una entrega terminada. Los textos marcados como pendientes, los datos, el informe interactivo, la publicación y las evidencias deben completarse con el proyecto real. No publicar contraseñas, cadenas de conexión ni claves privadas.

## 1. Completar el sitio

1. Abrir `index.html` en el navegador para revisar el sitio.
2. En `data.js`, completar el título, programa, sede, ciclo, integrantes, tipo de proyecto, cinco conocimientos y dos decisiones. Mantener las comillas y las comas de JavaScript. Cada conocimiento debe referirse a un gráfico existente del informe y especificar los filtros.
3. En `index.html`, reemplazar los textos pendientes sobre problema, beneficiarios, objetivos, arquitectura, cronograma, simulación, ETL, modelos, resultados, conclusiones y referencias. Confirmar que las descripciones actuales reflejen el proyecto real.
4. Añadir enlaces o capturas de las evidencias reales y las fuentes consultadas. No presentar la foto ilustrativa como evidencia del proyecto.

## 2. Construir el informe en Power BI Desktop

1. Obtener la tabla de hechos y las dimensiones **ya cargadas en el Data Warehouse**, o una exportación autorizada que conserve los datos y relaciones. La URL de Supabase por sí sola no identifica las tablas ni proporciona acceso. Registrar fuente, fecha de extracción, período, conteo de filas y unidades.
2. Revisar el modelo y las relaciones. En Power Query, documentar tipos, duplicados, fechas inválidas, faltantes y valores atípicos; investigar estos últimos antes de decidir si corresponde excluirlos. No afirmar que existen un millón de mediciones sin comprobar el conteo.
3. Formular preguntas antes de crear gráficos. Ajustar esta propuesta a las columnas reales, sus unidades y la granularidad de cada medición:

| Requisito | Pregunta o visual sugerido | Datos y precaución |
| --- | --- | --- |
| 5 indicadores | Número de mediciones, dispositivos con mediciones, consumo total, generación total y consumo promedio | Usar solo campos existentes; definir dispositivo activo y unidad. Sumar energía en kWh solo si cada fila representa energía de un intervalo no superpuesto; no sumar potencia en kW como energía. |
| Univariado 1 | Distribución del consumo | Histograma por intervalos, con unidad y número de mediciones. |
| Univariado 2 | Distribución de generación | Histograma por intervalos, con unidad y número de mediciones. |
| Univariado 3 | Frecuencia por tipo o estado de dispositivo | Categorías y número de registros; incluir faltantes cuando corresponda. |
| Bivariado 1 | Consumo por ubicación | Comparar totales, promedio y número de mediciones por ubicación; explicar diferencias de cobertura. |
| Bivariado 2 | Consumo por período | Línea por fecha o período con unidad y filtros claros. |
| Bivariado 3 | Generación por dispositivo | Comparar dispositivos con conteo de mediciones y períodos equivalentes. |
| Multivariado | Consumo por ubicación, período y tipo de dispositivo | Matriz con ubicación en filas, período en columnas y tipo como nivel adicional o filtro; la medida debe evaluarse bajo los tres filtros simultáneamente. Mostrar tamaño de cada grupo. |

Si una variable no existe, sustituirla por otra real y ajustar las preguntas. Si generación y consumo están en tablas o granularidades distintas, no unirlas ni compararlas sin verificar relaciones y unidades.

4. Agregar segmentadores pertinentes, por ejemplo fecha, ubicación y dispositivo, solo si existen. Titular cada gráfico, indicar unidad y período, y registrar filtros del resultado. Para porcentajes, documentar el numerador y el denominador; comparar cantidades y porcentajes cuando corresponda. Explicar diferencias entre promedio y mediana según la distribución.
5. Escoger cinco gráficos que respalden los conocimientos, anotar sus valores y filtros, repetir los cálculos y revisar el tamaño de los grupos. No interpretar una asociación como causa. Formular dos decisiones con valores, destinatario, mejora, indicador y limitaciones.

## 3. Integrar Power BI

Power BI Desktop no genera por sí solo un informe interactivo insertable en el sitio. Hay que iniciar sesión y publicar el PBIX en Power BI Service, con permisos y licencias según el entorno de la organización.

1. En Desktop, guardar y publicar el informe en un espacio de trabajo al que tengas acceso.
2. En Power BI Service, abrir el informe y buscar **Archivo > Insertar informe > Sitio web o portal**. Copiar la URL de inserción generada (no el HTML completo) en `powerBiEmbedUrl` de `data.js`. Esta modalidad requiere que el docente inicie sesión y tenga acceso al informe y los permisos/licencias necesarios. Una página pública no concede acceso automáticamente.
3. Como alternativa, **Publicar en la web (público)** puede estar habilitado por el administrador, pero expone el informe y sus datos a cualquiera en Internet. Usarlo solo con autorización expresa y datos apropiados para publicación pública; no usarlo con información sensible. Copiar la URL de inserción generada por el servicio.
4. Abrir el sitio publicado como docente o con una cuenta equivalente y comprobar que el iframe carga y que los filtros funcionan. Una captura no sustituye el informe interactivo. Si el docente no puede acceder, resolver permisos o consultar con él una alternativa; no declarar completado este requisito.

## 4. Publicar con GitHub Pages

1. Subir los archivos del sitio (`index.html`, `styles.css`, `data.js` y `app.js`) a un repositorio de GitHub autorizado. Revisar que no contengan secretos ni datos sensibles.
2. En GitHub, abrir **Settings > Pages**, seleccionar **Deploy from a branch**, la rama correspondiente y la carpeta `/ (root)`, y guardar.
3. Abrir la URL que aparece en Pages cuando el despliegue termine. Revisar todas las secciones, el diseño móvil y el informe integrado con los permisos del docente. Tomar capturas de la publicación y del informe funcionando.

## 5. Informe y video

Completar `INFORME-TECNICO.md` con cifras, evidencias y referencias reales. Abrir su vista previa en VS Code o copiar su contenido a un procesador de texto y exportarlo como PDF; verificar que las capturas sean legibles. Seguir `GUION-VIDEO.md` para grabar el recorrido. Entregar la URL pública del sitio, el PDF y el video según las indicaciones del docente.