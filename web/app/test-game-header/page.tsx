"use client";

import { useEffect, useState } from "react";
import { MissionGameHeader } from "@/components/missions/shared/MissionGameHeader";
import {
  DETECTION_INFO,
  getDetectionBand,
  getDetectionBarClass,
  getDetectionClass,
  getDetectionIcon,
} from "@/lib/game/m3/detectionMeter";

/** Local review — shared in-game header chrome (M3 meter styling). */
export default function TestGameHeaderPage() {
  const [det, setDet] = useState(28);

  useEffect(() => {
    const t = window.setTimeout(() => setDet(36), 1200);
    return () => window.clearTimeout(t);
  }, []);

  const band = getDetectionBand(det);

  return (
    <div className="m3-game" style={{ minHeight: "100vh", background: "var(--void, #0a0610)" }}>
      <div id="m3-game" className="active" style={{ position: "relative", inset: "auto", height: "100vh" }}>
        <MissionGameHeader
          missionLine="MISSION 03 OF 05 / THE HUMAN SHIELD"
          detection={det}
          band={band}
          detClass={getDetectionClass(det)}
          barClass={getDetectionBarClass(det)}
          icon={getDetectionIcon(det)}
          timer="12:04"
          info={DETECTION_INFO[band]}
          showMeter
          showAudio
        />
        <div style={{ padding: "24px 32px", fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(250,247,242,.55)" }}>
          Shared MissionGameHeader preview — detection bumps once so you can confirm toast / flash.
        </div>
      </div>
    </div>
  );
}
