window.PROJECT_DATA = {
  title: "Energía sostenible",
  identification: [
    ["Institución", "Universidad de Cundinamarca"],
    ["Referencia académica", "Big Data"],
    ["Programa académico", "Ingeniería de Sistemas y Computación"],
    ["Sede o extensión", "Extensión Chía"],
    ["Integrantes", "César Eduardo Bolívar González · Andrés Yesid Rodríguez Bermúdez"],
    ["Docente", "Edison Gustavo Cañón Varela"],
    ["Año de portada", "2026"]
  ],
  powerBiEmbedUrl: "",
  knowledge: [
    {
      title: "Conciliación de datos reales y simulados",
      pregunta: "¿Cómo se compone la tabla Medición?",
      variables: "Telemetría cruda, registros rechazados, mediciones reales limpias y registros simulados.",
      procedimiento: "Conciliar los conteos de Telemetría_Real, la limpieza y la carga total de Medición.",
      resultado: "2.417 registros crudos − 46 rechazados = 2.371 reales limpios; más 1.000.000 simulados = 1.002.371 filas en Medición.",
      hallazgo: "La carga distingue las mediciones del único prototipo físico de los datos generados para 50 dispositivos simulados.",
      interpretacion: "Los conteos reales y simulados se combinan en Medición, pero se identifican como orígenes distintos.",
      utilidad: "Mantener separada la validación del ESP32 de la escala ampliada de la simulación.",
      limitacion: "Los registros de la tabla agregada del Data Warehouse tienen otra granularidad.",
      evidencia: "Video de verificación W1 en SSMS, 13 de noviembre de 2026."
    },
    {
      title: "Limpieza y reglas de calidad",
      pregunta: "¿Qué registros crudos se descartaron y por qué?",
      variables: "Voltajes, corriente, estado de carga y claves requeridas.",
      procedimiento: "Rechazar voltaje de panel fuera de 0–6 V, batería fuera de 3,0–4,2 V, corriente negativa, carga apagada por tiempo prolongado o claves nulas.",
      resultado: "Se eliminaron 46 de 2.417 registros crudos (1,9 %). Los rechazados se conservan en Rechazados_ETL con el motivo.",
      hallazgo: "La lectura de batería de 1,12 V de la evidencia queda fuera del rango válido y se rechaza.",
      interpretacion: "Las reglas evitan que mediciones fuera de los límites definidos ingresen al conjunto limpio.",
      utilidad: "Consultar el motivo de rechazo para revisar y corregir la fuente de cada dato.",
      limitacion: "El dato fuera de rango no debe presentarse como una lectura válida de batería."
    },
    {
      title: "ETL repetible sin duplicados",
      pregunta: "¿Qué ocurrió al ejecutar dos veces el paquete SSIS?",
      variables: "Conteos de Telemetría_Real, Medición, Fact_Mediciones y Alertas.",
      procedimiento: "Comparar los conteos antes y después de la segunda ejecución y revisar duplicados por la llave compuesta del hecho.",
      resultado: "Los conteos se mantuvieron: 2.417, 1.002.371, 249.956 y 13, respectivamente. La verificación de duplicados devolvió 0 filas.",
      hallazgo: "La segunda ejecución no duplicó registros en las tablas verificadas.",
      interpretacion: "La llave compuesta y la marca de agua forman parte del control de carga incremental.",
      utilidad: "Repetir la carga sin alterar los conteos ya consolidados.",
      limitacion: "La afirmación se limita a las tablas y ejecuciones incluidas en la verificación W1."
    },
    {
      title: "Energía generada por franja",
      pregunta: "¿Cómo se distribuye la generación entre día y noche?",
      variables: "Filas agregadas, generación en kWh y voltaje promedio del panel.",
      procedimiento: "Comparar las franjas día (06:00–17:59) y noche (18:00–05:59) en Fact_Mediciones.",
      resultado: "Día: 149.974 filas, 1.842,5 kWh (95,9 %) y 4,82 V promedio. Noche: 99.982 filas, 78,4 kWh (4,1 %) y 1,58 V promedio.",
      hallazgo: "La generación registrada se concentra durante el día.",
      interpretacion: "Las lecturas de baja irradiancia muestran voltaje residual con corriente y potencia nulas o casi nulas; la energía nocturna residual se atribuye a transiciones de amanecer y atardecer.",
      utilidad: "Priorizar el monitoreo de generación diurna y revisar el comportamiento en los cambios de franja.",
      limitacion: "Son resultados del conjunto agregado analizado; no representan una instalación residencial real."
    },
    {
      title: "Lecturas eléctricas y calibración",
      pregunta: "¿Qué muestran las fotografías de la maqueta?",
      variables: "Voltaje, corriente y potencia del panel; voltaje y corriente de batería.",
      procedimiento: "Contrastar las lecturas del dashboard y de las pantallas LCD registradas en las fotografías.",
      resultado: "Dashboard: panel 2,16 V, 0,00 A, 0,00 W y 0,00 Wh. LCD panel: 1,00 V y 0,01 A. LCD batería: 1,12 V y −0,0 A.",
      hallazgo: "El voltaje de batería de 1,12 V queda por debajo del rango válido de 3,0–4,2 V; las lecturas de panel con corriente nula indican ausencia de generación en ese instante.",
      interpretacion: "La diferencia de escala entre dashboard y LCD se atribuye al divisor resistivo y a la escala configurada en Node-RED.",
      utilidad: "Considerar las escalas al comparar las lecturas de los instrumentos.",
      limitacion: "La calibración entre el divisor resistivo, Node-RED y la visualización debe tratarse como una limitación del prototipo."
    }
  ],
  decisions: [
    {
      title: "Revisar la calibración de lecturas",
      accion: "Comparar el voltaje medido por el panel, el LCD y el dashboard con la escala del divisor resistivo y la configuración de Node-RED.",
      respaldo: "Las fotografías muestran 2,16 V en el dashboard y 1,00 V en el LCD del panel; la batería registra 1,12 V, fuera del rango definido.",
      destino: "Instrumentación, adquisición y visualización de voltaje.",
      seguimiento: "Documentar la escala usada en cada punto de medición y confirmar que las lecturas se comparen con la misma referencia.",
      limitacion: "Los valores de las fotografías corresponden a instantes concretos de la prueba."
    },
    {
      title: "Controlar registros fuera de rango",
      accion: "Mantener los límites de calidad y revisar los registros enviados a Rechazados_ETL antes de cargar las mediciones.",
      respaldo: "Se rechazaron 46 registros crudos; la lectura de batería de 1,12 V está por debajo del intervalo válido de 3,0–4,2 V.",
      destino: "Limpieza de telemetría y control de alertas.",
      seguimiento: "Conservar el motivo de rechazo y verificar los conteos antes y después de cada ejecución.",
      limitacion: "No volver a incorporar un registro rechazado sin corregir o validar su origen."
    }
  ]
};
