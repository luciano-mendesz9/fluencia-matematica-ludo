import "server-only";

import { AuthorizationError } from "@/src/server/auth/errors";
import type { ReportDataset, ReportQuery } from "@/src/domain/reports";
import { REPORT_MAX_ROWS, reportRowCount } from "@/src/domain/reports";
import type { AuthenticatedPrincipal } from "@/src/server/auth/policies";
import { getAuthorizedAnalytics } from "@/src/server/analytics/service";

const dateLabel = (date?: Date) => date
  ? new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Fortaleza", dateStyle: "short" }).format(date)
  : "Todo o histórico autorizado";

const percent = (value: number | null) => value === null ? "Não aplicável" : `${value.toLocaleString("pt-BR")}%`;

export async function getAuthorizedReportDataset(input: {
  actor: AuthenticatedPrincipal;
  query: ReportQuery;
  generatedAt?: Date;
}) {
  const generatedAt = input.generatedAt ?? new Date();
  const result = await getAuthorizedAnalytics({ actor: input.actor, filters: input.query, now: generatedAt });
  const selectedClass = result.options.classes.find((item) => item.id === input.query.classId);
  const selectedActivity = result.options.activities.find((item) => item.id === input.query.activityId);
  const selectedStudent = result.options.students.find((item) => item.id === input.query.studentId);
  const selectedSkill = result.options.skills.find((item) => item.id === input.query.skillId);
  const selectedSchool = input.query.schoolId
    ? result.options.classes.find((item) => item.schoolId === input.query.schoolId)?.schoolName ?? "Escola selecionada"
    : "Toda a rede autorizada";

  const dataset: ReportDataset = {
    title: "Indicadores pedagógicos",
    generatedAt,
    scope: result.scope,
    filters: [
      { label: "Escola", value: selectedSchool },
      { label: "Turma", value: selectedClass ? `${selectedClass.name} · ${selectedClass.grade}º ano` : "Todas as turmas autorizadas" },
      { label: "Atividade", value: selectedActivity?.title ?? "Todas as atividades" },
      ...(result.scope === "NETWORK" ? [] : [{ label: "Aluno", value: selectedStudent?.name ?? "Todos os alunos autorizados" }]),
      { label: "Habilidade", value: selectedSkill ? `${selectedSkill.theme.name} · ${selectedSkill.name}` : "Todas as habilidades" },
      { label: "Dificuldade", value: input.query.difficulty ? String(input.query.difficulty) : "1 a 6" },
      { label: "Período inicial", value: dateLabel(input.query.from) },
      { label: "Período final", value: input.query.to ? dateLabel(new Date(input.query.to.getTime() - 1)) : "Até a geração" },
    ],
    summary: { ...result.summary, pointEvents: result.points.events, points: result.points.total },
    groups: result.groups.map((group) => ({
      theme: group.themeName,
      skill: group.skillName ?? "Habilidade não informada",
      difficulty: group.difficulty,
      answers: group.answers,
      correct: group.correct,
      precisionPercent: group.precisionPercent,
      distinctQuestions: group.distinctQuestions,
      students: group.students,
      repetitions: group.repetitions,
      extraAnswers: group.extraAnswers,
      recoveryAnswers: group.recoveryAnswers,
    })),
    students: result.scope === "NETWORK" ? [] : result.students.map((student) => ({
      name: student.studentName,
      answers: student.answers,
      correct: student.correct,
      precisionPercent: student.precisionPercent,
      targetReached: student.targetReached,
      distinctQuestions: student.distinctQuestions,
      repetitions: student.repetitions,
      extraAnswers: student.extraAnswers,
      recoveryAnswers: student.recoveryAnswers,
    })),
  };
  if (reportRowCount(dataset) > REPORT_MAX_ROWS) {
    throw new AuthorizationError("VALIDATION", `O relatório excede o limite de ${REPORT_MAX_ROWS.toLocaleString("pt-BR")} linhas. Refine os filtros.`);
  }
  return dataset;
}

export const reportPercent = percent;
