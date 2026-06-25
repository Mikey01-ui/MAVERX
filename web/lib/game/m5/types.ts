export type ChatTone = "bm-d" | "bm-ok" | "bm-err" | "bm-h" | "bm-win";
export type FrameKey = "risk" | "opportunity" | "neutral";
export type CrewId = "zex" | "atlas" | "nova" | "kade";
export type CrewStatus = "pending" | "asking" | "committed" | "sceptical";
export type M5Phase = "hack" | "framing" | "briefing" | "vote" | "debrief" | "failed";

export type CardChoice = { frame?: FrameKey; viz?: string };

export type CrewState = {
  status: CrewStatus;
  retried: boolean;
  selected: number | null;
};

export type ChatMessage = { id: string; sender: string; text: string; tone: ChatTone; ts: string };

export type M5GameState = {
  phase: M5Phase;
  hackLine: number;
  hackDone: boolean;
  frameChoices: Record<number, CardChoice>;
  framingLocked: boolean;
  crewState: Record<CrewId, CrewState>;
  activeCrew: CrewId | null;
  commits: number;
  detection: number;
  score: number;
  timerSec: number;
  messages: ChatMessage[];
  stepBanner: string;
  ships: boolean | null;
  gameOver: boolean;
  failReason: "detection" | "vote" | null;
};

export type M5GameAction =
  | { type: "TICK" }
  | { type: "HACK_ADVANCE" }
  | { type: "HACK_DONE" }
  | { type: "SELECT_FRAME"; cardId: number; frame: FrameKey }
  | { type: "SELECT_VIZ"; cardId: number; viz: string }
  | { type: "CONFIRM_FRAMING" }
  | { type: "SELECT_CREW_OPT"; crewId: CrewId; idx: number }
  | { type: "CONFIRM_CREW"; crewId: CrewId }
  | { type: "CREW_RETRY_READY"; crewId: CrewId }
  | { type: "ADVANCE_CREW"; crewId: CrewId }
  | { type: "TRIGGER_VOTE" }
  | { type: "RESET_MISSION" }
  | { type: "ADD_CHAT"; sender: string; text: string; tone?: ChatTone };
