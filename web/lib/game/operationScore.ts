export type OperationScoreInput = {
  missionId?: string;
  score: number | null;
  status: string;
  stateJson?: Record<string, unknown> | null;
};

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

/** Mean of scored missions (completed or failed), rounded. */
export function calculateOperationTotalScore(scores: OperationScoreInput[]): number | null {
  const scored = scores.filter((s) => s.score !== null && s.status !== "locked");
  if (scored.length === 0) return null;
  const sum = scored.reduce((acc, s) => {
    const normalized =
      s.missionId !== undefined
        ? normalizeMissionScore(s.missionId, s.score, s.stateJson)
        : s.score;
    return acc + (normalized ?? 0);
  }, 0);
  return Math.round(sum / scored.length);
}
