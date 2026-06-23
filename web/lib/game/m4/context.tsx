"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { HACK_LINES, INTRO_CHAT, SUBMIT_CHAT } from "@/lib/game/m4/data";
import { useGameSessionPersist } from "@/lib/game/sessionPersist";
import { createInitialM4State, hydrateM4State, m4Reducer, serializeM4State } from "@/lib/game/m4/reducer";
import type { M4GameAction, M4GameState } from "@/lib/game/m4/types";

const M4GameContext = createContext<{ state: M4GameState; dispatch: (action: M4GameAction) => void } | null>(null);

function initM4State(saved: Record<string, unknown> | null | undefined) {
  return hydrateM4State(saved) ?? createInitialM4State();
}

export function M4GameProvider({
  children,
  savedState,
}: {
  children: ReactNode;
  savedState?: Record<string, unknown> | null;
}) {
  const [state, dispatch] = useReducer(m4Reducer, savedState, initM4State);

  useGameSessionPersist({
    missionId: "m4",
    state,
    serialize: serializeM4State,
    enabled: state.phase !== "failed",
  });

  useEffect(() => {
    if (state.phase !== "hack") return;
    if (state.hackLine >= HACK_LINES.length) {
      const t = setTimeout(() => dispatch({ type: "HACK_DONE" }), 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => dispatch({ type: "HACK_ADVANCE" }), 400);
    return () => clearTimeout(t);
  }, [state.phase, state.hackLine]);

  useEffect(() => {
    if (!state.hackDone || state.messages.length > 0) return;
    const timers = INTRO_CHAT.map(({ delay, sender, text, tone }) =>
      setTimeout(() => dispatch({ type: "ADD_CHAT", sender, text, tone }), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [state.hackDone, state.messages.length]);

  useEffect(() => {
    if (!state.submitted || state.phase === "debrief") return;
    const lines = state.wrongAttempts === 0 ? SUBMIT_CHAT.perfect : SUBMIT_CHAT.solid;
    const timers = [
      ...lines.map(({ delay, sender, text, tone }) =>
        setTimeout(() => dispatch({ type: "ADD_CHAT", sender, text, tone }), delay)
      ),
      setTimeout(() => dispatch({ type: "SHOW_DEBRIEF" }), lines[lines.length - 1].delay + 1600),
    ];
    return () => timers.forEach(clearTimeout);
  }, [state.submitted, state.phase, state.wrongAttempts]);

  useEffect(() => {
    if (state.phase !== "play") return;
    const id = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(id);
  }, [state.phase]);

  useEffect(() => {
    if (!state.hintCooldown || !state.hintCooldownUntil) return;
    const rem = state.hintCooldownUntil - Date.now();
    if (rem <= 0) {
      dispatch({ type: "HINT_COOLDOWN_CLEAR" });
      return;
    }
    const t = setTimeout(() => dispatch({ type: "HINT_COOLDOWN_CLEAR" }), rem);
    return () => clearTimeout(t);
  }, [state.hintCooldown, state.hintCooldownUntil]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <M4GameContext.Provider value={value}>{children}</M4GameContext.Provider>;
}

export function useM4Game() {
  const ctx = useContext(M4GameContext);
  if (!ctx) throw new Error("useM4Game must be used within M4GameProvider");
  return ctx;
}
