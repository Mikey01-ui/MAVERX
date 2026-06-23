import {
  CHANNEL_LABELS,
  DATASETS,
  DETECTION,
  HINT_COOLDOWN_SEC,
  hintForDataset,
  SIGNOFF_DETECTION_MAX,
  routeDetectionPenalty,
  wrongExplain,
} from "@/lib/game/m3/data";
import { restoreGameState } from "@/lib/game/sessionPersist";
import type { Channel, ChatMessage, ChatSender, ChatTone, M3GameAction, M3GameState, M3WrongAttempt } from "@/lib/game/m3/types";

function nowTs() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}

function msgId() {
  return `m3-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function pushChat(state: M3GameState, sender: ChatSender, text: string, tone: ChatTone = "bm-d"): ChatMessage[] {
  return [...state.messages, { id: msgId(), sender, text, tone, ts: nowTs() }];
}

function addDetection(state: M3GameState, amount: number): M3GameState {
  if (amount <= 0 || state.gameOver) return state;
  const next = Math.min(100, state.detection + amount);
  const warned = { ...state.detectionWarned };
  let messages = state.messages;

  ([30, 60, 80] as const).forEach((t) => {
    if (next >= t && !warned[t]) {
      warned[t] = true;
      const copy =
        t === 30
          ? "Marshall's mirror is picking up routing noise. Stay precise."
          : t === 60
            ? "Detection climbing — wrong channels are lighting up the queue."
            : "Critical exposure. One more slip and we lose the feed.";
      messages = pushChat({ ...state, messages }, "Voss", copy, "bm-err");
    }
  });

  if (next >= 100) {
    return {
      ...state,
      detection: 100,
      detectionWarned: warned,
      gameOver: true,
      phase: "failed",
      stepBanner: "Detection ceiling exceeded — mirror dropped.",
      messages: pushChat(
        { ...state, messages },
        "Voss",
        "They saw us. MegaCorp closed the breach — feed is dead.",
        "bm-err",
      ),
    };
  }

  return { ...state, detection: next, detectionWarned: warned, messages };
}

export function serializeM3State(state: M3GameState): Record<string, unknown> {
  return { version: 2, ...state };
}

export function hydrateM3State(raw: Record<string, unknown> | null | undefined): M3GameState | null {
  const restored = restoreGameState(raw, 2, createInitialM3State, ["failed"]);
  if (!restored) return null;
  const withLog =
    Array.isArray(restored.wrongAttemptLog) ? restored : { ...restored, wrongAttemptLog: [] as M3GameState["wrongAttemptLog"] };
  if (typeof withLog.hintCooldownUntil === "number" && withLog.hintCooldownUntil <= Date.now()) {
    return { ...withLog, hintCooldown: false, hintCooldownUntil: null };
  }
  if (typeof withLog.hintCooldownUntil === "number") {
    return { ...withLog, hintCooldown: true };
  }
  return withLog;
}

export function createInitialM3State(): M3GameState {
  return {
    phase: "hack",
    hackLine: 0,
    hackDone: false,
    detection: 0,
    detectionWarned: { 30: false, 60: false, 80: false },
    gameOver: false,
    assigned: {},
    selectedId: null,
    timerSec: 0,
    wrongRoutes: 0,
    wrongAttemptLog: [],
    catastrophic: 0,
    hintsUsed: 0,
    hintCooldown: false,
    hintCooldownUntil: null,
    signOffStarted: false,
    messages: [],
    stepBanner: "Establishing secure connection…",
    vaultOpen: false,
  };
}

export { getDetectionClass } from "@/lib/game/m3/detectionMeter";

export function m3Reducer(state: M3GameState, action: M3GameAction): M3GameState {
  switch (action.type) {
    case "TICK": {
      if (state.phase !== "play" || state.gameOver) return state;
      let next = { ...state, timerSec: state.timerSec + 1 };
      next = addDetection(next, DETECTION.passivePerSec);
      return next;
    }
    case "HACK_ADVANCE":
      return { ...state, hackLine: state.hackLine + 1 };
    case "HACK_DONE":
      return {
        ...state,
        phase: "desktop",
        hackDone: true,
        stepBanner: "Marshall's desktop — double-click Data Vault to unlock the disclosure queue.",
      };
    case "OPEN_VAULT":
      return { ...state, vaultOpen: true };
    case "CLOSE_VAULT":
      return { ...state, vaultOpen: false };
    case "VAULT_UNLOCKED":
      return {
        ...state,
        phase: "play",
        vaultOpen: false,
        stepBanner: "Pick a file. Route it to the channel that matches audience + harm profile.",
        messages: pushChat(state, "Nova", "Vault unsealed. Route each file by audience and harm profile before I sign off.", "bm-d"),
      };
    case "SELECT_DATASET": {
      const ds = DATASETS.find((d) => d.id === action.id);
      if (!ds || state.gameOver) return state;
      const locked = !!state.assigned[action.id];
      return {
        ...state,
        selectedId: action.id,
        stepBanner: locked
          ? `Routed to ${CHANNEL_LABELS[state.assigned[action.id]!]}. Select another file.`
          : "Choose PUBLIC (press), OFFICIAL (regulators/counsel), or NO RELEASE (vault).",
      };
    }
    case "ASSIGN_CHANNEL": {
      const id = state.selectedId;
      if (!id || state.assigned[id] || !state.hackDone || state.gameOver) return state;
      const ds = DATASETS.find((d) => d.id === id);
      if (!ds) return state;
      const { amount, catastrophic } = routeDetectionPenalty(ds.correct, action.channel);
      const isCorrect = action.channel === ds.correct;
      let next: M3GameState = { ...state };
      if (isCorrect) {
        next.assigned = { ...state.assigned, [id]: action.channel };
        next.messages = pushChat(next, "Voss", `Routed: ${ds.file} → ${CHANNEL_LABELS[action.channel]}.`, "bm-ok");
      } else {
        const reason = ds.wrongRationale[action.channel] ?? `Correct channel: ${CHANNEL_LABELS[ds.correct]}.`;
        const attempt: M3WrongAttempt = {
          fileId: id,
          file: ds.file,
          choice: action.channel,
          correct: ds.correct,
          reason,
        };
        next.wrongRoutes = state.wrongRoutes + 1;
        next.wrongAttemptLog = [...state.wrongAttemptLog, attempt];
        next.messages = pushChat(next, "Voss", `${wrongExplain(ds, action.channel)} Choose a different release channel.`, "bm-err");
      }
      if (amount > 0) {
        next = addDetection(next, amount);
        if (catastrophic && !next.gameOver) next = { ...next, catastrophic: state.catastrophic + 1 };
      }
      if (!next.gameOver) {
        const n = Object.keys(next.assigned).length;
        if (n >= 10) next.stepBanner = "All files routed. Request Nova sign-off.";
      }
      return next;
    }
    case "REQUEST_HINT": {
      if (state.gameOver) return state;
      if (state.hintCooldown || !state.selectedId || state.assigned[state.selectedId]) {
        return { ...state, messages: pushChat(state, "Voss", "Select a file you have not routed yet.", "bm-err") };
      }
      const ds = DATASETS.find((d) => d.id === state.selectedId);
      if (!ds) return state;
      let next: M3GameState = {
        ...state,
        hintsUsed: state.hintsUsed + 1,
        hintCooldown: true,
        hintCooldownUntil: Date.now() + HINT_COOLDOWN_SEC * 1000,
        messages: pushChat(state, "Voss", `Hint: ${hintForDataset(ds)}`, "bm-d"),
      };
      return addDetection(next, DETECTION.hint);
    }
    case "HINT_COOLDOWN_CLEAR":
      return { ...state, hintCooldown: false, hintCooldownUntil: null };
    case "REQUEST_SIGNOFF": {
      if (Object.keys(state.assigned).length < 10 || state.signOffStarted || state.gameOver || state.detection >= 100) {
        return state;
      }
      const signoffOk = state.detection <= SIGNOFF_DETECTION_MAX && state.catastrophic === 0;
      return {
        ...state,
        signOffStarted: true,
        phase: "signoff",
        messages: pushChat(
          state,
          "Nova",
          signoffOk
            ? "Distribution map reviewed. I sign off — proceed to Mission 4."
            : "Detection is too high. Nova withheld sign-off — review your routing choices.",
          signoffOk ? "bm-win" : "bm-err",
        ),
      };
    }
    case "SIGNOFF_DONE":
      return { ...state, phase: "debrief" };
    case "RESET_MISSION":
      return createInitialM3State();
    case "ADD_CHAT":
      return { ...state, messages: pushChat(state, action.sender, action.text, action.tone ?? "bm-d") };
    default:
      return state;
  }
}
