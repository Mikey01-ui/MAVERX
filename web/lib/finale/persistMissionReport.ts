import type { MissionReportSnapshot } from "@/lib/finale/missionReportSnapshot";

export type MissionReportOutcome = "completed" | "failed";

/** Persist normalized report stats for the operation PDF (success or fail). */
export async function persistMissionReport(
  missionId: string,
  snapshot: MissionReportSnapshot,
  outcome: MissionReportOutcome,
) {
  await fetch("/api/progress", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      missionId,
      status: outcome === "completed" ? "completed" : "in_progress",
      checkpoint: outcome === "completed" ? "completed" : "failed",
      score: snapshot.score,
      stateJson: snapshot.stateJson,
    }),
  });
}
