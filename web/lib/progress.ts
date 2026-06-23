import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { MissionMeta } from "@/lib/content";

function toJsonInput(
  value: Record<string, unknown> | null | undefined
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

export type ProgressStatus = "locked" | "in_progress" | "completed";

export type ProgressRecord = {
  missionId: string;
  status: ProgressStatus;
  checkpoint: string | null;
  stateJson: Record<string, unknown> | null;
  score: number | null;
  updatedAt: Date;
};

export type ProgressPatch = {
  missionId: string;
  status?: ProgressStatus;
  checkpoint?: string | null;
  stateJson?: Record<string, unknown> | null;
  score?: number | null;
};

export async function getUserProgress(userId: string): Promise<ProgressRecord[]> {
  const rows = await prisma.userProgress.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((row) => ({
    missionId: row.missionId,
    status: row.status as ProgressStatus,
    checkpoint: row.checkpoint,
    stateJson: (row.stateJson as Record<string, unknown> | null) ?? null,
    score: row.score,
    updatedAt: row.updatedAt,
  }));
}

export async function getMissionProgress(
  userId: string,
  missionId: string
): Promise<ProgressRecord | null> {
  const row = await prisma.userProgress.findUnique({
    where: { userId_missionId: { userId, missionId } },
  });
  if (!row) return null;
  return {
    missionId: row.missionId,
    status: row.status as ProgressStatus,
    checkpoint: row.checkpoint,
    stateJson: (row.stateJson as Record<string, unknown> | null) ?? null,
    score: row.score,
    updatedAt: row.updatedAt,
  };
}

export async function upsertProgress(userId: string, patch: ProgressPatch): Promise<ProgressRecord> {
  const row = await prisma.userProgress.upsert({
    where: { userId_missionId: { userId, missionId: patch.missionId } },
    create: {
      userId,
      missionId: patch.missionId,
      status: patch.status ?? "in_progress",
      checkpoint: patch.checkpoint ?? null,
      stateJson: toJsonInput(patch.stateJson),
      score: patch.score ?? null,
    },
    update: {
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.checkpoint !== undefined ? { checkpoint: patch.checkpoint } : {}),
      ...(patch.stateJson !== undefined ? { stateJson: toJsonInput(patch.stateJson) } : {}),
      ...(patch.score !== undefined ? { score: patch.score } : {}),
    },
  });
  return {
    missionId: row.missionId,
    status: row.status as ProgressStatus,
    checkpoint: row.checkpoint,
    stateJson: (row.stateJson as Record<string, unknown> | null) ?? null,
    score: row.score,
    updatedAt: row.updatedAt,
  };
}

export function resolveMissionAccess(
  missions: MissionMeta[],
  progressMap: Map<string, ProgressRecord>,
  options?: { isAdmin?: boolean }
): Map<string, { playable: boolean; continueUrl?: string; label: string }> {
  const isAdmin = options?.isAdmin ?? false;
  const sorted = [...missions].sort((a, b) => a.order - b.order);
  const result = new Map<string, { playable: boolean; continueUrl?: string; label: string }>();

  for (const mission of sorted) {
    const record = progressMap.get(mission.id);
    if (record?.status === "in_progress") {
      result.set(mission.id, {
        playable: true,
        continueUrl: `/mission/${mission.id}?resume=1`,
        label: "continue",
      });
      continue;
    }
    if (record?.status === "completed") {
      result.set(mission.id, { playable: true, label: "replay" });
      continue;
    }

    if (!mission.requiresMissionId) {
      result.set(mission.id, { playable: true, label: "play" });
      continue;
    }

    const prereq = progressMap.get(mission.requiresMissionId);
    if (isAdmin || prereq?.status === "completed") {
      result.set(mission.id, { playable: true, label: isAdmin ? "play" : "play" });
    } else {
      result.set(mission.id, { playable: false, label: "locked" });
    }
  }

  return result;
}

export function findLatestInProgress(progress: ProgressRecord[]): ProgressRecord | null {
  return (
    progress
      .filter((p) => p.status === "in_progress")
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0] ?? null
  );
}

/** True when the player has not yet passed the intro / first brief for this mission. */
export function isFreshMissionStart(record: ProgressRecord | null | undefined): boolean {
  if (!record || record.status !== "in_progress") return false;
  if (record.stateJson) return false;
  const checkpoint = record.checkpoint ?? "start";
  return checkpoint === "start" || checkpoint === "intro";
}

/** True when the player has moved past a fresh start and should resume, not restart. */
export function hasResumableSession(record: ProgressRecord | null | undefined): boolean {
  if (!record || record.status !== "in_progress") return false;
  if (record.stateJson) return true;
  const checkpoint = record.checkpoint;
  return !!checkpoint && checkpoint !== "start" && checkpoint !== "intro";
}

/** Hub “continue” target: earliest in-progress mission, else next unlocked mission after last completed. */
export function findContinueMission(
  missions: MissionMeta[],
  progress: ProgressRecord[]
): { missionId: string; checkpoint: string; status: ProgressStatus } | null {
  const map = new Map(progress.map((p) => [p.missionId, p]));
  const sorted = [...missions].sort((a, b) => a.order - b.order);

  for (const mission of sorted) {
    const record = map.get(mission.id);
    if (record?.status === "in_progress" && !isFreshMissionStart(record)) {
      return {
        missionId: mission.id,
        checkpoint: record.checkpoint ?? "start",
        status: "in_progress",
      };
    }
  }

  for (const mission of sorted) {
    if (mission.requiresMissionId) {
      const prereq = map.get(mission.requiresMissionId);
      if (prereq?.status !== "completed") continue;
    }
    const record = map.get(mission.id);
    if (record?.status === "completed") continue;
    if (!record || record.status === "locked") {
      return { missionId: mission.id, checkpoint: "start", status: "in_progress" };
    }
  }

  return null;
}

export async function ensureFirstMissionUnlocked(userId: string): Promise<void> {
  const existing = await prisma.userProgress.findFirst({ where: { userId } });
  if (existing) return;
  await prisma.userProgress.create({
    data: { userId, missionId: "m1", status: "in_progress", checkpoint: "start" },
  });
}
