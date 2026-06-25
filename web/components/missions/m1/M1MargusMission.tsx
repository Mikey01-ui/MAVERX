"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { GameStats } from "@/components/missions/margus-m1/MargusM1Game";
import { m1ReportSnapshot } from "@/lib/finale/missionReportSnapshot";
import { persistMissionReport } from "@/lib/finale/persistMissionReport";
import { isMargusM1DebriefState, serializeMargusM1Debrief } from "@/lib/game/margus-m1/session";
import { useMissionProgress } from "@/lib/game/useMissionProgress";

const MargusM1Game = dynamic(
  () => import("@/components/missions/margus-m1/MargusM1Game").then((m) => m.MargusM1Game),
  { ssr: false }
);

const MargusM1Debrief = dynamic(
  () => import("@/components/missions/margus-m1/MargusM1Debrief").then((m) => m.MargusM1Debrief),
  { ssr: false }
);

type Phase = "game" | "debrief";

const PREVIEW_DEBRIEF_STATS: GameStats = {
  timerSec: 847,
  detection: 42,
  errors: 2,
  hintsUsed: 1,
  decoy: 12,
  click: 8,
  verify: 6,
  hint: 5,
  passive: 11,
};

function readInitialPhase(
  debriefPreview: boolean,
  savedState?: Record<string, unknown> | null
): { phase: Phase; stats: GameStats | null } {
  if (debriefPreview) {
    return { phase: "debrief", stats: PREVIEW_DEBRIEF_STATS };
  }
  if (isMargusM1DebriefState(savedState)) {
    return { phase: "debrief", stats: savedState!.stats as GameStats };
  }
  return { phase: "game", stats: null };
}

type M1MargusMissionProps = {
  debriefPreview?: boolean;
  savedState?: Record<string, unknown> | null;
};

export function M1MargusMission({ debriefPreview = false, savedState = null }: M1MargusMissionProps) {
  const router = useRouter();
  const { save } = useMissionProgress("m1");
  const initial = readInitialPhase(debriefPreview, savedState);
  const [phase, setPhase] = useState<Phase>(initial.phase);
  const [stats, setStats] = useState<GameStats | null>(initial.stats);

  const handleComplete = useCallback(
    (s: GameStats) => {
      setStats(s);
      setPhase("debrief");
      void save({
        status: "in_progress",
        checkpoint: "game",
        stateJson: serializeMargusM1Debrief({
          timerSec: s.timerSec,
          detection: s.detection,
          errors: s.errors,
          hintsUsed: s.hintsUsed,
          decoy: s.decoy,
          click: s.click,
          verify: s.verify,
          hint: s.hint,
          passive: s.passive,
        }),
      });
    },
    [save]
  );

  const handleDebriefContinue = useCallback(async () => {
    if (debriefPreview) {
      router.push("/hub");
      return;
    }
    if (!stats) return;
    const snapshot = m1ReportSnapshot(stats);
    await persistMissionReport("m1", snapshot, "completed");
    await fetch("/api/progress", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        missionId: "m2",
        status: "in_progress",
        checkpoint: "start",
      }),
    });
    router.push("/mission/m2");
    router.refresh();
  }, [debriefPreview, router, save, stats]);

  if (phase === "debrief" && stats) {
    return <MargusM1Debrief stats={stats} onContinue={() => void handleDebriefContinue()} />;
  }

  return (
    <MargusM1Game
      onComplete={handleComplete}
      savedState={savedState?.phase === "play" ? savedState : null}
    />
  );
}
