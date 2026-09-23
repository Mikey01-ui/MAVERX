"use client";

import { MissionGameHeader } from "@/components/missions/shared/MissionGameHeader";
import {
  DETECTION_INFO,
  getDetectionBand,
  getDetectionBarClass,
  getDetectionClass,
  getDetectionIcon,
} from "@/lib/game/m3/detectionMeter";

type Props = {
  shellClass: string;
  missionLine: string;
  detection: number;
  infoAriaLabel?: string;
};

function HeaderPreview({ shellClass, missionLine, detection, infoAriaLabel }: Props) {
  const band = getDetectionBand(detection);
  return (
    <div className={shellClass} style={{ minHeight: "100vh", background: "var(--void, #0a0610)" }}>
      <MissionGameHeader
        missionLine={missionLine}
        detection={detection}
        band={band}
        detClass={getDetectionClass(detection)}
        barClass={getDetectionBarClass(detection)}
        icon={getDetectionIcon(detection)}
        timer="08:42"
        info={DETECTION_INFO[band]}
        infoAriaLabel={infoAriaLabel}
        showMeter
        showAudio
      />
    </div>
  );
}

export default function TestHeaderM1Page() {
  return (
    <HeaderPreview
      shellClass="m1-game"
      missionLine="MISSION 01 OF 05 / IDENTIFYING THE FOOTPRINT"
      detection={22}
    />
  );
}
