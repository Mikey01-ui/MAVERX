"use client";

import { MissionGameHeader } from "@/components/missions/shared/MissionGameHeader";
import { getDetectionClass, getDetectionLabel } from "@/lib/game/m1/reducer";
import {
  getDetectionBand,
  getDetectionBarClass,
  getDetectionIcon,
  DETECTION_INFO,
} from "@/lib/game/m3/detectionMeter";

type Props = {
  detection: number;
  timer: string;
};

export function M1DetectionHeader({ detection, timer }: Props) {
  const det = Math.round(detection);
  const band = getDetectionBand(det);

  return (
    <MissionGameHeader
      missionLine="MISSION 01 OF 05 / IDENTIFYING THE FOOTPRINT"
      detection={det}
      band={getDetectionLabel(det)}
      detClass={getDetectionClass(det)}
      barClass={getDetectionBarClass(det)}
      icon={getDetectionIcon(det)}
      timer={timer}
      info={DETECTION_INFO[band]}
      showMeter
      showAudio
    />
  );
}
