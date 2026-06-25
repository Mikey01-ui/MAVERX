import { redirect } from "next/navigation";
import { FinaleScreen } from "@/components/finale/FinaleScreen";
import { getFinaleContent, getMissionCatalog } from "@/lib/content";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeMissionScore } from "@/lib/game/operationScore";
import { getMissionProgress, getUserProgress } from "@/lib/progress";

type PageProps = {
  searchParams: Promise<{ preview?: string }>;
};

export default async function FinalePage({ searchParams }: PageProps) {
  const session = await auth();
  const userId = session!.user!.id;
  const { preview } = await searchParams;
  const isPreview = preview === "1";

  if (!isPreview) {
    const m5 = await getMissionProgress(userId, "m5");
    if (!m5 || m5.status !== "completed") {
      redirect("/hub");
    }
  }

  const [content, missions, progress, user] = await Promise.all([
    getFinaleContent(),
    getMissionCatalog(),
    getUserProgress(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, reportEmail: true, emailReportOptIn: true },
    }),
  ]);

  if (!user) redirect("/login");

  const progressMap = new Map(progress.map((p) => [p.missionId, p]));
  const scores = missions.map((m) => {
    const row = progressMap.get(m.id);
    if (isPreview && (!row || row.status !== "completed")) {
      return {
        missionId: m.id,
        label: m.label,
        name: m.name,
        score: m.id === "m5" ? 82 : m.id === "m4" ? 88 : m.id === "m3" ? 91 : m.id === "m2" ? 76 : 85,
        status: "completed",
      };
    }
    const stateJson = (row?.stateJson as Record<string, unknown> | null) ?? null;
    return {
      missionId: m.id,
      label: m.label,
      name: m.name,
      score: normalizeMissionScore(m.id, row?.score ?? null, stateJson),
      status: row?.status ?? "locked",
    };
  });

  return (
    <FinaleScreen
      content={content}
      email={user.email}
      reportEmail={user.reportEmail?.trim() || user.email}
      initialOptIn={user.emailReportOptIn}
      scores={scores}
      preview={isPreview}
    />
  );
}
