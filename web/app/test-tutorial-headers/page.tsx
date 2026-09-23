"use client";

/**
 * Side-by-side tutorial headers — real MissionGameHeader via each tutorial shell's chrome path.
 * Opens each mission's tutorial shell header only (not full tutorial UI).
 */
import { MissionGameHeader } from "@/components/missions/shared/MissionGameHeader";
import {
  DETECTION_INFO,
  getDetectionBand,
  getDetectionBarClass,
  getDetectionClass,
  getDetectionIcon,
} from "@/lib/game/m3/detectionMeter";
import { M4_DETECTION_INFO } from "@/lib/game/m4/detectionMeter";
import { DET_INFO } from "@/components/missions/margus-m1/gameData";

const ROWS = [
  {
    id: "m1-tut",
    shell: "margus-m1-game-root m1-tutorial-shell",
    line: "MISSION 01 OF 05 / IDENTIFYING THE FOOTPRINT",
    detection: 4,
    cause:
      "Detection rises when you open the wrong files, fail a verification, or lean on hints, and slowly over time on the mirror. At 100% the operation fails.",
    infoSource: "m1" as const,
  },
  {
    id: "m2-tut",
    shell: "m2-mission m2-tutorial-shell",
    line: "MISSION 02 OF 05 / FORGING THE MASTER KEY",
    detection: 12,
    cause:
      "Detection rises when you rule incorrectly, fail verification, request hints, or idle too long. At 100% MegaCorp closes the connection.",
    infoSource: "m1" as const,
  },
  {
    id: "m3-tut",
    shell: "m3-game m3-tutorial-shell",
    line: "MISSION 03 OF 05 / THE HUMAN SHIELD",
    detection: 0,
    infoSource: "m3" as const,
  },
  {
    id: "m4-tut",
    shell: "m4-game",
    line: "MISSION 04 OF 05 / THE ONBOARDING",
    detection: 0,
    infoSource: "m4" as const,
  },
  {
    id: "m5-tut",
    shell: "m5-game m5-tutorial-shell",
    line: "MISSION 05 OF 05 / THE FINAL BRIEF",
    detection: 0,
    infoSource: "m3" as const,
  },
] as const;

export default function TestTutorialHeadersPage() {
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
        TUTORIAL / SHARED MISSIONGAMEHEADER
      </div>
      {ROWS.map((row) => {
        const band = getDetectionBand(row.detection);
        const info =
          row.infoSource === "m4"
            ? M4_DETECTION_INFO[band]
            : row.infoSource === "m3"
              ? DETECTION_INFO[band]
              : {
                  color: DET_INFO[band].color,
                  desc: DET_INFO[band].desc,
                  cause: "cause" in row ? row.cause : DETECTION_INFO[band].cause,
                };
        return (
          <section key={row.id} className={row.shell} style={{ marginBottom: 28 }}>
            <div
              style={{
                padding: "10px 24px 6px",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.18em",
                color: "rgba(0,196,28,.7)",
              }}
            >
              {row.id.toUpperCase()}
            </div>
            <MissionGameHeader
              missionLine={row.line}
              detection={row.detection}
              band={band}
              detClass={getDetectionClass(row.detection)}
              barClass={getDetectionBarClass(row.detection)}
              icon={getDetectionIcon(row.detection)}
              timer="00:00"
              info={info}
              infoAriaLabel={row.id === "m4-tut" ? "Handoff detection info" : "Detection status info"}
              showMeter
              showAudio={false}
            />
          </section>
        );
      })}
    </div>
  );
}
