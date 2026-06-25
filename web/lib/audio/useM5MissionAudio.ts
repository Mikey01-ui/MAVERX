"use client";

import { useEffect, useRef } from "react";
import { useOptionalGameAudio } from "@/lib/audio/GameAudioProvider";
import type { M5Phase } from "@/lib/game/m5/types";

export type M5AudioState = {
  phase: M5Phase;
  hackDone: boolean;
  commits: number;
  detection: number;
  ships: boolean | null;
  gameOver: boolean;
};

export function useM5MissionAudio(state: M5AudioState) {
  const audio = useOptionalGameAudio();
  const prev = useRef({
    commits: state.commits,
    detection: state.detection,
    phase: state.phase,
    ships: state.ships,
    gameOver: state.gameOver,
  });

  useEffect(() => {
    if (!audio) return;
    const shouldAmbient =
      state.hackDone &&
      (state.phase === "framing" || state.phase === "briefing") &&
      audio.unlocked &&
      !audio.muted;
    if (shouldAmbient) audio.startAmbient();
    else audio.stopAmbient();
  }, [audio, state.hackDone, state.phase, audio?.unlocked, audio?.muted]);

  useEffect(() => {
    if (!audio) return;
    const p = prev.current;

    if (state.commits > p.commits) audio.playSfx("correct");

    // Wrong crew answer: detection rises during briefing without a new commit
    if (state.phase === "briefing" && state.detection > p.detection && state.commits === p.commits) {
      audio.playSfx("wrong");
    }

    ([30, 60, 80] as const).forEach((tier) => {
      if (p.detection < tier && state.detection >= tier) audio.playSfx("detectionWarn", 0.65);
    });

    if (p.phase !== "debrief" && state.phase === "debrief" && state.ships) {
      audio.playSfx("missionPass", 0.9);
    }

    if (!p.gameOver && state.gameOver) {
      audio.playSfx("wrong", 0.85);
    }

    prev.current = {
      commits: state.commits,
      detection: state.detection,
      phase: state.phase,
      ships: state.ships,
      gameOver: state.gameOver,
    };
  }, [audio, state]);
}
