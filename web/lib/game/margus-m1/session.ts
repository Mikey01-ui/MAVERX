import type { LeadId } from "@/components/missions/margus-m1/gameData";

export const MARGUS_M1_SESSION_VERSION = 1;

export type MargusM1GsSnapshot = {
  decoyDetection: number;
  clickDetection: number;
  verifyDetection: number;
  hintDetection: number;
  passiveDetection: number;
  errors: number;
  hintsUsed: number;
  reconnected: boolean;
  hackDone: boolean;
  warned: Record<number, boolean>;
  foldersOpened: string[];
  personalNotesSeen: boolean;
  sysMetricsSeen: boolean;
  msgId: number;
  toastId: number;
  zTop: number;
  gameOver: boolean;
  synthStarted: boolean;
};

export type MargusM1PlaySnapshot = {
  det: number;
  timerSec: number;
  hackActive: boolean;
  revealed: boolean;
  hackShown: Record<string, boolean>;
  activeLead: LeadId | null;
  locked: LeadId[];
  currentStep: number;
  leadVisual: Record<LeadId, string>;
  leadStatusTxt: Record<LeadId, string>;
  stepBanner: string;
  ebStep: string;
  ebHint: string;
  openWins: string[];
  zOrder: string[];
  pos: Record<string, { top: number; left: number; width: number; height?: number }>;
  activeTab: Record<string, number>;
  anomaly: Record<string, boolean>;
  messages: unknown[];
  verifyLead: LeadId | null;
  verifyOpen: boolean;
  chipIdx: (number | null)[];
  chipState: Record<string, "sel" | "correct" | "wrong">;
  paramErr: Record<number, string>;
  hintCd: number;
  pptSlide: number;
  pptZoomLvl: number;
  synthOn: boolean;
  synthDone: boolean;
  breachOn: boolean;
  breachAlert: string;
  breachGlitch: string;
  breachRecon: string;
  gameOver: boolean;
  glitching: boolean;
  dialog: string | null;
  synthBtnReady: boolean;
  synthBtnEnabled: boolean;
  maximized: string[];
  gs: MargusM1GsSnapshot;
};

export function isMargusM1DebriefState(raw: Record<string, unknown> | null | undefined): boolean {
  return raw?.version === MARGUS_M1_SESSION_VERSION && raw.phase === "debrief" && raw.stats != null;
}

export function createDefaultGsSnapshot(): MargusM1GsSnapshot {
  return {
    decoyDetection: 0,
    clickDetection: 0,
    verifyDetection: 0,
    hintDetection: 0,
    passiveDetection: 0,
    errors: 0,
    hintsUsed: 0,
    reconnected: false,
    hackDone: false,
    warned: { 30: false, 60: false, 80: false },
    foldersOpened: [],
    personalNotesSeen: false,
    sysMetricsSeen: false,
    msgId: 0,
    toastId: 0,
    zTop: 100,
    gameOver: false,
    synthStarted: false,
  };
}

export function hydrateMargusM1Play(raw: Record<string, unknown> | null | undefined): MargusM1PlaySnapshot | null {
  if (!raw || raw.version !== MARGUS_M1_SESSION_VERSION || raw.phase !== "play") return null;
  const gsRaw = (raw.gs as Partial<MargusM1GsSnapshot> | undefined) ?? {};
  return {
    ...(raw as MargusM1PlaySnapshot),
    gs: { ...createDefaultGsSnapshot(), ...gsRaw, foldersOpened: gsRaw.foldersOpened ?? [] },
  };
}

export function serializeMargusM1Play(snapshot: MargusM1PlaySnapshot): Record<string, unknown> {
  return {
    version: MARGUS_M1_SESSION_VERSION,
    phase: "play",
    ...snapshot,
  };
}

export function serializeMargusM1Debrief(stats: Record<string, unknown>): Record<string, unknown> {
  return {
    version: MARGUS_M1_SESSION_VERSION,
    phase: "debrief",
    stats,
  };
}
