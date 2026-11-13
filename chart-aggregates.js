((root) => {
  function groupAverage(groups, key, variable) {
    const results = new Map();
    const countField = `${variable}_no_nula`;
    const sumField = `${variable}_suma`;
    for (const group of groups) {
      const label = group[key] === null || group[key] === undefined || group[key] === "" ? "Sin dato" : group[key];
      const count = Number(group[countField] ?? group[`${variable}_no_nulo`]);
      const sum = group[sumField] === null ? 0 : Number(group[sumField]);
      if (!Number.isSafeInteger(count) || count < 0 || !Number.isFinite(sum)) throw new Error("Agregado inválido");
      const current = results.get(label) || { label, count: 0, sum: 0 };
      current.count += count;
      current.sum += sum;
      results.set(label, current);
    }
    return Array.from(results.values()).sort((left, right) => {
      if (typeof left.label === "number" && typeof right.label === "number") return left.label - right.label;
      return String(left.label).localeCompare(String(right.label), "es");
    }).map(item => ({
      label: item.label,
      count: item.count,
      value: item.count ? item.sum / item.count : null
    }));
  }

  function groupCounts(groups, key) {
    const results = new Map();
    for (const group of groups) {
      const label = group[key] === null || group[key] === undefined || group[key] === "" ? "Sin dato" : group[key];
      const count = Number(group.mediciones);
      if (!Number.isSafeInteger(count) || count < 0) throw new Error("Conteo inválido");
      results.set(label, (results.get(label) || 0) + count);
    }
    return Array.from(results, ([label, value]) => ({ label, value, count: value })).sort((left, right) => {
      if (typeof left.label === "number" && typeof right.label === "number") return left.label - right.label;
      return String(left.label).localeCompare(String(right.label), "es");
    });
  }

  function combined(groups, month) {
    return groupAverage(groups.filter(group => (group.mes || "Sin dato") === month).map(group => ({
      ...group,
      combinacion: `${group.condicion || "Sin dato"} / ${group.franja || "Sin dato"}`
    })), "combinacion", "consumo");
  }

  const api = { groupAverage, groupCounts, combined };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ChartAggregates = api;
})(typeof window !== "undefined" ? window : globalThis);