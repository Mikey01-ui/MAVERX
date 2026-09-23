"use client";

import { ProtocolPhase } from "@/components/missions/phases/ProtocolPhase";
import type { MissionIntro } from "@/lib/content";
import m3Intro from "@/content/missions/m3/intro.json";

/** Local review — real protocol chrome with updated detection copy. */
export default function TestM3ProtocolPage() {
  const protocol = (m3Intro as MissionIntro).protocol;

  return (
    <div style={{ minHeight: "100vh", background: "var(--void, #0a0610)" }}>
      <ProtocolPhase protocol={protocol} onBreach={() => undefined} showAllSteps hideBreachButton />
    </div>
  );
}
