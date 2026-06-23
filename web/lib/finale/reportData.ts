import { getMissionCatalog } from "@/lib/content";
import { prisma } from "@/lib/db";
import { calculateOperationTotalScore, normalizeMissionScore } from "@/lib/game/operationScore";
import { buildMissionReportSections, type MissionReportSection } from "@/lib/finale/reportInsights";
import { getUserProgress } from "@/lib/progress";

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
    select: { email: true },
  });

  if (!user) {
    throw new Error("User not found.");
  }

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
      status: row?.status ?? "locked",
    };
  });

  return {
    email: user.email,
    missions: rows,
    totalScore: calculateOperationTotalScore(rows),
    sections: buildMissionReportSections(rows, progress),
  };
}
