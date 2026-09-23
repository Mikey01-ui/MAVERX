"use client";

import { MissionGameHeader } from "@/components/missions/shared/MissionGameHeader";
import {
  DETECTION_INFO,
  getDetectionBand,
  getDetectionBarClass,
  getDetectionClass,
  getDetectionIcon,
} from "@/lib/game/m3/detectionMeter";

export default function TestHeaderM3Page() {
  const detection = 41;
  const band = getDetectionBand(detection);
  return (
    <div className="m3-game" style={{ minHeight: "100vh", background: "var(--void, #0a0610)" }}>
      <MissionGameHeader
        missionLine="MISSION 03 OF 05 / THE HUMAN SHIELD"
        detection={detection}
        band={band}
        detClass={getDetectionClass(detection)}
        barClass={getDetectionBarClass(detection)}
        icon={getDetectionIcon(detection)}
        timer="08:42"
        info={DETECTION_INFO[band]}
        showMeter
        showAudio
      />
    </div>
  );
}
