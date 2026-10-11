import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ReportDataset } from "@/src/domain/reports";
import { REPORT_DEFINITIONS } from "@/src/domain/reports";

const pageSize: [number, number] = [595.28, 841.89];
const margin = 42;
const brand = rgb(23 / 255, 105 / 255, 224 / 255);
const text = rgb(23 / 255, 32 / 255, 51 / 255);
const muted = rgb(82 / 255, 96 / 255, 119 / 255);
const line = rgb(217 / 255, 225 / 255, 236 / 255);

function clean(value: string) {
  return value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
}

function wrap(value: string, font: PDFFont, size: number, width: number) {
  const supported = Array.from(clean(value), (character) => {
    try { font.encodeText(character); return character; } catch { return "?"; }
  }).join("");
  const words = supported.split(" ").flatMap((word) => {
    if (font.widthOfTextAtSize(word, size) <= width) return [word];
    const chunks: string[] = [];
    let chunk = "";
    for (const character of word) {
      const next = `${chunk}${character}`;
      if (chunk && font.widthOfTextAtSize(next, size) > width) { chunks.push(chunk); chunk = character; }
      else chunk = next;
    }
    if (chunk) chunks.push(chunk);
    return chunks;
  });
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= width) current = next;
    else { if (current) lines.push(current); current = word; }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export async function buildPdfReport(dataset: ReportDataset) {
  const document = await PDFDocument.create();
  document.setTitle(dataset.title);
  document.setAuthor("Fluência Matemática");
  document.setCreationDate(dataset.generatedAt);
  document.setModificationDate(dataset.generatedAt);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  let page: PDFPage;
  let y = 0;

  const addPage = () => {
    page = document.addPage(pageSize);
    y = pageSize[1] - margin;
    page.drawText("Fluência Matemática", { x: margin, y, size: 9, font: bold, color: brand });
    page.drawText("Relatório pedagógico", { x: pageSize[0] - margin - 105, y, size: 9, font: regular, color: muted });
    y -= 24;
  };
  const ensure = (height: number) => { if (y - height < margin) addPage(); };
  const paragraph = (value: string, options: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; indent?: number; gap?: number } = {}) => {
    const size = options.size ?? 9;
    const font = options.font ?? regular;
    const indent = options.indent ?? 0;
    const lines = wrap(value, font, size, pageSize[0] - margin * 2 - indent);
    ensure(lines.length * (size + 3) + (options.gap ?? 5));
    for (const item of lines) { page.drawText(item, { x: margin + indent, y, size, font, color: options.color ?? text }); y -= size + 3; }
    y -= options.gap ?? 5;
  };
  const heading = (value: string) => { ensure(30); y -= 5; paragraph(value, { size: 13, font: bold, color: brand, gap: 8 }); };
  const rule = () => { ensure(12); page.drawLine({ start: { x: margin, y }, end: { x: pageSize[0] - margin, y }, thickness: 0.6, color: line }); y -= 10; };
  const pct = (value: number | null) => value === null ? "—" : `${value.toLocaleString("pt-BR")}%`;

  addPage();
  paragraph(dataset.title, { size: 20, font: bold, gap: 5 });
  paragraph(`Gerado em ${new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Fortaleza", dateStyle: "short", timeStyle: "short" }).format(dataset.generatedAt)} (America/Fortaleza).`, { color: muted });
  rule();
  heading("Filtros aplicados");
  dataset.filters.forEach((filter) => paragraph(`${filter.label}: ${filter.value}`, { gap: 2 }));
  heading("Resumo com denominadores");
  const s = dataset.summary;
  [
    `Participação: ${pct(s.participationPercent)} — ${s.participants} de ${s.recipients} destinatários-atividade.`,
    `Meta cumprida: ${pct(s.targetPercent)} — ${s.targetReached} de ${s.recipients} destinatários-atividade.`,
    `Precisão: ${pct(s.precisionPercent)} — ${s.correct} acertos em ${s.answers} respostas aceitas.`,
    `Prática adicional: ${s.extraAnswers}. Questões distintas: ${s.distinctQuestions}. Repetições: ${s.repetitions}.`,
    `Recuperação: ${s.recoveryAnswers}. Pontos: ${s.points} em ${s.pointEvents} evento(s), separados da precisão.`,
  ].forEach((item) => paragraph(item, { gap: 3 }));

  heading("Cobertura por habilidade e dificuldade");
  if (!dataset.groups.length) paragraph("Nenhum agrupamento disponível no recorte.", { color: muted });
  dataset.groups.forEach((group) => {
    ensure(45);
    paragraph(`${group.theme} · ${group.skill} · dificuldade ${group.difficulty}`, { font: bold, gap: 2 });
    paragraph(`${group.correct}/${group.answers} acertos (${pct(group.precisionPercent)}); ${group.distinctQuestions} questões distintas; ${group.students} aluno(s); ${group.repetitions} repetições.`, { color: muted, indent: 8, gap: 5 });
  });

  heading("Alunos no recorte");
  if (dataset.scope === "NETWORK") paragraph("Dados individuais não incluídos na exportação municipal.", { color: muted });
  else if (!dataset.students.length) paragraph("Nenhum destinatário disponível no recorte.", { color: muted });
  else dataset.students.forEach((student) => paragraph(`${student.name}: ${student.correct}/${student.answers} acertos (${pct(student.precisionPercent)}); meta ${student.targetReached ? "atingida" : "ainda não atingida"}; ${student.distinctQuestions} questões distintas e ${student.repetitions} repetições.`, { gap: 4 }));

  heading("Definições e notas");
  REPORT_DEFINITIONS.forEach(([term, definition]) => paragraph(`${term}: ${definition}`, { gap: 3 }));
  paragraph(dataset.scope === "NETWORK" ? "Privacidade: relatório municipal agregado, sem nomes de alunos." : "Privacidade: nomes limitados aos alunos do escopo escolar e das turmas autorizadas.", { font: bold });

  const pages = document.getPages();
  pages.forEach((item, index) => item.drawText(`${index + 1} / ${pages.length}`, { x: pageSize[0] / 2 - 10, y: 20, size: 8, font: regular, color: muted }));
  return Buffer.from(await document.save({ useObjectStreams: false }));
}
