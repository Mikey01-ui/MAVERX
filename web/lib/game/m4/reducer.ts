import {
  DETECTION,
  FILES,
  HINT_COOLDOWN_SEC,
  STEPS,
  correctStepForFile,
  hintForStep,
  isStepAvailable,
  isStepSatisfied,
  resetCandidateCache,
  stepIndex,
  wrongHandoffDetection,
  wrongStepMessage,
} from "@/lib/game/m4/data";
import { restoreGameState } from "@/lib/game/sessionPersist";
import type { ChatMessage, M4GameAction, M4GameState, M4WrongAttempt } from "@/lib/game/m4/types";

function nowTs() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}

function pushChat(state: M4GameState, sender: string, text: string, tone: M4GameState["messages"][0]["tone"] = "bm-d"): ChatMessage[] {
  return [...state.messages, { id: `m4-${Date.now()}`, sender, text, tone, ts: nowTs() }];
}

function addDetection(state: M4GameState, amount: number): M4GameState {
  if (amount <= 0 || state.gameOver) return state;
  const next = Math.min(100, state.detection + amount);
  const warned = { ...state.detectionWarned };
  let messages = state.messages;

  ([30, 60, 80] as const).forEach((t) => {
    if (next >= t && !warned[t]) {
      warned[t] = true;
      const copy =
        t === 30
          ? "Auditors are picking up handoff noise. Match Expects to the rail headers."
          : t === 60
            ? "Detection climbing — wrong gates are lighting up the onboarding audit."
            : "Critical exposure. One more bad link and they call it a random dump.";
      messages = pushChat({ ...state, messages }, "Nova", copy, "bm-err");
    }
  });

  if (next >= 100) {
    return {
      ...state,
      detection: 100,
      detectionWarned: warned,
      gameOver: true,
      phase: "failed",
      stepBanner: "Detection ceiling exceeded — handoff audit failed.",
      messages: pushChat(
        { ...state, messages },
        "Nova",
        "<strong>You're detected.</strong> MegaCorp flagged the custody story — map exposure hit 100%.",
        "bm-err"
      ),
    };
  }

  return { ...state, detection: next, detectionWarned: warned, messages };
}

export function createInitialM4State(): M4GameState {
  return {
    phase: "hack",
    hackLine: 0,
    hackDone: false,
    picks: {},
    selectedStepId: null,
    selectedFileId: null,
    detection: 0,
    detectionWarned: { 30: false, 60: false, 80: false },
    gameOver: false,
    wrongAttempts: 0,
    wrongAttemptLog: [],
    hintsUsed: 0,
    hintCooldown: false,
    hintCooldownUntil: null,
    submitted: false,
    timerSec: 0,
    messages: [],
    stepBanner: "Case-flow reconstruction — link each leak file to the correct onboarding gate.",
  };
}

function migrateV1State(raw: Record<string, unknown>): M4GameState {
  const base = createInitialM4State();
  const confidence = typeof raw.confidence === "number" ? raw.confidence : 100;
  return {
    ...base,
    ...raw,
    detection: Math.max(0, Math.min(100, 100 - confidence)),
    detectionWarned: (raw.detectionWarned as M4GameState["detectionWarned"]) ?? base.detectionWarned,
    gameOver: Boolean(raw.gameOver) || (typeof raw.confidence === "number" && raw.confidence <= 0),
    phase: raw.phase === "debrief" ? "debrief" : raw.gameOver || (typeof raw.confidence === "number" && raw.confidence <= 0) ? "failed" : (raw.phase as M4GameState["phase"]) ?? "play",
  } as M4GameState;
}

export function m4Reducer(state: M4GameState, action: M4GameAction): M4GameState {
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
      return { ...state, phase: "play", hackDone: true };
    case "SELECT_STEP": {
      if (state.gameOver || state.submitted) return state;
      const idx = stepIndex(action.stepId);
      if (idx < 0 || !isStepAvailable(idx, state.picks)) {
        return { ...state, messages: pushChat(state, "Nova", "Complete the previous steps first — the flow must proceed in order.", "bm-err") };
      }
      const step = STEPS[idx];
      return {
        ...state,
        selectedStepId: action.stepId,
        selectedFileId: null,
        stepBanner: `${step.title} — select the matching dataset from the rail`,
      };
    }
    case "ASSIGN_FILE":
    case "ASSIGN_FILE_TO_STEP": {
      if (state.gameOver) return state;
      const targetStepId = action.type === "ASSIGN_FILE_TO_STEP" ? action.stepId : state.selectedStepId;
      if (!targetStepId || state.submitted) return state;
      const stepIdx = stepIndex(targetStepId);
      if (!isStepAvailable(stepIdx, state.picks)) return state;
      const correct = correctStepForFile(action.fileId);
      const step = STEPS[stepIdx];
      if (!correct || correct !== targetStepId) {
        const hit = wrongHandoffDetection(action.fileId);
        const file = FILES.find((f) => f.id === action.fileId);
        const wrongStep = STEPS.find((s) => s.id === targetStepId);
        const correctStep = STEPS.find((s) => s.id === correct);
        const reason = wrongStepMessage(action.fileId, targetStepId);
        const attempt: M4WrongAttempt = {
          fileId: action.fileId,
          file: file?.name ?? action.fileId,
          wrongGateId: targetStepId,
          wrongGateTitle: wrongStep?.title ?? targetStepId,
          correctGateId: correct ?? "",
          correctGateTitle: correctStep?.title ?? "the correct gate",
          reason,
        };
        let next: M4GameState = {
          ...state,
          wrongAttempts: state.wrongAttempts + 1,
          wrongAttemptLog: [...(state.wrongAttemptLog ?? []), attempt],
          messages: pushChat(state, "Nova", `<strong>Wrong link.</strong> ${reason} <em>(+${hit}% detection)</em>`, "bm-err"),
        };
        next = addDetection(next, hit);
        return next;
      }
      const picks = { ...state.picks };
      Object.keys(picks).forEach((k) => {
        if (picks[k] === targetStepId) delete picks[k];
      });
      picks[action.fileId] = targetStepId;
      const linked = Object.keys(picks).length;
      return {
        ...state,
        picks,
        selectedStepId: null,
        selectedFileId: null,
        messages: pushChat(state, "Voss", `Linked ${FILES.find((f) => f.id === action.fileId)?.name} → ${step.title}.`, "bm-ok"),
        stepBanner: linked >= 8 ? "All gates linked. Finalize the process map." : "Select the next available gate on the chain.",
      };
    }
    case "REQUEST_HINT": {
      if (state.gameOver || state.submitted || !state.selectedStepId) {
        return { ...state, messages: pushChat(state, "Voss", "Click a <strong>gate icon</strong> on the flow first.", "bm-err") };
      }
      if (state.hintCooldown) {
        return { ...state, messages: pushChat(state, "Nova", "Give me a moment — still cross-checking the last hint.", "bm-d") };
      }
      if (isStepSatisfied(state.selectedStepId, state.picks)) {
        return { ...state, messages: pushChat(state, "Voss", "That gate is already linked — pick the <strong>next available</strong> icon.", "bm-err") };
      }
      const step = STEPS.find((s) => s.id === state.selectedStepId);
      let next: M4GameState = {
        ...state,
        hintsUsed: state.hintsUsed + 1,
        hintCooldown: true,
        hintCooldownUntil: Date.now() + HINT_COOLDOWN_SEC * 1000,
        messages: pushChat(
          state,
          "Nova",
          `${hintForStep(state.selectedStepId)} <em>(+${DETECTION.hint}% detection)</em>`,
          "bm-d"
        ),
        stepBanner: step ? `${step.title} — hint logged; match headers to Expects.` : state.stepBanner,
      };
      return addDetection(next, DETECTION.hint);
    }
    case "HINT_COOLDOWN_CLEAR":
      return { ...state, hintCooldown: false, hintCooldownUntil: null };
    case "UNASSIGN_FILE": {
      if (state.gameOver || state.submitted || !state.picks[action.fileId]) return state;
      const picks = { ...state.picks };
      delete picks[action.fileId];
      resetCandidateCache();
      const f = FILES.find((x) => x.id === action.fileId);
      return {
        ...state,
        picks,
        messages: pushChat(state, "Voss", `Returned <strong>${f?.name ?? "file"}</strong> to the pool — re-link when ready.`, "bm-d"),
        stepBanner: "Select the gate and link the correct dataset.",
      };
    }
    case "SUBMIT": {
      if (state.gameOver || Object.keys(state.picks).length < 8 || state.submitted) return state;
      return { ...state, submitted: true };
    }
    case "SHOW_DEBRIEF":
      return { ...state, phase: "debrief" };
    case "RESET_MISSION":
      return createInitialM4State();
    case "ADD_CHAT":
      return { ...state, messages: pushChat(state, action.sender, action.text, action.tone ?? "bm-d") };
    default:
      return state;
  }
}

export function serializeM4State(state: M4GameState): Record<string, unknown> {
  return { version: 2, ...state };
}

export function hydrateM4State(raw: Record<string, unknown> | null | undefined): M4GameState | null {
  if (!raw) return null;
  if (raw.version === 1 || typeof raw.confidence === "number") {
    const migrated = migrateV1State(raw);
    if (migrated.phase === "debrief") return migrated;
    return migrated;
  }
  const restored = restoreGameState(raw, 2, createInitialM4State, ["failed"]);
  if (!restored) return null;
  const withLog = Array.isArray(restored.wrongAttemptLog) ? restored : { ...restored, wrongAttemptLog: [] as M4GameState["wrongAttemptLog"] };
  if (typeof withLog.hintCooldownUntil === "number" && withLog.hintCooldownUntil <= Date.now()) {
    return { ...withLog, hintCooldown: false, hintCooldownUntil: null };
  }
  if (typeof withLog.hintCooldownUntil === "number") {
    return { ...withLog, hintCooldown: true };
  }
  return withLog;
}
