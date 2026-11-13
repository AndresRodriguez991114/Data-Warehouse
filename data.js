window.PROJECT_DATA = {
  title: "Energía sostenible",
  supabaseUrl: "https://zlvqxkezmlswzfozlhwy.supabase.co",
  supabasePublishableKey: "sb_publishable_s5qcggTz4Fd0iaTXf8kUgA_zmAGWbCq",
  identification: [
    ["Institución", "Universidad de Cundinamarca"],
    ["Referencia académica", "Big Data"],
    ["Programa académico", "Ingeniería de Sistemas y Computación"],
    ["Sede o extensión", "Extensión Chía"],
    ["Integrantes", "Cesar Eduardo Bolivar Gonzalez Andres Rodriguez"],
    ["Docente", "Edison Gustavo Canon Varela"],
    ["Año de portada", "2026"]
  ],
  powerBiEmbedUrl: "",
  knowledge: [
    {
      title: "Generación concentrada en valores bajos",
      pregunta: "¿En qué intervalo se concentra la generación registrada?",
      variables: "Energía generada en Wh y número de mediciones.",
      procedimiento: "Agrupar los registros en intervalos de 10 Wh y dividir la frecuencia del intervalo entre 1.000.000 de mediciones.",
      resultado: "514.909 mediciones, el 51,49 %, registraron entre 0 Wh inclusive y 10 Wh exclusivo.",
      hallazgo: "Más de la mitad de las mediciones se concentra en el primer intervalo de generación.",
      interpretacion: "Las lecturas bajas son frecuentes en este conjunto; no se puede atribuir esa concentración a una hora o causa concreta sin desglosarla.",
      utilidad: "Orienta el análisis posterior de los momentos y condiciones con baja generación.",
      limitacion: "Son mediciones, no viviendas ni energía total; no se ha verificado la duración de cada registro ni la correspondencia con la simulación del informe previo.",
      evidencia: "Distribución de la generación; datos de la captura indicada arriba.",
      evidenciaHref: "#grafica-distribucion-generacion"
    },
    {
      title: "Distribución del nivel de batería",
      pregunta: "¿En qué intervalo se concentra el nivel de batería registrado?",
      variables: "Nivel de batería (%) y número de mediciones.",
      procedimiento: "Agrupar niveles en intervalos de 20 puntos porcentuales y dividir la frecuencia entre 1.000.000 de mediciones.",
      resultado: "431.037 mediciones, el 43,10 %, se ubican entre 20 % inclusive y 40 % exclusivo.",
      hallazgo: "El intervalo de 20 % a menos de 40 % es el más frecuente.",
      interpretacion: "Las lecturas de ese nivel aparecen con mayor frecuencia en el conjunto analizado.",
      utilidad: "Permite orientar un seguimiento de los niveles bajos y revisar umbrales de alerta.",
      limitacion: "El porcentaje corresponde a lecturas, no a baterías; no establece riesgo de descarga ni duración en ese nivel.",
      evidencia: "Distribución del nivel de batería; datos de la captura indicada arriba.",
      evidenciaHref: "#grafica-distribucion-bateria"
    },
    {
      title: "Generación según condición climática",
      pregunta: "¿Cómo difiere la generación promedio entre condiciones climáticas?",
      variables: "Condición climática y energía generada en Wh por medición.",
      procedimiento: "Agrupar por condición y dividir la suma numérica de las lecturas entre el número de valores no nulos de cada grupo.",
      resultado: "Despejado: 119,38 Wh por medición (261.450 registros); muy nublado / lluvia: 22,63 Wh (32.200 registros).",
      hallazgo: "El promedio registrado bajo condición despejada es mayor que en el grupo muy nublado / lluvia.",
      interpretacion: "Existe una asociación descriptiva entre condición climática y generación en el conjunto consultado.",
      utilidad: "Ayuda a priorizar la revisión de la disponibilidad de generación en condiciones menos favorables.",
      limitacion: "No demuestra que el clima cause la diferencia; podrían influir la hora, los dispositivos y la cobertura de cada grupo.",
      evidencia: "Generación promedio por clima; datos de la captura indicada arriba.",
      evidenciaHref: "#grafica-generacion-clima"
    },
    {
      title: "Consumo según franja horaria",
      pregunta: "¿En qué franja se observa mayor consumo promedio por medición?",
      variables: "Franja del día y energía consumida total en Wh por medición.",
      procedimiento: "Agrupar por franja y dividir la suma numérica de lecturas entre los registros no nulos de cada grupo.",
      resultado: "Noche: 93,58 Wh por medición (249.600 registros); madrugada: 38,89 Wh (250.800 registros).",
      hallazgo: "La noche presenta el promedio más alto y la madrugada el más bajo entre las franjas observadas.",
      interpretacion: "El consumo registrado varía entre franjas del escenario analizado.",
      utilidad: "Permite priorizar la revisión de la carga nocturna y del respaldo de batería.",
      limitacion: "No representa energía total ni demuestra la causa de la diferencia; el resultado depende de la cobertura y definición de las franjas.",
      evidencia: "Consumo promedio por franja; datos de la captura indicada arriba.",
      evidenciaHref: "#grafica-consumo-franja"
    },
    {
      title: "Análisis conjunto",
      pregunta: "¿Cómo varía el consumo nocturno de julio al considerar también el clima?",
      variables: "Mes, condición climática, franja del día y consumo en Wh por medición.",
      procedimiento: "Agrupar directamente por mes, clima y franja; seleccionar julio de 2026 y noche; calcular promedio y cantidad de valores no nulos por condición.",
      resultado: "Muy nublado / lluvia: 94,58 Wh por medición (2.050 registros); parcialmente nublado: 93,33 Wh (15.400 registros).",
      hallazgo: "En julio y de noche, el promedio del primer grupo supera al segundo en 1,25 Wh por medición.",
      interpretacion: "La diferencia describe una combinación concreta de período, clima y franja, no el comportamiento de todos los meses.",
      utilidad: "Sirve para delimitar qué combinación conviene examinar antes de actuar.",
      limitacion: "Los grupos tienen tamaños distintos, julio está incompleto y no se ha demostrado causalidad ni diferencia práctica relevante.",
      evidencia: "Consumo por clima y franja; seleccionar 2026-07-01 en el filtro de mes.",
      evidenciaHref: "#grafica-conjunto"
    }
  ],
  decisions: [
    { title: "Revisar la carga nocturna", accion: "Evaluar en el escenario simulado la gestión de la carga y el respaldo de batería durante la noche.", respaldo: "Noche: 93,58 Wh por medición y 249.600 registros; madrugada: 38,89 Wh y 250.800 registros.", destino: "Proceso de consumo y almacenamiento en la franja nocturna.", seguimiento: "Buscar un consumo nocturno más controlado; comparar el promedio de Wh por medición y el número de lecturas en períodos equivalentes.", limitacion: "No se conoce aún la duración de las lecturas ni se demuestra que modificar la carga reduzca costos o mejore la autonomía real." },
    { title: "Vigilar condiciones de baja generación", accion: "Priorizar el monitoreo de generación en condiciones muy nubladas o de lluvia dentro del escenario analizado.", respaldo: "Muy nublado / lluvia: 22,63 Wh por medición en 32.200 registros; despejado: 119,38 Wh en 261.450 registros.", destino: "Proceso de seguimiento de generación solar según condición climática.", seguimiento: "Revisar disponibilidad y posibles desviaciones mediante el promedio de generación por medición, con conteos y períodos comparables.", limitacion: "La diferencia es una asociación; hora, dispositivos y cobertura pueden influir. Debe validarse antes de aplicarla a una instalación real." }
  ]
};