"use client";

import { useEffect, useRef } from "react";
import { useOptionalGameAudio } from "@/lib/audio/GameAudioProvider";
import type { M2Phase } from "@/lib/game/m2/types";

export type M2AudioState = {
  phase: M2Phase;
  hackDone: boolean;
  tokensLen: number;
  wrongRulings: number;
  verifyErrors: number;
  detection: number;
  gameOver: boolean;
};

export function useM2MissionAudio(state: M2AudioState) {
  const audio = useOptionalGameAudio();
  const prev = useRef({
    tokensLen: state.tokensLen,
    wrongRulings: state.wrongRulings,
    verifyErrors: state.verifyErrors,
    detection: state.detection,
    gameOver: state.gameOver,
    phase: state.phase,
  });

  useEffect(() => {
    if (!audio) return;
    const shouldAmbient = state.hackDone && state.phase === "play" && !state.gameOver && audio.unlocked && !audio.muted;
    if (shouldAmbient) audio.startAmbient();
    else audio.stopAmbient();
  }, [audio, state.hackDone, state.phase, state.gameOver, audio?.unlocked, audio?.muted]);

  useEffect(() => {
    if (!audio) return;
    const p = prev.current;

    if (state.tokensLen > p.tokensLen) audio.playSfx("correct");
    if (state.wrongRulings > p.wrongRulings) audio.playSfx("wrong");
    if (state.verifyErrors > p.verifyErrors) audio.playSfx("wrong");

    ([30, 60, 80] as const).forEach((tier) => {
      if (p.detection < tier && state.detection >= tier) audio.playSfx("detectionWarn", 0.65);
    });

    if (!p.gameOver && state.gameOver) audio.playSfx("gameOver");
    if (p.phase !== "debrief" && state.phase === "debrief" && !state.gameOver) audio.playSfx("missionPass", 0.9);

    prev.current = {
      tokensLen: state.tokensLen,
      wrongRulings: state.wrongRulings,
      verifyErrors: state.verifyErrors,
      detection: state.detection,
      gameOver: state.gameOver,
      phase: state.phase,
    };
  }, [audio, state]);
}
