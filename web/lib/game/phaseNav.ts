import type { MissionPhase } from "@/lib/game/types";

const PHASES = new Set<MissionPhase>(["brief", "protocol", "tutorial", "game"]);

export function parseMissionPhase(raw: string | undefined | null): MissionPhase | null {
  if (!raw) return null;
  return PHASES.has(raw as MissionPhase) ? (raw as MissionPhase) : null;
}

export function missionPhaseHref(missionId: string, phase: MissionPhase): string {
  return `/mission/${missionId}?phase=${phase}`;
}

/** After brief: missions with in-mission tutorials go there; others go to protocol. */
export function nextPhaseAfterBrief(missionId: string): MissionPhase {
  if (
    missionId === "m1" ||
    missionId === "m2" ||
    missionId === "m3" ||
    missionId === "m4" ||
    missionId === "m5"
  ) {
    return "tutorial";
  }
  return "protocol";
}
