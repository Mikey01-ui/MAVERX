import { CREW_ORDER, CREW_QUESTIONS, ECHO_FRAME, ECHO_VIZ, M5_REQUIRED_COMMITS } from "@/lib/game/m5/data";
import { restoreGameState } from "@/lib/game/sessionPersist";
import type { ChatMessage, CrewId, M5GameAction, M5GameState } from "@/lib/game/m5/types";

function nowTs() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}

function pushChat(state: M5GameState, sender: string, text: string, tone: M5GameState["messages"][0]["tone"] = "bm-d"): ChatMessage[] {
  return [...state.messages, { id: `m5-${Date.now()}-${Math.random()}`, sender, text, tone, ts: nowTs() }];
}

function addDetection(state: M5GameState, amount: number): M5GameState {
  if (amount <= 0 || state.gameOver) return state;
  const detection = Math.min(100, state.detection + amount);
  if (detection >= 100) {
    return {
      ...state,
      detection: 100,
      gameOver: true,
      failReason: "detection",
      phase: "failed",
      stepBanner: "Detection ceiling exceeded — briefing terminated.",
      messages: pushChat(state, "Voss", "They traced the brief. OMNI locked the vault — you're burned.", "bm-err"),
    };
  }
  return { ...state, detection };
}

function initialCrewState(): M5GameState["crewState"] {
  return {
    zex: { status: "pending", retried: false, selected: null },
    atlas: { status: "pending", retried: false, selected: null },
    nova: { status: "pending", retried: false, selected: null },
    kade: { status: "pending", retried: false, selected: null },
  };
}

export function createInitialM5State(): M5GameState {
  return {
    phase: "hack",
    hackLine: 0,
    hackDone: false,
    frameChoices: {},
    framingLocked: false,
    crewState: initialCrewState(),
    activeCrew: null,
    commits: 0,
    detection: 0,
    score: 500,
    timerSec: 0,
    messages: [],
    stepBanner: "Choose framing and visualisation for each evidence card with ECHO.",
    ships: null,
    gameOver: false,
    failReason: null,
  };
}

function finishBriefing(
  state: M5GameState,
  commits: number,
  crewState: M5GameState["crewState"],
  messages: ChatMessage[],
  score: number,
): M5GameState {
  const ships = commits >= M5_REQUIRED_COMMITS;
  const vossLine = ships
    ? "Four people who don't agree on anything just agreed on you. That's not nothing. Move."
    : "You built something real across four operations. The room didn't commit — but the work was real.";
  const withVoss = [
    ...messages,
    { id: `m5-${Date.now()}-vote`, sender: "Voss", text: vossLine, tone: "bm-win" as const, ts: nowTs() },
  ];
  if (!ships) {
    return {
      ...state,
      commits,
      score,
      crewState,
      activeCrew: null,
      ships: false,
      gameOver: true,
      failReason: "vote",
      phase: "failed",
      stepBanner: "Mission failed — room did not commit.",
      messages: withVoss,
    };
  }
  return {
    ...state,
    commits,
    score,
    crewState,
    activeCrew: null,
    ships: true,
    phase: "vote",
    messages: withVoss,
  };
}

function framingComplete(choices: M5GameState["frameChoices"]) {
  for (let i = 1; i <= 4; i++) {
    const c = choices[i];
    if (!c?.frame || !c?.viz) return false;
  }
  return true;
}

export function m5Reducer(state: M5GameState, action: M5GameAction): M5GameState {
  switch (action.type) {
    case "TICK":
      if (state.phase === "hack" || state.phase === "debrief" || state.phase === "vote" || state.gameOver) return state;
      return { ...state, timerSec: state.timerSec + 1 };
    case "HACK_ADVANCE":
      return { ...state, hackLine: state.hackLine + 1 };
    case "HACK_DONE":
      return { ...state, phase: "framing", hackDone: true };
    case "SELECT_FRAME": {
      if (state.framingLocked || state.gameOver) return state;
      const choices = { ...state.frameChoices, [action.cardId]: { ...state.frameChoices[action.cardId], frame: action.frame } };
      return { ...state, frameChoices: choices };
    }
    case "SELECT_VIZ": {
      if (state.framingLocked || state.gameOver) return state;
      const choices = { ...state.frameChoices, [action.cardId]: { ...state.frameChoices[action.cardId], viz: action.viz } };
      return { ...state, frameChoices: choices };
    }
    case "CONFIRM_FRAMING": {
      if (!framingComplete(state.frameChoices) || state.gameOver) return state;
      let wrongF = 0;
      let wrongV = 0;
      for (let i = 1; i <= 4; i++) {
        const c = state.frameChoices[i]!;
        if (c.frame !== ECHO_FRAME[i].correct) wrongF++;
        if (c.viz !== ECHO_VIZ[i].correct) wrongV++;
      }
      const detAdd = wrongF * 8 + wrongV * 5;
      const scoreAdd = wrongF === 0 && wrongV === 0 ? 200 : Math.max(0, 200 - (wrongF + wrongV) * 50);
      let messages = pushChat(state, "Echo", "Cards framed. The room is yours now.", "bm-h");
      messages = [...messages, { id: `m5-${Date.now()}-v`, sender: "Voss", text: "Crew is ready. Walk them through it.", tone: "bm-d" as const, ts: nowTs() }];
      const withDet = addDetection({ ...state, messages }, detAdd);
      if (withDet.gameOver) return withDet;
      return {
        ...withDet,
        framingLocked: true,
        phase: "briefing",
        score: state.score + scoreAdd,
        activeCrew: "zex",
        crewState: { ...state.crewState, zex: { ...state.crewState.zex, status: "asking" } },
        stepBanner: "Present your dossier — answer each crew member's challenge to earn their commitment",
      };
    }
    case "SELECT_CREW_OPT": {
      const crew = state.crewState[action.crewId];
      if (crew.status !== "asking") return state;
      return {
        ...state,
        crewState: { ...state.crewState, [action.crewId]: { ...crew, selected: action.idx } },
      };
    }
    case "CONFIRM_CREW": {
      const crew = state.crewState[action.crewId];
      const q = CREW_QUESTIONS[action.crewId];
      if (crew.status !== "asking" || crew.selected === null || state.gameOver) return state;
      const isCorrect = crew.selected === q.ans;
      const names = { zex: "Zex", atlas: "Atlas", nova: "Nova", kade: "Kade" };
      if (isCorrect) {
        const commits = state.commits + 1;
        const idx = CREW_ORDER.indexOf(action.crewId);
        const next = CREW_ORDER[idx + 1];
        const crewState = { ...state.crewState, [action.crewId]: { ...crew, status: "committed" as const } };
        let messages = pushChat(state, names[action.crewId], q.commit.replace(/^[A-Z]+:\s/, ""), "bm-ok");
        if (next) {
          crewState[next] = { ...crewState[next], status: "asking" };
          return { ...state, commits, score: state.score + 200, crewState, activeCrew: next, messages };
        }
        return finishBriefing(state, commits, crewState, messages, state.score + 200);
      }
      if (!crew.retried) {
        const withDet = addDetection(state, 10);
        if (withDet.gameOver) return withDet;
        return {
          ...withDet,
          score: Math.max(0, state.score - 100),
          crewState: { ...state.crewState, [action.crewId]: { ...crew, retried: true, selected: null, status: "asking" } },
          messages: pushChat(withDet, names[action.crewId], q.sceptical.replace(/^[A-Z]+:\s/, ""), "bm-err"),
        };
      }
      const idx = CREW_ORDER.indexOf(action.crewId);
      const next = CREW_ORDER[idx + 1];
      const crewState = { ...state.crewState, [action.crewId]: { ...crew, status: "sceptical" as const } };
      let messages = pushChat(state, names[action.crewId], "Not convinced.", "bm-err");
      if (next) {
        crewState[next] = { ...crewState[next], status: "asking" };
        return { ...state, score: Math.max(0, state.score - 150), crewState, activeCrew: next, messages };
      }
      return finishBriefing(state, state.commits, crewState, messages, Math.max(0, state.score - 150));
    }
    case "ADVANCE_CREW": {
      const idx = CREW_ORDER.indexOf(action.crewId);
      const next = CREW_ORDER[idx + 1];
      if (!next) return state;
      return {
        ...state,
        activeCrew: next,
        crewState: { ...state.crewState, [next]: { ...state.crewState[next], status: "asking" } },
      };
    }
    case "TRIGGER_VOTE":
      if (!state.ships) return state;
      return { ...state, phase: "debrief" };
    case "RESET_MISSION":
      return createInitialM5State();
    case "ADD_CHAT":
      return { ...state, messages: pushChat(state, action.sender, action.text, action.tone ?? "bm-d") };
    default:
      return state;
  }
}

export function getDetectionClass(det: number) {
  if (det < 35) return "det-green";
  if (det < 70) return "det-amber";
  return "det-red";
}

export function serializeM5State(state: M5GameState): Record<string, unknown> {
  return { version: 1, ...state };
}

export function hydrateM5State(raw: Record<string, unknown> | null | undefined): M5GameState | null {
  const restored = restoreGameState(raw, 1, createInitialM5State, ["failed"]);
  if (!restored) return null;
  const gameOver = Boolean(raw?.gameOver) || restored.phase === "failed";
  const failReason =
    raw?.failReason === "detection" || raw?.failReason === "vote"
      ? raw.failReason
      : gameOver && restored.ships === false
        ? "vote"
        : gameOver
          ? "detection"
          : null;
  return {
    ...restored,
    gameOver,
    failReason,
    phase: gameOver ? "failed" : restored.phase,
  };
}
