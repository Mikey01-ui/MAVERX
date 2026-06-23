"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { HACK_LINES, HINT_COOLDOWN_SEC, INTRO_CHAT } from "@/lib/game/m3/data";
import { useGameSessionPersist } from "@/lib/game/sessionPersist";
import { createInitialM3State, hydrateM3State, m3Reducer, serializeM3State } from "@/lib/game/m3/reducer";
import type { M3GameAction, M3GameState } from "@/lib/game/m3/types";

type M3GameContextValue = { state: M3GameState; dispatch: (action: M3GameAction) => void };

const M3GameContext = createContext<M3GameContextValue | null>(null);

function initM3State(saved: Record<string, unknown> | null | undefined) {
  return hydrateM3State(saved) ?? createInitialM3State();
}

export function M3GameProvider({
  children,
  savedState,
}: {
  children: ReactNode;
  savedState?: Record<string, unknown> | null;
}) {
  const [state, dispatch] = useReducer(m3Reducer, savedState, initM3State);

  const persistEnabled = state.phase !== "failed";

  useGameSessionPersist({
    missionId: "m3",
    state,
    serialize: serializeM3State,
    enabled: persistEnabled,
  });

  useEffect(() => {
    if (state.phase !== "hack") return;
    if (state.hackLine >= HACK_LINES.length) {
      const t = setTimeout(() => dispatch({ type: "HACK_DONE" }), 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => dispatch({ type: "HACK_ADVANCE" }), 400);
    return () => clearTimeout(t);
  }, [state.phase, state.hackLine]);

  useEffect(() => {
    if (state.phase !== "desktop") return;
    if (state.messages.length > 0) return;
    const t = setTimeout(
      () =>
        dispatch({
          type: "ADD_CHAT",
          sender: "Nova",
          text: "Marshall left a vault on his mirror. Double-click Data Vault and enter the breach code.",
          tone: "bm-d",
        }),
      600
    );
    return () => clearTimeout(t);
  }, [state.phase, state.messages.length]);

  useEffect(() => {
    if (state.phase !== "play") return;
    if (state.messages.some((m) => m.sender === "Voss")) return;
    const timers = INTRO_CHAT.map(({ delay, sender, text, tone }) =>
      setTimeout(() => dispatch({ type: "ADD_CHAT", sender, text, tone }), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [state.phase, state.messages]);

  useEffect(() => {
    if (state.phase !== "play" && state.phase !== "signoff") return;
    const id = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(id);
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== "signoff") return;
    const t = setTimeout(() => dispatch({ type: "SIGNOFF_DONE" }), 2800);
    return () => clearTimeout(t);
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
  return <M3GameContext.Provider value={value}>{children}</M3GameContext.Provider>;
}

export function useM3Game() {
  const ctx = useContext(M3GameContext);
  if (!ctx) throw new Error("useM3Game must be used within M3GameProvider");
  return ctx;
}
