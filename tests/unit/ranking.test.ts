import { describe, expect, it } from "vitest";
import { currentMonthRange, rankStudents } from "../../src/domain/ranking";

describe("FM-021 ranking mensal", () => {
  it("calcula o mês civil de Fortaleza com limite final exclusivo", () => {
    const range = currentMonthRange(new Date("2026-10-31T23:59:59-03:00"));
    expect(range).toMatchObject({ label: "Outubro de 2026", timeZone: "America/Fortaleza" });
    expect(range.start.toISOString()).toBe("2026-10-01T03:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-11-01T03:00:00.000Z");
  });

  it("muda de mês pela hora local, não pelo mês UTC", () => {
    expect(currentMonthRange(new Date("2026-11-01T02:59:59.999Z")).label).toBe("Outubro de 2026");
    expect(currentMonthRange(new Date("2026-11-01T03:00:00.000Z")).label).toBe("Novembro de 2026");
  });

  it("inclui zero, ordena por nome e aplica empate 1/1/3", () => {
    const result = rankStudents(
      [{ id: "a", name: "Ana Beatriz" }, { id: "b", name: "Bruno Lima" }, { id: "c", name: "Carla Souza" }, { id: "d", name: "Diego Alves" }],
      [{ studentId: "b", points: 10 }, { studentId: "a", points: 10 }, { studentId: "c", points: 4 }],
      "b",
    );
    expect(result).toEqual([
      { position: 1, name: "Ana Beatriz", points: 10, isCurrentStudent: false },
      { position: 1, name: "Bruno Lima", points: 10, isCurrentStudent: true },
      { position: 3, name: "Carla Souza", points: 4, isCurrentStudent: false },
      { position: 4, name: "Diego Alves", points: 0, isCurrentStudent: false },
    ]);
  });
});
