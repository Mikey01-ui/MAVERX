"use client";

import { MissionChrome } from "@/components/missions/MissionChrome";
import { M2Brief } from "@/components/missions/m2/M2Brief";

/** Local review — M2 brief inside shared MissionChrome (theme-v2 + intro status). */
export default function TestShellM2BriefPage() {
  return (
    <MissionChrome
      statusLeft={["TERMINAL ACTIVE", "MISSION 02"]}
      statusRight={["ENCRYPTED"]}
      clock="12:00:00"
      showAudio
      theme="theme-v2"
    >
      <M2Brief onContinue={() => undefined} onSkip={() => undefined} />
    </MissionChrome>
  );
}
