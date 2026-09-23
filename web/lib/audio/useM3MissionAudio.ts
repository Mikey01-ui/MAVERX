"use client";

import { useEffect, useRef } from "react";
import type { M3GameState } from "@/lib/game/m3/types";
import { useOptionalGameAudio } from "@/lib/audio/GameAudioProvider";

const AMBIENT_PHASES = new Set<M3GameState["phase"]>(["hack", "desktop", "play", "signoff"]);

export function useM3MissionAudio(state: M3GameState) {
  const audio = useOptionalGameAudio();
  const prev = useRef({
    assignedCount: Object.keys(state.assigned).length,
    wrongRoutes: state.wrongRoutes,
    gameOver: state.gameOver,
    phase: state.phase,
    detectionWarned: { ...state.detectionWarned },
  });

  useEffect(() => {
    if (!audio) return;
    const shouldAmbient = AMBIENT_PHASES.has(state.phase) && audio.unlocked && !audio.muted;
    if (shouldAmbient) audio.startAmbient();
    else audio.stopAmbient();
  }, [audio, state.phase, audio?.unlocked, audio?.muted]);

  useEffect(() => {
    if (!audio) return;

    const p = prev.current;
    const assignedCount = Object.keys(state.assigned).length;

    if (assignedCount > p.assignedCount) {
      audio.playSfx(state.wrongRoutes > p.wrongRoutes ? "wrong" : "correct");
    } else if (state.wrongRoutes > p.wrongRoutes) {
      audio.playSfx("wrong");
    }

    if (!p.gameOver && state.gameOver) {
      audio.playSfx("gameOver");
    }

    if (p.phase !== "signoff" && state.phase === "signoff") {
      const ok = state.detection <= state.balance.signoffMax && state.catastrophic === 0;
      audio.playSfx(ok ? "signoffOk" : "signoffDeny");
    }

    if (p.phase !== "debrief" && state.phase === "debrief" && state.detection < 100) {
      audio.playSfx("missionPass", 0.9);
    }

    ([30, 60, 80] as const).forEach((tier) => {
      if (!p.detectionWarned[tier] && state.detectionWarned[tier]) {
        audio.playSfx("detectionWarn", 0.65);
      }
    });

    prev.current = {
      assignedCount,
      wrongRoutes: state.wrongRoutes,
      gameOver: state.gameOver,
      phase: state.phase,
      detectionWarned: { ...state.detectionWarned },
    };
  }, [audio, state]);
}
