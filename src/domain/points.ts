export function awardFor(errorStreak: number): number {
  if (!Number.isInteger(errorStreak) || errorStreak < 0) throw new RangeError("A sequência de erros deve ser um inteiro não negativo.");
  return Math.max(1, 10 - 3 * errorStreak);
}
