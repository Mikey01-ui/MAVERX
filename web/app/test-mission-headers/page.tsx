"use client";

import { MissionGameHeader } from "@/components/missions/shared/MissionGameHeader";
import {
  DETECTION_INFO,
  getDetectionBand,
  getDetectionBarClass,
  getDetectionClass,
  getDetectionIcon,
} from "@/lib/game/m3/detectionMeter";
import { M4_DETECTION_INFO } from "@/lib/game/m4/detectionMeter";

const MISSIONS = [
  {
    id: "m1",
    shell: "m1-game",
    line: "MISSION 01 OF 05 / IDENTIFYING THE FOOTPRINT",
    detection: 22,
    info: DETECTION_INFO,
  },
  {
    id: "m2",
    shell: "m2-mission",
    line: "MISSION 02 OF 05 / FORGING THE MASTER KEY",
    detection: 34,
    info: DETECTION_INFO,
  },
  {
    id: "m3",
    shell: "m3-game",
    line: "MISSION 03 OF 05 / THE HUMAN SHIELD",
    detection: 41,
    info: DETECTION_INFO,
  },
  {
    id: "m4",
    shell: "m4-game",
    line: "MISSION 04 OF 05 / THE ONBOARDING",
    detection: 18,
    info: M4_DETECTION_INFO,
  },
  {
    id: "m5",
    shell: "m5-game",
    line: "MISSION 05 OF 05 / THE FINAL BRIEF",
    detection: 55,
    info: DETECTION_INFO,
  },
] as const;

export default function TestMissionHeadersPage() {
  return (
    <div style={{ background: "var(--void, #0a0610)", minHeight: "100vh", paddingBottom: 48 }}>
      <div
        style={{
          padding: "20px 24px 8px",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.14em",
          color: "rgba(250,247,242,.45)",
        }}
      >
        SHARED MISSIONGAMEHEADER — ONE PER MISSION SHELL
      </div>
      {MISSIONS.map((m) => {
        const det = m.detection;
        const band = getDetectionBand(det);
        return (
          <section key={m.id} className={m.shell} style={{ marginBottom: 28 }}>
            <div
              style={{
                padding: "10px 24px 6px",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.18em",
                color: "rgba(0,196,28,.7)",
              }}
            >
              {m.id.toUpperCase()} · {m.shell}
            </div>
            <MissionGameHeader
              missionLine={m.line}
              detection={det}
              band={band}
              detClass={getDetectionClass(det)}
              barClass={getDetectionBarClass(det)}
              icon={getDetectionIcon(det)}
              timer="08:42"
              info={m.info[band]}
              infoAriaLabel={m.id === "m4" ? "Handoff detection info" : "Detection status info"}
              showMeter
              showAudio
            />
          </section>
        );
      })}
    </div>
  );
}
