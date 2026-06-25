import { getMissionCatalog } from "@/lib/content";
import { prisma } from "@/lib/db";
import { buildMissionReportSections, type MissionReportSection } from "@/lib/finale/reportInsights";
import {
  buildOperationScoreRows,
  calculateOperationTotalScore,
  type OperationScoreRow,
} from "@/lib/finale/operationScores";
import { getUserProgress } from "@/lib/progress";

export type OperationReportMission = OperationScoreRow;

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

  const rows = buildOperationScoreRows(missions, progress);

  return {
    email: reportEmail,
    missions: rows,
    totalScore: calculateOperationTotalScore(rows),
    sections: buildMissionReportSections(rows, progress),
  };
}

// Re-export for callers that only need status resolution.
export { resolveMissionReportStatus } from "@/lib/finale/operationScores";
