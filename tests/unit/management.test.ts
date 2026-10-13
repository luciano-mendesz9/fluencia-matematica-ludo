import { describe, expect, it } from "vitest";
import { percentage, performanceLabel } from "../../src/domain/management";

describe("management dashboard calculations", () => {
  it("keeps denominators explicit and does not invent percentages", () => {
    expect(percentage(3, 4)).toBe(75);
    expect(percentage(1, 3)).toBe(33.3);
    expect(percentage(0, 0)).toBeNull();
  });

  it("requires a minimum sample before applying descriptive bands", () => {
    expect(performanceLabel(null, 0)).toMatchObject({ label: "Sem dados", tone: "neutral" });
    expect(performanceLabel(20, 4)).toMatchObject({ label: "Amostra pequena", tone: "neutral" });
    expect(performanceLabel(80, 5)).toMatchObject({ label: "Bom desempenho", tone: "success" });
    expect(performanceLabel(60, 5)).toMatchObject({ label: "Atenção", tone: "warning" });
    expect(performanceLabel(40, 5)).toMatchObject({ label: "Precisa de acompanhamento", tone: "danger" });
  });
});
