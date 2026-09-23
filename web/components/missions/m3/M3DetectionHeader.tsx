"use client";

import { MissionGameHeader } from "@/components/missions/shared/MissionGameHeader";
import { useM3Game } from "@/lib/game/m3/context";
import {
  DETECTION_INFO,
  getDetectionBand,
  getDetectionBarClass,
  getDetectionClass,
  getDetectionIcon,
} from "@/lib/game/m3/detectionMeter";

export function M3Header() {
  const { state } = useM3Game();
  const det = Math.round(state.detection);
  const band = getDetectionBand(det);
  const timer = `${String(Math.floor(state.timerSec / 60)).padStart(2, "0")}:${String(state.timerSec % 60).padStart(2, "0")}`;
  const showMeter = state.phase === "play" || state.phase === "signoff";

  return (
    <MissionGameHeader
      missionLine="MISSION 03 OF 05 / THE HUMAN SHIELD"
      detection={det}
      band={band}
      detClass={getDetectionClass(det)}
      barClass={getDetectionBarClass(det)}
      icon={getDetectionIcon(det)}
      timer={timer}
      info={DETECTION_INFO[band]}
      infoAriaLabel="Detection status info"
      showMeter={showMeter}
      showAudio
    />
  );
}
