"use client";

import { MissionChrome } from "@/components/missions/MissionChrome";
import { BriefPhase } from "@/components/missions/phases/BriefPhase";
import type { MissionIntro } from "@/lib/content";
import m3Intro from "@/content/missions/m3/intro.json";

/** Local review — M3 brief on shared MissionChrome + theme-v2. */
export default function TestShellM3BriefPage() {
  const brief = (m3Intro as MissionIntro).brief;

  return (
    <MissionChrome
      statusLeft={(m3Intro as MissionIntro).statusLeft}
      statusRight={(m3Intro as MissionIntro).statusRight}
      clock="12:00:00"
      showAudio
      theme="theme-v2"
    >
      <BriefPhase brief={brief} onContinue={() => undefined} />
    </MissionChrome>
  );
}
