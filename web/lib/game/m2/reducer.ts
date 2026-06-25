import {
  DECOY_MSG,
  DETECTION,
  DISPUTES,
  DISPUTE_ORDER,
  FILES,
  TOKEN_LEADS,
  VERIFY,
} from "@/lib/game/m2/data";
import { restoreGameState } from "@/lib/game/sessionPersist";
import type {
  ChatMessage,
  ChatSender,
  ChatTone,
  DisputeId,
  M2GameAction,
  M2GameState,
} from "@/lib/game/m2/types";

function nowTs() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}

function msgId() {
  return `m2-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function pushChat(
  state: M2GameState,
  sender: ChatSender,
  text: string,
  tone: ChatTone = "bm-d"
): ChatMessage[] {
  return [...state.messages, { id: msgId(), sender, text, tone, ts: nowTs() }];
}

function initLeadMaps() {
  const leadStatus: Record<string, string> = {};
  const leadStatusText: Record<string, string> = {};
  Object.values(TOKEN_LEADS).forEach((t, i) => {
    leadStatus[t.leadId] = i === 0 ? "n-next" : "n-dimmed";
    leadStatusText[t.leadId] = i === 0 ? "OPEN" : "PENDING";
  });
  return { leadStatus, leadStatusText };
}

export function createInitialM2State(): M2GameState {
  const { leadStatus, leadStatusText } = initLeadMaps();
  return {
    phase: "hack",
    hackLine: 0,
    hackDone: false,
    results: {},
    verifyResults: {},
    tokens: [],
    wrongRulings: 0,
    verifyErrors: 0,
    hintsUsed: 0,
    score: 1000,
    timerSec: 0,
    detection: 0,
    activeDispute: null,
    verifyDispute: null,
    vpSelections: {},
    verifyOpen: false,
    openWindows: [],
    selectedFile: null,
    highlightDispute: null,
    stepBanner: "Establishing governance mirror...",
    ebStep: "DISPUTE 1 OF 4",
    tokenCount: "0 / 4 TOKENS",
    leadStatus,
    leadStatusText,
    messages: [],
    hintCooldown: false,
    gameOver: false,
    introScheduled: false,
    wrongShake: null,
    everOpened: [],
    verifyFeedback: null,
  };
}

function addDetection(state: M2GameState, amount: number): M2GameState {
  if (amount <= 0 || state.gameOver) return state;
  const detection = Math.min(100, state.detection + amount);
  if (detection >= 100) {
    return {
      ...state,
      detection: 100,
      gameOver: true,
      phase: "failed",
      stepBanner: "Detection ceiling exceeded — tribunal session terminated.",
      messages: pushChat(
        state,
        "Atlas",
        "They traced the governance mirror. Detection hit 100% — the Master Key compile is dead.",
        "bm-err",
      ),
    };
  }
  return { ...state, detection };
}

function disputeById(id: DisputeId) {
  return DISPUTES.find((d) => d.id === id)!;
}

function lockToken(state: M2GameState, disputeId: DisputeId): M2GameState {
  const d = disputeById(disputeId);
  const tokens = [...state.tokens, d.token];
  const verifyResults = { ...state.verifyResults, [disputeId]: true as const };
  const meta = TOKEN_LEADS[d.token];
  let next: M2GameState = {
    ...state,
    tokens,
    verifyResults,
    verifyOpen: false,
    verifyDispute: null,
    vpSelections: {},
    highlightDispute: null,
    activeDispute: disputeId,
    leadStatus: { ...state.leadStatus, [meta.leadId]: "n-locked" },
    leadStatusText: { ...state.leadStatusText, [meta.leadId]: "TOKEN ✓" },
    tokenCount: `${tokens.length} / 4 TOKENS`,
    score: state.score + 150,
    messages: state.messages,
  };

  if (tokens.length >= 4) {
    return {
      ...next,
      ebStep: "ALL 4 TOKENS SECURED ✓",
      stepBanner: "All four tokens secured. Compile the Master Key.",
      messages: pushChat(next, "Atlas", "All four tokens extracted. Compile the Master Key.", "bm-win"),
    };
  }

  const nextDispute = DISPUTE_ORDER.find((id) => !verifyResults[id]);
  if (nextDispute) {
    const nextMeta = TOKEN_LEADS[disputeById(nextDispute).token];
    next = {
      ...next,
      ebStep: `DISPUTE ${tokens.length + 1} OF 4`,
      leadStatus: { ...next.leadStatus, [nextMeta.leadId]: "n-next" },
      leadStatusText: { ...next.leadStatusText, [nextMeta.leadId]: "OPEN" },
      messages: pushChat(next, "Atlas", `Token secured. Next: ${disputeById(nextDispute).caseId}.`, "bm-win"),
      activeDispute: nextDispute,
    };
  }
  return next;
}

export function getDetectionClass(det: number) {
  if (det < 30) return "det-green";
  if (det < 60) return "det-amber";
  return "det-red";
}

export function getDetectionLabel(det: number) {
  if (det < 30) return "DARK";
  if (det < 60) return "SCANNING";
  if (det < 80) return "ALERT";
  return "CRITICAL";
}

export function m2Reducer(state: M2GameState, action: M2GameAction): M2GameState {
  switch (action.type) {
    case "TICK":
      if (state.phase !== "play" || !state.hackDone) return { ...state, timerSec: state.timerSec + 1 };
      return { ...state, timerSec: state.timerSec + 1 };
    case "HACK_ADVANCE":
      return { ...state, hackLine: state.hackLine + 1 };
    case "HACK_DONE": {
      const { leadStatus, leadStatusText } = initLeadMaps();
      const base = { ...state, phase: "play" as const, hackDone: true, leadStatus, leadStatusText };
      return {
        ...base,
        stepBanner: "Open the Governance Tribunal — read the active dispute, inspect the evidence file, then rule on ownership",
        openWindows: ["win-tribunal"],
        everOpened: ["win-tribunal"],
        activeDispute: 1,
        highlightDispute: 1,
        messages: pushChat(base, "Atlas", disputeById(1).intro, "bm-d"),
      };
    }
    case "SCHEDULE_INTRO":
      if (state.introScheduled) return state;
      return { ...state, introScheduled: true };
    case "ADD_CHAT":
      return { ...state, messages: pushChat(state, action.sender, action.text, action.tone ?? "bm-d") };
    case "LOAD_DISPUTE": {
      const d = disputeById(action.id);
      if (state.verifyResults[action.id]) return state;
      return {
        ...state,
        activeDispute: action.id,
        highlightDispute: action.id,
        stepBanner: `Case ${d.caseId} — Step 1: Rule on ownership · Step 2: Verify with evidence`,
        openWindows: state.openWindows.includes("win-tribunal") ? state.openWindows : [...state.openWindows, "win-tribunal"],
        messages: state.results[action.id] ? state.messages : pushChat(state, "Atlas", d.intro, "bm-d"),
      };
    }
    case "RULE": {
      const d = disputeById(action.disputeId);
      if (state.results[action.disputeId]) return state;
      if (action.chosenIdx === d.correctIdx) {
        let next: M2GameState = {
          ...state,
          results: { ...state.results, [action.disputeId]: "correct" },
          score: state.score + 100,
          messages: pushChat(state, "Atlas", `${d.correct} Now answer the verification questions.`, "bm-win"),
        };
        return m2Reducer(next, { type: "OPEN_VERIFY", disputeId: action.disputeId });
      }
      return {
        ...addDetection({ ...state, wrongRulings: state.wrongRulings + 1, score: Math.max(0, state.score - 200), wrongShake: action.chosenIdx }, DETECTION.wrongRuling),
        messages: pushChat(state, "Atlas", d.wrong, "bm-err"),
      };
    }
    case "OPEN_VERIFY": {
      const vd = VERIFY[action.disputeId];
      if (!vd || state.verifyResults[action.disputeId]) return state;
      return {
        ...state,
        verifyDispute: action.disputeId,
        vpSelections: {},
        verifyOpen: true,
        stepBanner: "Step 2: Answer verification questions — use the Inspector to find answers",
        messages: pushChat(state, "Atlas", "Ruling confirmed. Answer the verification questions — the Inspector has everything.", "bm-d"),
      };
    }
    case "SELECT_CHIP": {
      return { ...state, vpSelections: { ...state.vpSelections, [action.qi]: action.ci } };
    }
    case "CONFIRM_VERIFY": {
      if (!state.verifyDispute) return state;
      const vd = VERIFY[state.verifyDispute];
      let errors = 0;
      const correct: Record<number, boolean> = {};
      vd.questions.forEach((q, qi) => {
        correct[qi] = state.vpSelections[qi] === q.ans;
        if (!correct[qi]) errors++;
      });
      const feedback = { selections: { ...state.vpSelections }, correct };
      if (errors > 0) {
        return {
          ...addDetection(
            { ...state, verifyErrors: state.verifyErrors + errors, score: Math.max(0, state.score - errors * 75), vpSelections: {}, verifyFeedback: feedback },
            errors * DETECTION.verifyFailPer
          ),
          messages: pushChat(
            state,
            "Atlas",
            `${errors} answer${errors > 1 ? "s are" : " is"} wrong — I've flagged ${errors > 1 ? "them" : "it"}. The evidence is in the Inspector. Read it again and retry.`,
            "bm-err"
          ),
        };
      }
      return { ...lockToken(state, state.verifyDispute), verifyFeedback: null };
    }
    case "CLEAR_VERIFY_FEEDBACK":
      return { ...state, verifyFeedback: null };
    case "TOGGLE_VERIFY":
      return { ...state, verifyOpen: !state.verifyOpen };
    case "OPEN_WINDOW":
      return {
        ...state,
        openWindows: state.openWindows.includes(action.windowId) ? state.openWindows : [...state.openWindows, action.windowId],
        everOpened: state.everOpened.includes(action.windowId) ? state.everOpened : [...state.everOpened, action.windowId],
      };
    case "CLOSE_WINDOW":
      return { ...state, openWindows: state.openWindows.filter((w) => w !== action.windowId) };
    case "INSPECT_FILE":
      return {
        ...state,
        selectedFile: action.fileKey,
        openWindows: state.openWindows.includes("win-inspector") ? state.openWindows : [...state.openWindows, "win-inspector"],
        everOpened: state.everOpened.includes("win-inspector") ? state.everOpened : [...state.everOpened, "win-inspector"],
      };
    case "DECOY_PERSONAL": {
      const msg = DECOY_MSG[action.key] ?? "Nothing relevant here.";
      return { ...state, messages: pushChat(state, "Atlas", msg, "bm-d") };
    }
    case "REQUEST_HINT": {
      const id = state.verifyDispute ?? state.activeDispute;
      if (!id || state.hintCooldown) return state;
      const d = disputeById(id);
      if (state.verifyResults[id]) return state;
      const file = FILES[d.fileKey];
      const bumped = { ...state, hintsUsed: state.hintsUsed + 1, score: Math.max(0, state.score - 100), hintCooldown: true };
      return {
        ...addDetection(bumped, DETECTION.hint),
        messages: pushChat(bumped, "Atlas", `[HINT] ${file.hint}`, "bm-h"),
      };
    }
    case "HINT_COOLDOWN_CLEAR":
      return { ...state, hintCooldown: false };
    case "START_SYNTH":
      if (state.tokens.length < 4) return state;
      return { ...state, phase: "synth" };
    case "SYNTH_DONE":
      return { ...state, phase: "debrief" };
    case "CLEAR_SHAKE":
      return { ...state, wrongShake: null };
    case "PASSIVE_DETECTION":
      if (state.phase !== "play" || !state.hackDone || state.gameOver) return state;
      return addDetection(state, DETECTION.passivePerTick);
    case "RESET_MISSION":
      return createInitialM2State();
    default:
      return state;
  }
}

export function serializeM2State(state: M2GameState): Record<string, unknown> {
  return { version: 2, ...state };
}

export function hydrateM2State(raw: Record<string, unknown> | null | undefined): M2GameState | null {
  const restored = restoreGameState(raw, 2, createInitialM2State, ["failed"]);
  if (!restored) return null;
  const gameOver = Boolean(raw?.gameOver) || restored.phase === "failed";
  return {
    ...restored,
    gameOver,
    phase: gameOver ? "failed" : restored.phase,
  };
}
