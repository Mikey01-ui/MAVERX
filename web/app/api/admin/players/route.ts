import { prisma } from "@/lib/db";
import { jsonWithCors, optionsCors, requireDashboardAdmin } from "@/lib/dashboardAuth";

export async function OPTIONS(request: Request) {
  return optionsCors(request);
}

export async function GET(request: Request) {
  const gate = await requireDashboardAdmin(request);
  if (!gate.ok) return gate.response;

  try {
  const users = await prisma.user.findMany({
    where: { role: { not: "admin" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      company: true,
      difficulty: true,
      preferredLocale: true,
      createdAt: true,
      groupId: true,
      group: { select: { name: true, locale: true } },
      progress: {
        select: {
          missionId: true,
          status: true,
          checkpoint: true,
          score: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  const missionOrder = ["m1", "m2", "m3", "m4", "m5"];

  return jsonWithCors(request, {
    players: users.map((u) => {
      const byMission = new Map(u.progress.map((p) => [p.missionId, p]));
      let currentMission: string | null = null;
      let completedCount = 0;
      for (const mid of missionOrder) {
        const p = byMission.get(mid);
        if (p?.status === "completed") {
          completedCount += 1;
          continue;
        }
        if (p && (p.status === "in_progress" || p.status === "locked")) {
          if (!currentMission && p.status === "in_progress") currentMission = mid;
        }
      }
      if (!currentMission) {
        const inProg = u.progress.find((p) => p.status === "in_progress");
        currentMission = inProg?.missionId ?? (completedCount >= 5 ? "m5" : "m1");
      }
      const current = byMission.get(currentMission);
      const lastScore = u.progress.find((p) => p.score != null)?.score ?? null;

      return {
        id: u.id,
        email: u.email,
        name: u.name,
        company: u.company,
        difficulty: u.difficulty,
        locale: u.group?.locale ?? u.preferredLocale,
        preferredLocale: u.preferredLocale,
        groupName: u.group?.name ?? null,
        joinedAt: u.createdAt.toISOString(),
        currentMission,
        checkpoint: current?.checkpoint ?? null,
        completedMissions: completedCount,
        lastScore,
        progress: missionOrder.map((mid) => {
          const p = byMission.get(mid);
          return {
            missionId: mid,
            status: p?.status ?? "locked",
            checkpoint: p?.checkpoint ?? null,
            score: p?.score ?? null,
            updatedAt: p?.updatedAt?.toISOString() ?? null,
          };
        }),
      };
    }),
  });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load players.";
    console.error("[api/admin/players GET]", err);
    return jsonWithCors(request, { error: message }, { status: 500 });
  }
}
