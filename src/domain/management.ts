export function percentage(numerator: number, denominator: number) {
  return denominator ? Math.round((numerator / denominator) * 1000) / 10 : null;
}

export function performanceLabel(precision: number | null, answers: number) {
  if (answers === 0 || precision === null) return { label: "Sem dados", tone: "neutral" as const };
  if (answers < 5) return { label: "Amostra pequena", tone: "neutral" as const };
  if (precision >= 75) return { label: "Bom desempenho", tone: "success" as const };
  if (precision >= 50) return { label: "Atenção", tone: "warning" as const };
  return { label: "Precisa de acompanhamento", tone: "danger" as const };
}
