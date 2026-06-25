import { redirect } from "next/navigation";
import { AmbientShell } from "@/components/layout/AmbientShell";
import { StatusBar } from "@/components/layout/StatusBar";
import { HubClient } from "@/components/hub/HubClient";
import { getHubContent, getMissionCatalog } from "@/lib/content";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdminRole } from "@/lib/roles";
import {
  ensureFirstMissionUnlocked,
  findContinueMission,
  getMissionProgress,
  getUserProgress,
  isFreshMissionStart,
  resolveMissionAccess,
} from "@/lib/progress";

export default async function HubPage() {
  const session = await auth();
  const userId = session!.user!.id;

  await ensureFirstMissionUnlocked(userId);

  const m1 = await getMissionProgress(userId, "m1");
  if (isFreshMissionStart(m1)) {
    redirect("/intro");
  }

  const [content, missions, progress] = await Promise.all([
    getHubContent(),
    getMissionCatalog(),
    getUserProgress(userId),
  ]);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const isAdmin = isAdminRole(user?.role);
  const progressMap = new Map(progress.map((p) => [p.missionId, p]));
  const accessMap = resolveMissionAccess(missions, progressMap, { isAdmin });
  const access = Object.fromEntries(accessMap.entries());
  const continueTarget = findContinueMission(missions, progress);
  const continueMission = continueTarget
    ? {
        id: continueTarget.missionId,
        name: missions.find((m) => m.id === continueTarget.missionId)?.name ?? continueTarget.missionId,
        label: missions.find((m) => m.id === continueTarget.missionId)?.label ?? continueTarget.missionId,
        checkpoint: continueTarget.checkpoint,
        url: `/mission/${continueTarget.missionId}?resume=1`,
      }
    : null;
  const showReportLink = progress.some((p) => p.status === "completed" || p.status === "in_progress");

  return (
    <AmbientShell theme="theme-v2">
      <StatusBar left={content.statusLeft} right={content.statusRight} />
      <HubClient
        content={content}
        missions={missions}
        progress={progress.map((p) => ({
          ...p,
          updatedAt: p.updatedAt.toISOString(),
        }))}
        access={access}
        continueMission={continueMission}
        showReportLink={showReportLink}
      />
    </AmbientShell>
  );
}
