"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { DETECTION, DISPUTES, HACK_LINES, INTRO_CHAT } from "@/lib/game/m2/data";
import { useGameSessionPersist } from "@/lib/game/sessionPersist";
import { createInitialM2State, hydrateM2State, m2Reducer, serializeM2State } from "@/lib/game/m2/reducer";
import type { DisputeId, M2GameAction, M2GameState } from "@/lib/game/m2/types";

type M2GameContextValue = {
  state: M2GameState;
  dispatch: (action: M2GameAction) => void;
};

const M2GameContext = createContext<M2GameContextValue | null>(null);

function initM2State(saved: Record<string, unknown> | null | undefined) {
  return hydrateM2State(saved) ?? createInitialM2State();
}

export function M2GameProvider({
  children,
  savedState,
}: {
  children: ReactNode;
  savedState?: Record<string, unknown> | null;
}) {
  const [state, dispatch] = useReducer(m2Reducer, savedState, initM2State);

  useGameSessionPersist({
    missionId: "m2",
    state,
    serialize: serializeM2State,
    enabled: state.phase !== "failed" && !state.gameOver,
  });

  useEffect(() => {
    if (state.phase !== "hack") return;
    if (state.hackLine >= HACK_LINES.length) {
      const t = setTimeout(() => dispatch({ type: "HACK_DONE" }), 900);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => dispatch({ type: "HACK_ADVANCE" }), 110);
    return () => clearTimeout(t);
  }, [state.phase, state.hackLine]);

  useEffect(() => {
    if (!state.hackDone || state.introScheduled) return;
    dispatch({ type: "SCHEDULE_INTRO" });
    const timers = INTRO_CHAT.map(({ delay, sender, text, tone }) =>
      setTimeout(() => dispatch({ type: "ADD_CHAT", sender, text, tone }), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [state.hackDone, state.introScheduled]);

  useEffect(() => {
    if (state.phase !== "play" || !state.hackDone || state.gameOver) return;
    const tick = setInterval(() => dispatch({ type: "TICK" }), 1000);
    const passive = setInterval(() => dispatch({ type: "PASSIVE_DETECTION" }), DETECTION.passiveIntervalMs);
    return () => {
      clearInterval(tick);
      clearInterval(passive);
    };
  }, [state.phase, state.hackDone]);

  // Synth → debrief transition is driven by M2SynthOverlay when its
  // SVG animation completes (matches the original's ~6.3s sequence).

  useEffect(() => {
    if (!state.hintCooldown) return;
    const t = setTimeout(() => dispatch({ type: "HINT_COOLDOWN_CLEAR" }), DETECTION.hintCooldownMs);
    return () => clearTimeout(t);
  }, [state.hintCooldown]);

  useEffect(() => {
    if (state.wrongShake == null) return;
    const t = setTimeout(() => dispatch({ type: "CLEAR_SHAKE" }), 400);
    return () => clearTimeout(t);
  }, [state.wrongShake]);

  // Auto-load next dispute after token secured
  useEffect(() => {
    if (state.tokens.length === 0 || state.tokens.length >= 4) return;
    const next = DISPUTES.find((d) => !state.verifyResults[d.id]);
    if (!next) return;
    const t = setTimeout(() => dispatch({ type: "LOAD_DISPUTE", id: next.id as DisputeId }), 1800);
    return () => clearTimeout(t);
  }, [state.tokens.length]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <M2GameContext.Provider value={value}>{children}</M2GameContext.Provider>;
}

export function useM2Game() {
  const ctx = useContext(M2GameContext);
  if (!ctx) throw new Error("useM2Game must be used within M2GameProvider");
  return ctx;
}
