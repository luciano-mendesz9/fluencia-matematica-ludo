import ExcelJS from "exceljs";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import type { ReportDataset } from "../../src/domain/reports";
import { neutralizeSpreadsheetText, safeReportFilename } from "../../src/domain/reports";
import { buildPdfReport } from "../../src/server/reports/pdf";
import { buildXlsxReport } from "../../src/server/reports/xlsx";
import { analyticsFiltersFromSearch } from "../../src/features/analytics/filters";

const dataset: ReportDataset = {
  title: "Indicadores pedagógicos",
  generatedAt: new Date("2026-10-11T15:30:00.000Z"),
  scope: "TEACHER",
  filters: [{ label: "Escola", value: "Escola Azul" }, { label: "Turma", value: "4º A" }],
  summary: { recipients: 2, participants: 1, participationPercent: 50, targetReached: 1, targetPercent: 50, answers: 3, correct: 2, precisionPercent: 66.7, distinctQuestions: 2, repetitions: 1, extraAnswers: 1, recoveryAnswers: 1, pointEvents: 2, points: 17 },
  groups: [{ theme: "Números", skill: "Adição", difficulty: 3, answers: 3, correct: 2, precisionPercent: 66.7, distinctQuestions: 2, students: 1, repetitions: 1, extraAnswers: 1, recoveryAnswers: 1 }],
  students: [{ name: `=HYPERLINK("https://invalid.example") ${"NomeExtremo".repeat(30)} 🧮`, answers: 3, correct: 2, precisionPercent: 66.7, targetReached: true, distinctQuestions: 2, repetitions: 1, extraAnswers: 1, recoveryAnswers: 1 }],
};

describe("FM-024 exportações", () => {
  it("neutraliza todos os prefixos de fórmula e gera filename allowlisted", () => {
    for (const value of ["=1+1", "+1", "-1", "@SUM(A1)", "  =1+1", "\t@cmd"]) expect(neutralizeSpreadsheetText(value)).toBe(`'${value}`);
    expect(neutralizeSpreadsheetText("Texto seguro")).toBe("Texto seguro");
    expect(safeReportFilename({ format: "pdf", generatedAt: dataset.generatedAt, title: "Relatório: 4º A / Escola" })).toMatch(/^relatorio-4o-a-escola-[a-zA-Z0-9-]+\.pdf$/);
  });

  it("rejeita data inexistente, dificuldade inválida e período excessivo", () => {
    expect(() => analyticsFiltersFromSearch({ from: "2026-02-30" })).toThrow("Data de relatório inválida");
    expect(() => analyticsFiltersFromSearch({ difficulty: "7" })).toThrow("Dificuldade inválida");
    expect(() => analyticsFiltersFromSearch({ from: "2025-01-01", to: "2026-12-31" })).toThrow("período máximo");
  });

  it("gera XLSX tipado, com quatro abas e texto perigoso sem fórmula", async () => {
    const bytes = await buildXlsxReport(dataset);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes as never);
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(["Resumo", "Cobertura", "Alunos", "Definições"]);
    const studentName = workbook.getWorksheet("Alunos")!.getCell("A2");
    expect(studentName.type).toBe(ExcelJS.ValueType.String);
    expect(studentName.value).toBe(`'=HYPERLINK("https://invalid.example") ${"NomeExtremo".repeat(30)} 🧮`);
    expect(workbook.getWorksheet("Resumo")!.getCell("B10").value).toBeTypeOf("number");
  });

  it("gera PDF válido com metadados e páginas legíveis", async () => {
    const bytes = await buildPdfReport(dataset);
    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
    const parsed = await PDFDocument.load(bytes);
    expect(parsed.getPageCount()).toBeGreaterThan(0);
    expect(parsed.getTitle()).toBe("Indicadores pedagógicos");
  });
});
