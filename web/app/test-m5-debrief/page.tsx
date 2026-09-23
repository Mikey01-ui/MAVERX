"use client";

import { MissionDebriefScreen } from "@/components/missions/shared/MissionDebriefScreen";
import { buildM5Debrief } from "@/lib/game/debriefBuilders";
import type { M5GameState } from "@/lib/game/m5/types";

/** Local review only — mounts real M5 debrief chrome with a success state. */
const PREVIEW_SUCCESS: M5GameState = {
  phase: "debrief",
  hackLine: 0,
  hackDone: true,
  frameChoices: {},
  framingLocked: true,
  crewState: {
    zex: { status: "committed", retried: false, selected: 0 },
    atlas: { status: "committed", retried: false, selected: 2 },
    nova: { status: "committed", retried: false, selected: 0 },
    kade: { status: "committed", retried: false, selected: 0 },
  },
  activeCrew: null,
  commits: 4,
  detection: 28,
  score: 1840,
  timerSec: 742,
  messages: [],
  stepBanner: "",
  ships: true,
  gameOver: false,
  failReason: null,
};

export default function TestM5DebriefPage() {
  const config = buildM5Debrief(PREVIEW_SUCCESS);

  return (
    <div className="m5-game" style={{ minHeight: "100vh", background: "var(--void, #0a0610)" }}>
      <MissionDebriefScreen config={config} onContinue={() => undefined} hubLink={false} />
    </div>
  );
}
