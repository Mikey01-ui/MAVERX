export type ChatTone = "bm-d" | "bm-ok" | "bm-err" | "bm-h";

export type OnboardingStep = {
  id: string;
  lane: string;
  deptCls: string;
  title: string;
  purpose: string;
  inputs: string;
  outputs: string;
  bottleneck: string;
  okFile: string;
};

export type LeakFile = {
  id: string;
  name: string;
  desc: string;
};

export type ChatMessage = { id: string; sender: string; text: string; tone: ChatTone; ts: string };

export type M4WrongAttempt = {
  fileId: string;
  file: string;
  wrongGateId: string;
  wrongGateTitle: string;
  correctGateId: string;
  correctGateTitle: string;
  reason: string;
};

export type M4Phase = "hack" | "play" | "debrief" | "failed";

export type M4GameState = {
  phase: M4Phase;
  hackLine: number;
  hackDone: boolean;
  picks: Record<string, string>;
  selectedStepId: string | null;
  selectedFileId: string | null;
  detection: number;
  detectionWarned: { 30: boolean; 60: boolean; 80: boolean };
  gameOver: boolean;
  wrongAttempts: number;
  wrongAttemptLog: M4WrongAttempt[];
  hintsUsed: number;
  hintCooldown: boolean;
  hintCooldownUntil: number | null;
  submitted: boolean;
  timerSec: number;
  messages: ChatMessage[];
  stepBanner: string;
};

export type M4GameAction =
  | { type: "TICK" }
  | { type: "HACK_ADVANCE" }
  | { type: "HACK_DONE" }
  | { type: "SELECT_STEP"; stepId: string }
  | { type: "ASSIGN_FILE"; fileId: string }
  | { type: "ASSIGN_FILE_TO_STEP"; fileId: string; stepId: string }
  | { type: "UNASSIGN_FILE"; fileId: string }
  | { type: "REQUEST_HINT" }
  | { type: "HINT_COOLDOWN_CLEAR" }
  | { type: "SUBMIT" }
  | { type: "SHOW_DEBRIEF" }
  | { type: "RESET_MISSION" }
  | { type: "ADD_CHAT"; sender: string; text: string; tone?: ChatTone };
