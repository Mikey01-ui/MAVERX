export type MissionPhase = "brief" | "protocol" | "tutorial" | "game";

export function checkpointToPhase(
  checkpoint: string | null | undefined,
  resume: boolean,
  missionId?: string
): MissionPhase {
  if (!resume) return "brief";
  if (!checkpoint || checkpoint === "start" || checkpoint === "intro") return "brief";
  if (checkpoint === "brief") return "brief";
  if (checkpoint === "protocol") {
    return missionId === "m2" || missionId === "m3" || missionId === "m4" || missionId === "m5" ? "tutorial" : "protocol";
  }
  if (checkpoint === "tutorial") return "tutorial";
  if (checkpoint === "completed") return "brief";
  return "game";
}

export function phaseToCheckpoint(phase: MissionPhase): string {
  if (phase === "brief") return "brief";
  if (phase === "protocol") return "protocol";
  if (phase === "tutorial") return "tutorial";
  return "game";
}
