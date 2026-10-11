export type AnalyticsPolicy = {
  minimumDistinctQuestions: number | null;
  reviewThresholdPercent: number | null;
};

export type AnalyticsRecipient = {
  participationId: string;
  activityId: string;
  studentId: string;
  studentName: string;
  targetReachedAt: Date | null;
};

export type AnalyticsAnswer = {
  participationId: string;
  activityId: string;
  studentId: string;
  studentName: string;
  questionVersionId: string;
  themeName: string;
  skillId: string | null;
  skillName: string | null;
  difficulty: number;
  acceptedAt: Date;
  correct: boolean;
  repeated: boolean;
  extra: boolean;
  recovery: boolean;
};

type Counter = {
  answers: number;
  correct: number;
  repetitions: number;
  extraAnswers: number;
  recoveryAnswers: number;
  questionIds: Set<string>;
  studentIds: Set<string>;
};

const counter = (): Counter => ({
  answers: 0,
  correct: 0,
  repetitions: 0,
  extraAnswers: 0,
  recoveryAnswers: 0,
  questionIds: new Set(),
  studentIds: new Set(),
});

function add(target: Counter, answer: AnalyticsAnswer) {
  target.answers += 1;
  target.correct += answer.correct ? 1 : 0;
  target.repetitions += answer.repeated ? 1 : 0;
  target.extraAnswers += answer.extra ? 1 : 0;
  target.recoveryAnswers += answer.recovery ? 1 : 0;
  target.questionIds.add(answer.questionVersionId);
  target.studentIds.add(answer.studentId);
}

const percent = (numerator: number, denominator: number) =>
  denominator === 0 ? null : Math.round((numerator / denominator) * 1000) / 10;

export function evaluateFeedback(input: {
  correct: number;
  answers: number;
  distinctQuestions: number;
  policy: AnalyticsPolicy;
}) {
  const { minimumDistinctQuestions, reviewThresholdPercent } = input.policy;
  if (minimumDistinctQuestions === null || reviewThresholdPercent === null) {
    return {
      status: "INSUFFICIENT" as const,
      message: "Dados insuficientes: os limiares pedagógicos ainda não foram configurados.",
    };
  }
  if (input.distinctQuestions < minimumDistinctQuestions) {
    return {
      status: "INSUFFICIENT" as const,
      message: `Dados insuficientes: ${input.distinctQuestions} de ${minimumDistinctQuestions} questões distintas necessárias.`,
    };
  }
  const precision = percent(input.correct, input.answers) ?? 0;
  if (precision < reviewThresholdPercent) {
    return {
      status: "REVIEW" as const,
      message: `Sugestão de retomada baseada em ${input.correct} acertos de ${input.answers} respostas (${precision}%).`,
    };
  }
  return {
    status: "OBSERVATION" as const,
    message: `Observação descritiva: ${input.correct} acertos de ${input.answers} respostas (${precision}%).`,
  };
}

function publicCounter(value: Counter) {
  return {
    answers: value.answers,
    correct: value.correct,
    precisionPercent: percent(value.correct, value.answers),
    distinctQuestions: value.questionIds.size,
    repetitions: value.repetitions,
    extraAnswers: value.extraAnswers,
    recoveryAnswers: value.recoveryAnswers,
    students: value.studentIds.size,
  };
}

export function summarizeAnalytics(input: {
  recipients: AnalyticsRecipient[];
  answers: AnalyticsAnswer[];
  policy: AnalyticsPolicy;
}) {
  const total = counter();
  const byGroup = new Map<string, Counter & { themeName: string; skillId: string | null; skillName: string | null; difficulty: number }>();
  const byStudent = new Map<string, Counter & { studentName: string; targetReached: boolean }>();
  const feedback = new Map<string, Counter & { studentId: string; studentName: string; themeName: string; skillId: string | null; skillName: string | null; difficulty: number }>();
  const recipientByStudent = new Map(input.recipients.map((item) => [item.studentId, item]));

  for (const recipient of input.recipients) {
    const existing = byStudent.get(recipient.studentId);
    if (existing) existing.targetReached ||= recipient.targetReachedAt !== null;
    else byStudent.set(recipient.studentId, { ...counter(), studentName: recipient.studentName, targetReached: recipient.targetReachedAt !== null });
  }
  for (const answer of input.answers) {
    add(total, answer);
    const groupKey = `${answer.skillId ?? `theme:${answer.themeName}`}|${answer.difficulty}`;
    const group = byGroup.get(groupKey) ?? { ...counter(), themeName: answer.themeName, skillId: answer.skillId, skillName: answer.skillName, difficulty: answer.difficulty };
    add(group, answer);
    byGroup.set(groupKey, group);

    const student = byStudent.get(answer.studentId) ?? { ...counter(), studentName: answer.studentName, targetReached: Boolean(recipientByStudent.get(answer.studentId)?.targetReachedAt) };
    add(student, answer);
    byStudent.set(answer.studentId, student);

    const feedbackKey = `${answer.studentId}|${groupKey}`;
    const evidence = feedback.get(feedbackKey) ?? { ...counter(), studentId: answer.studentId, studentName: answer.studentName, themeName: answer.themeName, skillId: answer.skillId, skillName: answer.skillName, difficulty: answer.difficulty };
    add(evidence, answer);
    feedback.set(feedbackKey, evidence);
  }

  const participatingPairs = new Set(input.answers.map((answer) => answer.participationId)).size;
  const targetReached = input.recipients.filter((recipient) => recipient.targetReachedAt !== null).length;
  return {
    summary: {
      recipients: input.recipients.length,
      participants: participatingPairs,
      participationPercent: percent(participatingPairs, input.recipients.length),
      targetReached,
      targetPercent: percent(targetReached, input.recipients.length),
      ...publicCounter(total),
    },
    groups: [...byGroup.entries()].map(([key, value]) => ({ key, themeName: value.themeName, skillId: value.skillId, skillName: value.skillName, difficulty: value.difficulty, ...publicCounter(value) }))
      .sort((a, b) => a.themeName.localeCompare(b.themeName, "pt-BR") || (a.skillName ?? "").localeCompare(b.skillName ?? "", "pt-BR") || a.difficulty - b.difficulty),
    students: [...byStudent.entries()].map(([studentId, value]) => ({ studentId, studentName: value.studentName, targetReached: value.targetReached, ...publicCounter(value) }))
      .sort((a, b) => a.studentName.localeCompare(b.studentName, "pt-BR")),
    feedback: [...feedback.values()].map((value) => ({
      studentId: value.studentId,
      studentName: value.studentName,
      themeName: value.themeName,
      skillId: value.skillId,
      skillName: value.skillName,
      difficulty: value.difficulty,
      ...publicCounter(value),
      ...evaluateFeedback({ correct: value.correct, answers: value.answers, distinctQuestions: value.questionIds.size, policy: input.policy }),
    })).sort((a, b) => (a.status === "REVIEW" ? -1 : 1) - (b.status === "REVIEW" ? -1 : 1) || a.studentName.localeCompare(b.studentName, "pt-BR")),
  };
}
