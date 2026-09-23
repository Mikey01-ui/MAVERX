"use client";

import { MissionChrome } from "@/components/missions/MissionChrome";
import { MargusM1Brief } from "@/components/missions/margus-m1/MargusM1Brief";

/** Local review — M1 brief without nested ambient/status (MissionChrome only). */
export default function TestShellM1BriefPage() {
  return (
    <MissionChrome
      statusLeft={["TERMINAL ACTIVE", "OP-OMNI / v2.4.1"]}
      statusRight={["ENCRYPTED"]}
      clock="12:00:00"
      showAudio
      theme="theme-v2"
    >
      <MargusM1Brief onContinue={() => undefined} />
    </MissionChrome>
  );
}
