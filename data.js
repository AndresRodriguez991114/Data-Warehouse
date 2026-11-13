window.PROJECT_DATA = {
  title: "Energía sostenible",
  supabaseUrl: "https://zlvqxkezmlswzfozlhwy.supabase.co",
  supabasePublishableKey: "sb_publishable_s5qcggTz4Fd0iaTXf8kUgA_zmAGWbCq",
  identification: [
    ["Institución", "Universidad de Cundinamarca"],
    ["Referencia académica", "Big Data"],
    ["Programa académico", "Ingeniería de Sistemas y Computación"],
    ["Sede o extensión", "Extensión Chía"],
    ["Integrantes", "Cesar Eduardo Bolivar Gonzalez y Andres Yesid Rodriguez Bermudez"],
    ["Docente", "Edison Gustavo Canon Varela"],
    ["Año de portada", "2026"]
  ],
  powerBiEmbedUrl: "",
  knowledge: [
    {
      title: "Consumo promedio registrado",
      pregunta: "¿Cuál es el consumo promedio por medición en los datos consultados?",
      variables: "energía consumida total (Wh) y fecha de medición; del 1 de enero al 28 de julio de 2026 a las 07:45.",
      procedimiento: "Promedio de energia_consumida_total_wh sobre registros no nulos, sin filtros adicionales, en la consulta de diagnóstico.",
      resultado: "72,75 Wh por medición sobre 1.000.000 valores no nulos.",
      hallazgo: "El consumo promedio registrado en el conjunto consultado es 72,75 Wh por medición.",
      interpretacion: "Resume las lecturas del período, pero no representa el consumo total de una vivienda ni el consumo actual.",
      utilidad: "Sirve como referencia inicial para comparaciones posteriores con períodos y grupos equivalentes.",
      limitacion: "El promedio no muestra distribución ni tendencias; falta confirmar la duración y significado de cada lectura y su relación con la maqueta.",
      evidencia: "Resultado histórico de la consulta de diagnóstico facilitado por el equipo; la gráfica puede actualizarse con datos posteriores."
    },
    {
      title: "Generación solar",
      pregunta: "¿Cuál es la generación promedio por medición en los datos consultados?",
      variables: "energía generada (Wh) y fecha de medición; del 1 de enero al 28 de julio de 2026 a las 07:45.",
      procedimiento: "Promedio de energia_generada_wh sobre registros no nulos, sin filtros adicionales, en la consulta de diagnóstico.",
      resultado: "80,54 Wh por medición sobre 1.000.000 valores no nulos.",
      hallazgo: "La generación promedio registrada en el conjunto consultado es 80,54 Wh por medición.",
      interpretacion: "Resume las lecturas del período, pero no representa la generación total ni la producción actual.",
      utilidad: "Sirve como referencia inicial para estudiar diferencias entre períodos y dispositivos.",
      limitacion: "El promedio no muestra distribución ni tendencias; falta confirmar la duración y significado de cada lectura y su relación con la maqueta.",
      evidencia: "Resultado histórico de la consulta de diagnóstico facilitado por el equipo; la gráfica puede actualizarse con datos posteriores."
    },
    {
      title: "Consumo por ubicación",
      pregunta: "¿Cómo varía el consumo entre ubicaciones?",
      variables: "ubicación, energía consumida total (Wh) y fecha de medición.",
      procedimiento: "Agrupar por ubicación y comparar el consumo promedio por medición junto con el número de registros válidos.",
      resultado: "Pendiente: valores calculados y visualización correspondiente.",
      hallazgo: "Pendiente de validar con los datos.",
      interpretacion: "Pendiente de interpretación en el contexto del módulo.",
      utilidad: "Pendiente: acción o comprensión que permite orientar.",
      limitacion: "Pendiente: diferencias de cobertura y datos faltantes.",
      evidencia: "Pendiente: nombre de la visualización y filtros aplicados."
    },
    {
      title: "Evolución temporal",
      pregunta: "¿Cómo cambia el consumo a lo largo del tiempo?",
      variables: "fecha de medición y energía consumida total (Wh).",
      procedimiento: "Agrupar por fecha y comparar el consumo promedio por medición, incluyendo el número de registros válidos.",
      resultado: "Pendiente: valores calculados y visualización correspondiente.",
      hallazgo: "Pendiente de validar con los datos.",
      interpretacion: "Pendiente de interpretación en el contexto del módulo.",
      utilidad: "Pendiente: acción o comprensión que permite orientar.",
      limitacion: "Pendiente: cobertura temporal y datos faltantes.",
      evidencia: "Pendiente: nombre de la visualización y filtros aplicados."
    },
    {
      title: "Análisis conjunto",
      pregunta: "¿Cómo se comporta el consumo al combinar barrio, mes y tipo de dispositivo?",
      variables: "barrio, mes y año, tipo de dispositivo y energía consumida total (Wh).",
      procedimiento: "Agrupar conjuntamente por barrio, año, mes y tipo de dispositivo; calcular el promedio y el número de registros válidos de cada grupo.",
      resultado: "Pendiente: valores calculados y visualización correspondiente.",
      hallazgo: "Pendiente de validar con los datos.",
      interpretacion: "Pendiente de interpretación en el contexto del módulo.",
      utilidad: "Pendiente: acción o comprensión que permite orientar.",
      limitacion: "Pendiente: tamaño de grupos y otras variables no observadas.",
      evidencia: "Pendiente: nombre de la visualización y filtros aplicados."
    }
  ],
  decisions: [
    { title: "Decisión 01", accion: "Pendiente de definir según los hallazgos.", respaldo: "Pendiente: hallazgo, valores y visualización.", destino: "Pendiente: ubicación, proceso, dispositivo o grupo.", seguimiento: "Pendiente: mejora esperada e indicador de seguimiento.", limitacion: "Pendiente: condiciones y límites de aplicación." },
    { title: "Decisión 02", accion: "Pendiente de definir según los hallazgos.", respaldo: "Pendiente: hallazgo, valores y visualización.", destino: "Pendiente: ubicación, proceso, dispositivo o grupo.", seguimiento: "Pendiente: mejora esperada e indicador de seguimiento.", limitacion: "Pendiente: condiciones y límites de aplicación." }
  ]
};