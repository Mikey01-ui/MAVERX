/** Normalize stored progress score to 0–100 (handles legacy M2/M5 point totals). */
export function normalizeMissionScore(
  missionId: string,
  score: number | null,
  stateJson?: Record<string, unknown> | null
): number | null {
  if (score === null) return null;
  if (score <= 100) return score;

  if (missionId === "m2" || missionId === "m5") {
    const detection = stateJson?.detection;
    if (typeof detection === "number") {
      return Math.max(0, 100 - Math.round(detection));
    }
  }

  return Math.min(100, score);
}
