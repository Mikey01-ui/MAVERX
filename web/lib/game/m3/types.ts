export type Channel = "public" | "official" | "vault";
export type ChatTone = "bm-d" | "bm-ok" | "bm-err" | "bm-h" | "bm-win";
export type ChatSender = "Voss" | "Zex" | "Nova";

export type Dataset = {
  id: string;
  file: string;
  correct: Channel;
  classification: string;
  identifiers: string;
  harmIfPublic: string;
  note: string;
  wrongRationale: Partial<Record<Channel, string>>;
};

export type ChatMessage = {
  id: string;
  sender: ChatSender;
  text: string;
  tone: ChatTone;
  ts: string;
};

export type M3WrongAttempt = {
  fileId: string;
  file: string;
  choice: Channel;
  correct: Channel;
  reason: string;
};

export type M3Phase = "hack" | "desktop" | "play" | "signoff" | "debrief" | "failed";

export type M3GameState = {
  phase: M3Phase;
  hackLine: number;
  hackDone: boolean;
  detection: number;
  detectionWarned: Record<30 | 60 | 80, boolean>;
  gameOver: boolean;
  assigned: Partial<Record<string, Channel>>;
  selectedId: string | null;
  timerSec: number;
  wrongRoutes: number;
  wrongAttemptLog: M3WrongAttempt[];
  catastrophic: number;
  hintsUsed: number;
  hintCooldown: boolean;
  /** Epoch ms when hint cooldown ends (for session restore). */
  hintCooldownUntil: number | null;
  signOffStarted: boolean;
  messages: ChatMessage[];
  stepBanner: string;
  vaultOpen: boolean;
};

export type M3GameAction =
  | { type: "TICK" }
  | { type: "HACK_ADVANCE" }
  | { type: "HACK_DONE" }
  | { type: "OPEN_VAULT" }
  | { type: "CLOSE_VAULT" }
  | { type: "VAULT_UNLOCKED" }
  | { type: "SELECT_DATASET"; id: string }
  | { type: "ASSIGN_CHANNEL"; channel: Channel }
  | { type: "REQUEST_HINT" }
  | { type: "HINT_COOLDOWN_CLEAR" }
  | { type: "REQUEST_SIGNOFF" }
  | { type: "SIGNOFF_DONE" }
  | { type: "RESET_MISSION" }
  | { type: "ADD_CHAT"; sender: ChatSender; text: string; tone?: ChatTone };
