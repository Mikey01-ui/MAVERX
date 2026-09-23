"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MissionIntro, MissionMedia } from "@/lib/content";
import { GameAudioProvider } from "@/lib/audio/GameAudioProvider";
import { toMissionAudioConfig } from "@/lib/audio/missionMedia";
import { checkpointToPhase, phaseToCheckpoint, type MissionPhase } from "@/lib/game/types";
import { missionPhaseHref, nextPhaseAfterBrief } from "@/lib/game/phaseNav";
import { useMissionProgress } from "@/lib/game/useMissionProgress";
import { MissionChrome } from "@/components/missions/MissionChrome";
import { BriefPhase } from "@/components/missions/phases/BriefPhase";
import { ProtocolPhase } from "@/components/missions/phases/ProtocolPhase";
import { MargusM1Brief } from "@/components/missions/margus-m1/MargusM1Brief";
import { MargusM1Protocol } from "@/components/missions/margus-m1/MargusM1Protocol";
import { M2Brief } from "@/components/missions/m2/M2Brief";
import { MissionGame } from "@/components/missions/MissionGame";
import { M2TutorialPhase } from "@/components/missions/m2/M2TutorialPhase";
import { M3TutorialPhase } from "@/components/missions/m3/M3TutorialPhase";
import { M4TutorialPhase } from "@/components/missions/m4/M4TutorialPhase";
import { M5TutorialPhase } from "@/components/missions/m5/M5TutorialPhase";
import { PlaytestMissionNav } from "@/components/admin/PlaytestMissionNav";
import { DifficultyProvider } from "@/lib/game/DifficultyContext";

const M1MargusMission = dynamic(
  () => import("@/components/missions/m1/M1MargusMission").then((m) => m.M1MargusMission),
  { ssr: false }
);

const M1TutorialPhase = dynamic(
  () => import("@/components/missions/m1/M1TutorialPhase").then((m) => m.M1TutorialPhase),
  { ssr: false }
);

type MissionExperienceProps = {
  intro: MissionIntro;
  media: MissionMedia | null;
  missionId: string;
  missionName: string;
  missionLabel: string;
  initialCheckpoint: string | null;
  resume: boolean;
  forcedPhase?: MissionPhase | null;
  savedState?: Record<string, unknown> | null;
  debriefPreview?: boolean;
  difficulty?: string | null;
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
  forcedPhase = null,
  savedState,
  debriefPreview = false,
}: MissionExperienceProps) {
  const isM1 = missionId === "m1";

  if (debriefPreview && isM1) {
    return <M1MargusMission debriefPreview />;
  }
  const isM2 = missionId === "m2";
  const isM3 = missionId === "m3";
  const isM4 = missionId === "m4";
  const isM5 = missionId === "m5";
  const hasTutorial = isM1 || isM2 || isM3 || isM4 || isM5;
  const { save } = useMissionProgress(intro.missionId);
  const [phase, setPhase] = useState<MissionPhase>(() =>
    forcedPhase ?? checkpointToPhase(initialCheckpoint, resume, missionId)
  );
  const [clock, setClock] = useState("--:--:--");
  const [fromBrief, setFromBrief] = useState(false);

  const afterBrief = nextPhaseAfterBrief(missionId);
  const continueFromBriefHref = missionPhaseHref(missionId, afterBrief);
  const continueFromProtocolHref = missionPhaseHref(missionId, "game");
  const skipToGameHref = missionPhaseHref(missionId, "game");

  useEffect(() => {
    const tick = () => setClock(formatClock(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Keep client phase in sync when the server re-renders with a new ?phase=.
  useEffect(() => {
    if (forcedPhase) setPhase(forcedPhase);
  }, [forcedPhase]);

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
      return <M1MargusMission savedState={savedState} />;
    }
    return (
      <>
        <MissionGame
          missionId={missionId}
          missionLabel={missionLabel}
          missionName={missionName}
          savedState={savedState}
        />
        {missionId !== "m3" && missionId !== "m4" && missionId !== "m5" ? (
          <PlaytestMissionNav missionId={missionId} />
        ) : null}
      </>
    );
  }

  if (phase === "tutorial" && isM3) {
    return (
      <M3TutorialPhase
        enterFromBrief={fromBrief}
        onComplete={goToGame}
        continueHref={continueFromProtocolHref}
      />
    );
  }

  if (phase === "tutorial" && isM5) {
    return (
      <M5TutorialPhase
        enterFromBrief={fromBrief}
        onComplete={goToGame}
        continueHref={continueFromProtocolHref}
      />
    );
  }

  if (phase === "tutorial" && isM4) {
    return (
      <M4TutorialPhase
        enterFromBrief={fromBrief}
        onComplete={goToGame}
        continueHref={continueFromProtocolHref}
      />
    );
  }

  if (phase === "tutorial" && isM1) {
    return (
      <M1TutorialPhase
        enterFromBrief={fromBrief}
        onComplete={goToGame}
        continueHref={continueFromProtocolHref}
      />
    );
  }

  if (phase === "tutorial" && isM2) {
    return (
      <M2TutorialPhase
        enterFromBrief={fromBrief}
        onComplete={goToGame}
        continueHref={continueFromProtocolHref}
      />
    );
  }

  if (isM1) {
    if (phase === "brief") {
      return (
        <MissionChrome
          statusLeft={intro.statusLeft}
          statusRight={intro.statusRight}
          clock={clock}
          showAudio
          theme="theme-v2"
        >
          <MargusM1Brief onContinue={goToProtocol} continueHref={continueFromBriefHref} />
        </MissionChrome>
      );
    }
    if (phase === "protocol") {
      return (
        <MissionChrome
          statusLeft={intro.statusLeft}
          statusRight={intro.statusRight}
          clock={clock}
          showAudio
          theme="theme-v2"
        >
          <MargusM1Protocol onContinue={goToGame} continueHref={continueFromProtocolHref} />
        </MissionChrome>
      );
    }
  }

  if (missionId === "m2") {
    if (phase === "brief") {
      return (
        <MissionChrome
          statusLeft={intro.statusLeft}
          statusRight={intro.statusRight}
          clock={clock}
          showAudio
          theme="theme-v2"
        >
          <M2Brief
            onContinue={goToProtocol}
            onSkip={goToGame}
            continueHref={continueFromBriefHref}
            skipHref={skipToGameHref}
          />
        </MissionChrome>
      );
    }
  }

  return (
    <MissionChrome
      statusLeft={intro.statusLeft}
      statusRight={intro.statusRight}
      clock={clock}
      showAudio
      theme="theme-v2"
    >
      {phase === "brief" && (
        <BriefPhase brief={intro.brief} onContinue={goToProtocol} continueHref={continueFromBriefHref} />
      )}
      {phase === "protocol" && (
        <ProtocolPhase
          protocol={intro.protocol}
          onBreach={goToGame}
          breachHref={continueFromProtocolHref}
          showAllSteps={isM3}
          hideBreachButton={isM3}
        />
      )}
    </MissionChrome>
  );
}

export function MissionExperience(props: MissionExperienceProps) {
  const audioConfig = useMemo(() => toMissionAudioConfig(props.media), [props.media]);
  const hasAudio =
    props.missionId === "m1" ||
    props.missionId === "m2" ||
    props.missionId === "m3" ||
    props.missionId === "m4" ||
    props.missionId === "m5";

  const inner =
    !hasAudio || !audioConfig ? (
      <MissionExperienceInner {...props} />
    ) : (
      <GameAudioProvider config={audioConfig}>
        <MissionExperienceInner {...props} />
      </GameAudioProvider>
    );

  return <DifficultyProvider difficulty={props.difficulty}>{inner}</DifficultyProvider>;
}
