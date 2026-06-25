import type { MissionMeta } from "@/lib/content";
import type { ProgressRecord } from "@/lib/progress";
import { normalizeMissionScore } from "@/lib/game/operationScore";

export type OperationScoreRow = {
  missionId: string;
  label: string;
  name: string;
  score: number | null;
  status: string;
};

export function resolveMissionReportStatus(
  row: Pick<ProgressRecord, "status" | "checkpoint" | "score"> | null | undefined,
): string {
  if (!row) return "locked";
  if (row.status === "completed") return "completed";
  if (row.checkpoint === "failed") return "failed";
  if (row.score !== null) return "in_progress";
  return row.status;
}

/** Build the per-mission score sheet used by the finale screen and operation PDF. */
export function buildOperationScoreRows(
  missions: MissionMeta[],
  progress: ProgressRecord[],
): OperationScoreRow[] {
  const progressMap = new Map(progress.map((p) => [p.missionId, p]));
  return missions.map((m) => {
    const row = progressMap.get(m.id);
    const stateJson = (row?.stateJson as Record<string, unknown> | null) ?? null;
    return {
      missionId: m.id,
      label: m.label,
      name: m.name,
      score: normalizeMissionScore(m.id, row?.score ?? null, stateJson),
      status: resolveMissionReportStatus(row),
    };
  });
}

/** Mean of displayed mission scores (missions played, not locked). */
export function calculateOperationTotalScore(rows: OperationScoreRow[]): number | null {
  const scored = rows.filter((r) => r.score !== null && r.status !== "locked");
  if (scored.length === 0) return null;
  const sum = scored.reduce((acc, r) => acc + (r.score ?? 0), 0);
  return Math.round(sum / scored.length);
}
