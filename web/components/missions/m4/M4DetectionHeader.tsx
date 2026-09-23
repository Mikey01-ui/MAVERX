"use client";

import { MissionGameHeader } from "@/components/missions/shared/MissionGameHeader";
import { useM4Game } from "@/lib/game/m4/context";
import {
  M4_DETECTION_INFO,
  getDetectionBand,
  getDetectionBarClass,
  getDetectionClass,
  getDetectionIcon,
} from "@/lib/game/m4/detectionMeter";

export function M4DetectionHeader() {
  const { state } = useM4Game();
  const det = Math.round(state.detection);
  const band = getDetectionBand(det);
  const timer = `${String(Math.floor(state.timerSec / 60)).padStart(2, "0")}:${String(state.timerSec % 60).padStart(2, "0")}`;

  return (
    <MissionGameHeader
      missionLine="MISSION 04 OF 05 / THE ONBOARDING"
      detection={det}
      band={band}
      detClass={getDetectionClass(det)}
      barClass={getDetectionBarClass(det)}
      icon={getDetectionIcon(det)}
      timer={timer}
      info={M4_DETECTION_INFO[band]}
      infoAriaLabel="Handoff detection info"
      showMeter
      showAudio
    />
  );
}
