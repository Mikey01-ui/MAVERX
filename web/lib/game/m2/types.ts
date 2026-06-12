export type DisputeId = 1 | 2 | 3 | 4;
export type TokenId = "finance" | "it" | "operations" | "compliance";
export type ChatTone = "bm-d" | "bm-ok" | "bm-err" | "bm-win" | "bm-h";
export type ChatSender = "Atlas" | "Voss";

export type FileRecord = {
  name: string;
  claimedBy: string;
  records: number;
  source: string;
  steward: string;
  lineage: string[];
  classification: string;
  cls: string;
  schema: string[];
  lastAccess: string;
  hint: string;
  dispute: DisputeId | 0;
  keyNode?: string;
  keyNodeNote?: string;
};

/** Per-question result flash shown after CONFIRM_VERIFY (cleared ~2.2s later on errors). */
export type VerifyFeedback = {
  /** chip index the player had selected per question */
  selections: Record<number, number>;
  /** per-question correctness */
  correct: Record<number, boolean>;
};

export type Claimant = { dept: string; rep: string; arg: string };

export type Dispute = {
  id: DisputeId;
  caseId: string;
  dataset: string;
  fileKey: string;
  token: TokenId;
  leadId: string;
  topic: string;
  claimants: [Claimant, Claimant];
  correctIdx: 0 | 1;
  settleFact: string;
  intro: string;
  correct: string;
  wrong: string;
};

export type VerifyQuestion = {
  label: string;
  note: string;
  opts: string[];
  ans: number;
  err: string;
};

export type VerifyBlock = {
  title: string;
  sub: string;
  questions: VerifyQuestion[];
};

export type ChatMessage = {
  id: string;
  sender: ChatSender;
  text: string;
  tone: ChatTone;
  ts: string;
};

export type M2Phase = "hack" | "play" | "synth" | "debrief";

export type M2GameState = {
  phase: M2Phase;
  hackLine: number;
  hackDone: boolean;
  results: Partial<Record<DisputeId, "correct" | "wrong">>;
  verifyResults: Partial<Record<DisputeId, true>>;
  tokens: TokenId[];
  wrongRulings: number;
  verifyErrors: number;
  hintsUsed: number;
  score: number;
  timerSec: number;
  detection: number;
  activeDispute: DisputeId | null;
  verifyDispute: DisputeId | null;
  vpSelections: Record<number, number>;
  verifyOpen: boolean;
  openWindows: string[];
  selectedFile: string | null;
  highlightDispute: DisputeId | null;
  stepBanner: string;
  ebStep: string;
  tokenCount: string;
  leadStatus: Record<string, string>;
  leadStatusText: Record<string, string>;
  messages: ChatMessage[];
  hintCooldown: boolean;
  gameOver: boolean;
  introScheduled: boolean;
  wrongShake: number | null;
  /** windows the player has opened at least once — used to retire desktop-icon attention cues */
  everOpened: string[];
  /** post-confirm chip feedback; null when not showing */
  verifyFeedback: VerifyFeedback | null;
};

export type M2GameAction =
  | { type: "TICK" }
  | { type: "HACK_ADVANCE" }
  | { type: "HACK_DONE" }
  | { type: "SCHEDULE_INTRO" }
  | { type: "ADD_CHAT"; sender: ChatSender; text: string; tone?: ChatTone }
  | { type: "LOAD_DISPUTE"; id: DisputeId }
  | { type: "RULE"; disputeId: DisputeId; chosenIdx: 0 | 1 }
  | { type: "OPEN_VERIFY"; disputeId: DisputeId }
  | { type: "SELECT_CHIP"; qi: number; ci: number }
  | { type: "CONFIRM_VERIFY" }
  | { type: "TOGGLE_VERIFY" }
  | { type: "OPEN_WINDOW"; windowId: string }
  | { type: "CLOSE_WINDOW"; windowId: string }
  | { type: "INSPECT_FILE"; fileKey: string }
  | { type: "DECOY_PERSONAL"; key: string }
  | { type: "REQUEST_HINT" }
  | { type: "HINT_COOLDOWN_CLEAR" }
  | { type: "START_SYNTH" }
  | { type: "SYNTH_DONE" }
  | { type: "CLEAR_SHAKE" }
  | { type: "CLEAR_VERIFY_FEEDBACK" }
  | { type: "PASSIVE_DETECTION" };
