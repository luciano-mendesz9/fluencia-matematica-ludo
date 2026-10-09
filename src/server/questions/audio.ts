import "server-only";

export type QuestionAudioReference = { versionId: string; optionId?: string };
export interface QuestionAudioAdapter { mode: "browser-fallback" | "unavailable"; operational: boolean }

export function getQuestionAudioAdapter(): QuestionAudioAdapter {
  if (process.env.QUESTION_AUDIO_MODE === "browser-fallback") return { mode: "browser-fallback", operational: true };
  return { mode: "unavailable", operational: false };
}
