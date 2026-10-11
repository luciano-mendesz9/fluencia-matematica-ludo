export const REPORT_MAX_PERIOD_DAYS = 366;
export const REPORT_MAX_ROWS = 5_000;

export type ReportQuery = {
  schoolId?: string;
  classId?: string;
  activityId?: string;
  studentId?: string;
  skillId?: string;
  difficulty?: number;
  from?: Date;
  to?: Date;
};

export type ReportSummary = {
  recipients: number;
  participants: number;
  participationPercent: number | null;
  targetReached: number;
  targetPercent: number | null;
  answers: number;
  correct: number;
  precisionPercent: number | null;
  distinctQuestions: number;
  repetitions: number;
  extraAnswers: number;
  recoveryAnswers: number;
  pointEvents: number;
  points: number;
};

export type ReportDataset = {
  title: string;
  generatedAt: Date;
  scope: "NETWORK" | "COORDINATOR" | "TEACHER";
  filters: Array<{ label: string; value: string }>;
  summary: ReportSummary;
  groups: Array<{
    theme: string;
    skill: string;
    difficulty: number;
    answers: number;
    correct: number;
    precisionPercent: number | null;
    distinctQuestions: number;
    students: number;
    repetitions: number;
    extraAnswers: number;
    recoveryAnswers: number;
  }>;
  students: Array<{
    name: string;
    answers: number;
    correct: number;
    precisionPercent: number | null;
    targetReached: boolean;
    distinctQuestions: number;
    repetitions: number;
    extraAnswers: number;
    recoveryAnswers: number;
  }>;
};

export const REPORT_DEFINITIONS = [
  ["Participação", "Destinatários-atividade com ao menos uma resposta aceita."],
  ["Meta cumprida", "Destinatários-atividade que atingiram a meta de respostas aceitas."],
  ["Precisão", "Acertos divididos por respostas aceitas no recorte; não é nota nem diagnóstico."],
  ["Questão distinta", "Versão de questão diferente encontrada no recorte."],
  ["Repetição", "Nova exposição à mesma versão de questão."],
  ["Recuperação", "Resposta depois de erro na mesma sequência; não comprova domínio posterior."],
  ["Prática adicional", "Resposta aceita depois de a meta da atividade ser atingida."],
  ["Pontos", "Soma separada dos eventos de pontuação no mesmo recorte; não altera precisão."],
] as const;

export function neutralizeSpreadsheetText(value: string) {
  return /^[\t\r\n ]*[=+\-@]/.test(value) ? `'${value}` : value;
}

export function safeReportFilename(input: { format: "pdf" | "xlsx"; generatedAt: Date; title?: string }) {
  const slug = (input.title ?? "relatorio-pedagogico")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "relatorio-pedagogico";
  const stamp = input.generatedAt.toISOString().replace(/[:.]/g, "-");
  return `${slug}-${stamp}.${input.format}`;
}

export function reportRowCount(dataset: ReportDataset) {
  return 1 + dataset.filters.length + dataset.groups.length + dataset.students.length + REPORT_DEFINITIONS.length;
}
