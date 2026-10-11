import { describe, expect, it } from "vitest";
import { evaluateFeedback, summarizeAnalytics, type AnalyticsAnswer } from "../../src/domain/analytics";

const recipients = [
  { participationId: "p1", activityId: "a1", studentId: "s1", studentName: "Ana", targetReachedAt: new Date("2026-10-10T12:00:00Z") },
  { participationId: "p2", activityId: "a1", studentId: "s2", studentName: "Bia", targetReachedAt: null },
];

const answer = (overrides: Partial<AnalyticsAnswer> = {}): AnalyticsAnswer => ({
  participationId: "p1",
  activityId: "a1",
  studentId: "s1",
  studentName: "Ana",
  questionVersionId: "q1",
  themeName: "Números",
  skillId: "h1",
  skillName: "Adição",
  difficulty: 3,
  acceptedAt: new Date("2026-10-10T12:00:00Z"),
  correct: true,
  repeated: false,
  extra: false,
  recovery: false,
  ...overrides,
});

describe("FM-022 indicadores pedagógicos", () => {
  it("mantém denominadores, precisão, prática adicional, recuperação e repetição separados", () => {
    const result = summarizeAnalytics({
      recipients,
      policy: { minimumDistinctQuestions: 3, reviewThresholdPercent: 50 },
      answers: [
        answer(),
        answer({ questionVersionId: "q2", correct: false, recovery: true }),
        answer({ questionVersionId: "q2", repeated: true, extra: true }),
      ],
    });
    expect(result.summary).toMatchObject({
      recipients: 2,
      participants: 1,
      participationPercent: 50,
      targetReached: 1,
      targetPercent: 50,
      answers: 3,
      correct: 2,
      precisionPercent: 66.7,
      distinctQuestions: 2,
      repetitions: 1,
      extraAnswers: 1,
      recoveryAnswers: 1,
    });
    expect(result.students.find(({ studentId }) => studentId === "s2")).toMatchObject({ answers: 0, precisionPercent: null });
    expect(result.groups[0]).toMatchObject({ answers: 3, distinctQuestions: 2, repetitions: 1 });
  });

  it("não emite sugestão sem política configurada ou sem questões distintas suficientes", () => {
    expect(evaluateFeedback({ correct: 0, answers: 8, distinctQuestions: 8, policy: { minimumDistinctQuestions: null, reviewThresholdPercent: null } })).toMatchObject({ status: "INSUFFICIENT" });
    expect(evaluateFeedback({ correct: 0, answers: 8, distinctQuestions: 2, policy: { minimumDistinctQuestions: 5, reviewThresholdPercent: 50 } })).toMatchObject({ status: "INSUFFICIENT" });
  });

  it("só sugere retomada com amostra configurada e descreve a evidência sem diagnosticar domínio", () => {
    const feedback = evaluateFeedback({ correct: 2, answers: 5, distinctQuestions: 5, policy: { minimumDistinctQuestions: 5, reviewThresholdPercent: 50 } });
    expect(feedback).toEqual({ status: "REVIEW", message: "Sugestão de retomada baseada em 2 acertos de 5 respostas (40%)." });
    expect(feedback.message.toLocaleLowerCase("pt-BR")).not.toMatch(/diagnóstico|domínio/);
  });
});
