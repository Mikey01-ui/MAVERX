import type { GameStats } from "@/components/missions/margus-m1/MargusM1Game";
import type { M2GameState } from "@/lib/game/m2/types";
import type { M3GameState } from "@/lib/game/m3/types";
import type { M4GameState } from "@/lib/game/m4/types";
import { ECHO_FRAME, ECHO_VIZ } from "@/lib/game/m5/data";
import type { M5GameState } from "@/lib/game/m5/types";

export type MissionReportSnapshot = {
  score: number;
  stateJson: Record<string, unknown>;
};

function detectionScore(detection: number): number {
  return Math.max(0, 100 - Math.round(detection));
}

export function m1ReportSnapshot(stats: GameStats): MissionReportSnapshot {
  return {
    score: detectionScore(stats.detection),
    stateJson: {
      version: 1,
      timerSec: stats.timerSec,
      detection: stats.detection,
      errors: stats.errors,
      hintsUsed: stats.hintsUsed,
      decoy: stats.decoy,
      click: stats.click,
      verify: stats.verify,
      hint: stats.hint,
      passive: stats.passive,
    },
  };
}

export function m2ReportSnapshot(state: M2GameState): MissionReportSnapshot {
  return {
    score: detectionScore(state.detection),
    stateJson: {
      version: 2,
      timerSec: state.timerSec,
      detection: state.detection,
      tokens: state.tokens.length,
      wrongRulings: state.wrongRulings,
      verifyErrors: state.verifyErrors,
      hintsUsed: state.hintsUsed,
    },
  };
}

export function m3ReportSnapshot(state: M3GameState): MissionReportSnapshot {
  return {
    score: detectionScore(state.detection),
    stateJson: {
      version: 3,
      detection: Math.round(state.detection),
      wrongRoutes: state.wrongRoutes,
      catastrophic: state.catastrophic,
      hintsUsed: state.hintsUsed,
      timerSec: state.timerSec,
      wrongAttemptLog: state.wrongAttemptLog,
    },
  };
}

export function m4ReportSnapshot(state: M4GameState): MissionReportSnapshot {
  return {
    score: detectionScore(state.detection),
    stateJson: {
      version: 3,
      detection: state.detection,
      linked: Object.keys(state.picks).length,
      wrongAttempts: state.wrongAttempts,
      hintsUsed: state.hintsUsed,
      timerSec: state.timerSec,
      wrongAttemptLog: state.wrongAttemptLog,
    },
  };
}

export function m5ReportSnapshot(state: M5GameState): MissionReportSnapshot {
  let wrongFraming = 0;
  let wrongViz = 0;
  for (let i = 1; i <= 4; i++) {
    const c = state.frameChoices[i];
    if (c?.frame && c.frame !== ECHO_FRAME[i].correct) wrongFraming++;
    if (c?.viz && c.viz !== ECHO_VIZ[i].correct) wrongViz++;
  }

  return {
    score: detectionScore(state.detection),
    stateJson: {
      version: 2,
      commits: state.commits,
      ships: state.ships,
      detection: state.detection,
      timerSec: state.timerSec,
      wrongFraming,
      wrongViz,
    },
  };
}
