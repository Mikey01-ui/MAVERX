"use client";

import { MissionGameHeader } from "@/components/missions/shared/MissionGameHeader";
import {
  DETECTION_INFO,
  getDetectionBand,
  getDetectionBarClass,
  getDetectionClass,
  getDetectionIcon,
} from "@/lib/game/m3/detectionMeter";

export default function TestHeaderM2Page() {
  const detection = 34;
  const band = getDetectionBand(detection);
  return (
    <div className="m2-mission" style={{ minHeight: "100vh", background: "var(--void, #0a0610)" }}>
      <MissionGameHeader
        missionLine="MISSION 02 OF 05 / FORGING THE MASTER KEY"
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
