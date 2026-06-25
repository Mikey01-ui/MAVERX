"use client";

import { useEffect, useRef } from "react";
import type { MissionReportSnapshot } from "@/lib/finale/missionReportSnapshot";
import { persistMissionReport } from "@/lib/finale/persistMissionReport";

/** Save report stats once when a mission fails (detection / vote fail, etc.). */
export function usePersistFailedMissionReport(
  missionId: string,
  gameOver: boolean,
  getSnapshot: () => MissionReportSnapshot,
) {
  const savedRef = useRef(false);
  const getSnapshotRef = useRef(getSnapshot);
  getSnapshotRef.current = getSnapshot;

  useEffect(() => {
    if (!gameOver) {
      savedRef.current = false;
      return;
    }
    if (savedRef.current) return;
    savedRef.current = true;
    void persistMissionReport(missionId, getSnapshotRef.current(), "failed");
  }, [gameOver, missionId]);
}
