(() => {
  const data = window.PROJECT_DATA;
  if (!data) return;

  const textElement = (tag, text, className) => {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
  };

  document.getElementById("project-title").textContent = data.title;
  const identification = document.getElementById("identificacion");
  data.identification.forEach(([label, value]) => {
    const item = document.createElement("div");
    item.append(textElement("span", label), textElement("strong", value));
    identification.append(item);
  });

  const knowledgeFields = [["Pregunta", "pregunta"], ["Variables", "variables"], ["Procedimiento", "procedimiento"], ["Resultado", "resultado"], ["Hallazgo", "hallazgo"], ["Interpretación", "interpretacion"], ["Utilidad", "utilidad"], ["Limitación", "limitacion"], ["Evidencia gráfica", "evidencia"]];
  const decisionFields = [["Acción propuesta", "accion"], ["Respaldo", "respaldo"], ["Dirigida a", "destino"], ["Mejora y seguimiento", "seguimiento"], ["Limitación", "limitacion"]];

  function addFields(container, item, fields) {
    fields.forEach(([label, key]) => {
      const row = document.createElement("div");
      const description = textElement("dd", item[key] || "Pendiente");
      if (key === "evidencia" && item.evidenciaHref && /^#[\w-]+$/.test(item.evidenciaHref)) {
        const link = textElement("a", item[key] || "Ver gráfica");
        link.href = item.evidenciaHref;
        description.replaceChildren(link);
      }
      row.append(textElement("dt", label), description);
      container.append(row);
    });
  }

  const knowledgeList = document.getElementById("knowledge-list");
  data.knowledge.forEach((item, index) => {
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.append(textElement("span", String(index + 1).padStart(2, "0"), "item-number"), textElement("strong", item.title), textElement("span", "+", "expand-icon"));
    const fields = document.createElement("dl");
    addFields(fields, item, knowledgeFields);
    details.append(summary, fields);
    knowledgeList.append(details);
  });

  const decisionList = document.getElementById("decision-list");
  data.decisions.forEach((item, index) => {
    const article = document.createElement("article");
    const fields = document.createElement("dl");
    article.append(textElement("span", `ACCIÓN / ${String(index + 1).padStart(2, "0")}`, "section-number"), textElement("h3", item.title));
    addFields(fields, item, decisionFields);
    article.append(fields);
    decisionList.append(article);
  });

})();