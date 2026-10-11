import "server-only";

import ExcelJS from "exceljs";
import type { ReportDataset } from "@/src/domain/reports";
import { neutralizeSpreadsheetText, REPORT_DEFINITIONS } from "@/src/domain/reports";

const blue = "1769E0";
const paleBlue = "EAF2FD";
const border = { style: "thin" as const, color: { argb: "D9E1EC" } };
const safe = (value: string) => neutralizeSpreadsheetText(value);
const pct = (value: number | null) => value === null ? null : value / 100;

function configure(sheet: ExcelJS.Worksheet, widths: number[]) {
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.columns.forEach((column, index) => { column.width = widths[index] ?? 18; });
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: blue } };
  header.alignment = { vertical: "middle", wrapText: true };
  sheet.eachRow((row) => row.eachCell((cell) => { cell.border = { top: border, right: border, bottom: border, left: border }; cell.alignment = { ...cell.alignment, vertical: "top", wrapText: true }; }));
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: Math.max(1, sheet.columnCount) } };
}

export async function buildXlsxReport(dataset: ReportDataset) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Fluência Matemática";
  workbook.created = dataset.generatedAt;
  workbook.modified = dataset.generatedAt;
  workbook.calcProperties.fullCalcOnLoad = false;

  const summary = workbook.addWorksheet("Resumo", { properties: { defaultRowHeight: 20 } });
  summary.addRow(["Indicador", "Valor", "Denominador / definição"]);
  for (const filter of dataset.filters) summary.addRow([safe(`Filtro: ${filter.label}`), safe(filter.value), "Recorte aplicado ao painel e ao arquivo"]);
  const metricStart = summary.rowCount + 1;
  const s = dataset.summary;
  summary.addRows([
    ["Participação", pct(s.participationPercent), `${s.participants} de ${s.recipients} destinatários-atividade`],
    ["Meta cumprida", pct(s.targetPercent), `${s.targetReached} de ${s.recipients} destinatários-atividade`],
    ["Precisão", pct(s.precisionPercent), `${s.correct} acertos em ${s.answers} respostas aceitas`],
    ["Prática adicional", s.extraAnswers, "Respostas aceitas depois da meta"],
    ["Questões distintas", s.distinctQuestions, `${s.repetitions} resposta(s) marcadas como repetição`],
    ["Recuperação", s.recoveryAnswers, "Respostas após erro na mesma sequência"],
    ["Pontos", s.points, `${s.pointEvents} evento(s) de pontuação; dimensão separada da precisão`],
    ["Gerado em", dataset.generatedAt, "America/Fortaleza"],
  ]);
  for (const rowNumber of [metricStart, metricStart + 1, metricStart + 2]) summary.getCell(rowNumber, 2).numFmt = "0.0%";
  summary.getCell(metricStart + 7, 2).numFmt = "dd/mm/yyyy hh:mm";
  configure(summary, [30, 28, 62]);

  const coverage = workbook.addWorksheet("Cobertura");
  coverage.addRow(["Tema", "Habilidade", "Dificuldade", "Respostas", "Acertos", "Precisão", "Questões distintas", "Alunos", "Repetições", "Prática adicional", "Recuperação"]);
  dataset.groups.forEach((group) => coverage.addRow([safe(group.theme), safe(group.skill), group.difficulty, group.answers, group.correct, pct(group.precisionPercent), group.distinctQuestions, group.students, group.repetitions, group.extraAnswers, group.recoveryAnswers]));
  coverage.getColumn(6).numFmt = "0.0%";
  configure(coverage, [24, 28, 12, 12, 10, 12, 18, 10, 12, 18, 14]);

  const students = workbook.addWorksheet("Alunos");
  students.addRow(["Aluno", "Respostas", "Acertos", "Precisão", "Meta", "Questões distintas", "Repetições", "Prática adicional", "Recuperação"]);
  if (dataset.scope === "NETWORK") students.addRow(["Dados individuais não incluídos na exportação municipal."]);
  else dataset.students.forEach((student) => students.addRow([safe(student.name), student.answers, student.correct, pct(student.precisionPercent), student.targetReached ? "Atingida" : "Ainda não", student.distinctQuestions, student.repetitions, student.extraAnswers, student.recoveryAnswers]));
  students.getColumn(4).numFmt = "0.0%";
  configure(students, [34, 12, 10, 12, 14, 18, 12, 18, 14]);

  const definitions = workbook.addWorksheet("Definições");
  definitions.addRow(["Termo", "Definição"]);
  REPORT_DEFINITIONS.forEach(([term, definition]) => definitions.addRow([safe(term), safe(definition)]));
  definitions.addRow(["Privacidade", dataset.scope === "NETWORK" ? "Exportação municipal agregada, sem nomes de alunos." : "Nomes limitados aos alunos do escopo escolar e das turmas autorizadas."]);
  configure(definitions, [28, 90]);
  definitions.getRow(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: paleBlue } };

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
