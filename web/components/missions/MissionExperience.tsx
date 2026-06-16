"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MissionIntro, MissionMedia } from "@/lib/content";
import { GameAudioProvider } from "@/lib/audio/GameAudioProvider";
import { toMissionAudioConfig } from "@/lib/audio/missionMedia";
import { checkpointToPhase, phaseToCheckpoint, type MissionPhase } from "@/lib/game/types";
import { useMissionProgress } from "@/lib/game/useMissionProgress";
import { MissionChrome } from "@/components/missions/MissionChrome";
import { BriefPhase } from "@/components/missions/phases/BriefPhase";
import { ProtocolPhase } from "@/components/missions/phases/ProtocolPhase";
import { M1MargusMission } from "@/components/missions/m1/M1MargusMission";
import { MargusM1Brief } from "@/components/missions/margus-m1/MargusM1Brief";
import { MargusM1Protocol } from "@/components/missions/margus-m1/MargusM1Protocol";
import { MissionGame } from "@/components/missions/MissionGame";
import { M1TutorialPhase } from "@/components/missions/m1/M1TutorialPhase";
import { M3TutorialPhase } from "@/components/missions/m3/M3TutorialPhase";
import { M4TutorialPhase } from "@/components/missions/m4/M4TutorialPhase";
import { PlaytestMissionNav } from "@/components/admin/PlaytestMissionNav";

type MissionExperienceProps = {
  intro: MissionIntro;
  media: MissionMedia | null;
  missionId: string;
  missionName: string;
  missionLabel: string;
  initialCheckpoint: string | null;
  resume: boolean;
  savedState?: Record<string, unknown> | null;
};

function formatClock(now: Date) {
  return now.toLocaleTimeString("en-GB", { hour12: false });
}

function shouldShowTutorial() {
  if (typeof window === "undefined") return true;
  try {
    return !new URLSearchParams(window.location.search).has("notutorial");
  } catch {
    return true;
  }
}

function MissionExperienceInner({
  intro,
  missionId,
  missionName,
  missionLabel,
  initialCheckpoint,
  resume,
  savedState,
}: MissionExperienceProps) {
  const isM1 = missionId === "m1";
  const isM3 = missionId === "m3";
  const isM4 = missionId === "m4";
  const hasTutorial = isM1 || isM3 || isM4;
  const { save } = useMissionProgress(intro.missionId);
  const [phase, setPhase] = useState<MissionPhase>(() =>
    checkpointToPhase(initialCheckpoint, resume, missionId)
  );
  const [clock, setClock] = useState("--:--:--");
  const [fromBrief, setFromBrief] = useState(false);

  useEffect(() => {
    const tick = () => setClock(formatClock(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const goToTutorial = useCallback(async () => {
    if (hasTutorial && !shouldShowTutorial()) {
      setPhase("game");
      await save({ phase: "game" });
      return;
    }
    setFromBrief(true);
    setPhase("tutorial");
    await save({ phase: "tutorial" });
  }, [hasTutorial, save]);

  const goToProtocol = useCallback(async () => {
    if (hasTutorial) {
      await goToTutorial();
      return;
    }
    setPhase("protocol");
    await save({ phase: "protocol" });
  }, [goToTutorial, hasTutorial, save]);

  const goToGame = useCallback(async () => {
    setPhase("game");
    await save({ phase: "game" });
  }, [save]);

  useEffect(() => {
    if (phase === "game") return;
    const flushIntro = () => {
      const body = JSON.stringify({
        missionId: intro.missionId,
        status: "in_progress",
        checkpoint: phaseToCheckpoint(phase),
      });
      try {
        void fetch("/api/progress", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        });
      } catch {
        /* tab may already be gone */
      }
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") flushIntro();
    };
    window.addEventListener("pagehide", flushIntro);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flushIntro);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [intro.missionId, phase]);

  if (phase === "game") {
    if (isM1) {
      return <M1MargusMission />;
    }
    return (
      <>
        <MissionGame
          missionId={missionId}
          missionLabel={missionLabel}
          missionName={missionName}
          savedState={savedState}
        />
        {missionId !== "m3" && missionId !== "m4" ? <PlaytestMissionNav missionId={missionId} /> : null}
      </>
    );
  }

  if (phase === "tutorial" && isM3) {
    return <M3TutorialPhase enterFromBrief={fromBrief} onComplete={goToGame} />;
  }

  if (phase === "tutorial" && isM4) {
    return <M4TutorialPhase enterFromBrief={fromBrief} onComplete={goToGame} />;
  }

  if (phase === "tutorial" && isM1) {
    return <M1TutorialPhase enterFromBrief={fromBrief} onComplete={goToGame} />;
  }

  if (isM1) {
    if (phase === "brief") {
      return <MargusM1Brief onContinue={goToProtocol} />;
    }
    if (phase === "protocol") {
      return <MargusM1Protocol onContinue={goToGame} />;
    }
  }

  return (
    <MissionChrome statusLeft={intro.statusLeft} statusRight={intro.statusRight} clock={clock} showAudio>
      {phase === "brief" && <BriefPhase brief={intro.brief} onContinue={goToProtocol} />}
      {phase === "protocol" && (
        <ProtocolPhase
          protocol={intro.protocol}
          onBreach={goToGame}
          showAllSteps={isM3}
          hideBreachButton={isM3}
        />
      )}
    </MissionChrome>
  );
}

export function MissionExperience(props: MissionExperienceProps) {
  const audioConfig = useMemo(() => toMissionAudioConfig(props.media), [props.media]);
  const hasAudio = props.missionId === "m3" || props.missionId === "m4";

  if (!hasAudio || !audioConfig) {
    return <MissionExperienceInner {...props} />;
  }

  return (
    <GameAudioProvider config={audioConfig}>
      <MissionExperienceInner {...props} />
    </GameAudioProvider>
  );
}
