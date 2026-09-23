"use client";

import { MissionGameHeader } from "@/components/missions/shared/MissionGameHeader";
import {
  getDetectionBand,
  getDetectionBarClass,
  getDetectionClass,
  getDetectionIcon,
} from "@/lib/game/m3/detectionMeter";
import { M4_DETECTION_INFO } from "@/lib/game/m4/detectionMeter";

export default function TestHeaderM4Page() {
  const detection = 18;
  const band = getDetectionBand(detection);
  return (
    <div className="m4-game" style={{ minHeight: "100vh", background: "var(--void, #0a0610)" }}>
      <MissionGameHeader
        missionLine="MISSION 04 OF 05 / THE ONBOARDING"
        detection={detection}
        band={band}
        detClass={getDetectionClass(detection)}
        barClass={getDetectionBarClass(detection)}
        icon={getDetectionIcon(detection)}
        timer="08:42"
        info={M4_DETECTION_INFO[band]}
        infoAriaLabel="Handoff detection info"
        showMeter
        showAudio
      />
    </div>
  );
}
