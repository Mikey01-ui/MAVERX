"use client";

import { useEffect, useRef } from "react";
import { useOptionalGameAudio } from "@/lib/audio/GameAudioProvider";

export type M1AudioState = {
  detection: number;
  lockedCount: number;
  errorCount: number;
  gameOver: boolean;
  active: boolean;
  success: boolean;
};

export function useM1MissionAudio(state: M1AudioState) {
  const audio = useOptionalGameAudio();
  const prev = useRef(state);

  useEffect(() => {
    if (!audio) return;
    const shouldAmbient = state.active && !state.gameOver && audio.unlocked && !audio.muted;
    if (shouldAmbient) audio.startAmbient();
    else audio.stopAmbient();
  }, [audio, state.active, state.gameOver, audio?.unlocked, audio?.muted]);

  useEffect(() => {
    if (!audio) return;
    const p = prev.current;

    if (state.lockedCount > p.lockedCount) audio.playSfx("correct");
    if (state.errorCount > p.errorCount) audio.playSfx("wrong");

    ([30, 60, 80] as const).forEach((tier) => {
      if (p.detection < tier && state.detection >= tier) audio.playSfx("detectionWarn", 0.65);
    });

    if (!p.gameOver && state.gameOver) audio.playSfx("gameOver");
    if (!p.success && state.success) audio.playSfx("missionPass", 0.9);

    prev.current = state;
  }, [audio, state]);
}
