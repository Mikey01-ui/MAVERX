import type { ProgressRecord } from "@/lib/progress";
import { getMissionCatalog } from "@/lib/content";
import { prisma } from "@/lib/db";
import { calculateOperationTotalScore, normalizeMissionScore } from "@/lib/game/operationScore";
import { buildMissionReportSections, type MissionReportSection } from "@/lib/finale/reportInsights";
import { getUserProgress } from "@/lib/progress";

export function resolveMissionReportStatus(
  row: Pick<ProgressRecord, "status" | "checkpoint" | "score"> | null | undefined,
): string {
  if (!row) return "locked";
  if (row.status === "completed") return "completed";
  if (row.checkpoint === "failed") return "failed";
  if (row.score !== null) return "in_progress";
  return row.status;
}

export type OperationReportMission = {
  missionId: string;
  label: string;
  name: string;
  score: number | null;
  status: string;
};

export type OperationReportData = {
  email: string;
  missions: OperationReportMission[];
  totalScore: number | null;
  sections: MissionReportSection[];
};

export async function getOperationReportData(userId: string): Promise<OperationReportData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, reportEmail: true },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const reportEmail = user.reportEmail?.trim() || user.email;

  const [missions, progress] = await Promise.all([
    getMissionCatalog(),
    getUserProgress(userId),
  ]);

  const progressMap = new Map(progress.map((p) => [p.missionId, p]));
  const rows = missions.map((m) => {
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

  return {
    email: reportEmail,
    missions: rows,
    totalScore: calculateOperationTotalScore(rows),
    sections: buildMissionReportSections(rows, progress),
  };
}
