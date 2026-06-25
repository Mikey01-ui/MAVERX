"use client";

import { CREW_ORDER } from "@/lib/game/m5/data";
import type { CrewId } from "@/lib/game/m5/types";

type Props = {
  active: boolean;
  ships: true;
  commits: number;
  crewState: Record<CrewId, { status: string }>;
  onContinue: () => void;
};

export function M5VoteOverlay({ active, commits, crewState, onContinue }: Props) {
  if (!active) return null;

  return (
    <div id="vote-overlay" className="active">
      <div className="vote-card">
        <div className="vote-title" id="vote-title">
          OPERATION SHIPS
        </div>
        <div className="vote-tally" id="vote-tally">
          {CREW_ORDER.map((c) => {
            const st = crewState[c].status;
            return (
              <div key={c} className={`vote-pip ${st === "committed" ? "commit" : "sceptical"}`} title={c.toUpperCase()}>
                {st === "committed" ? "✓" : "✗"}
              </div>
            );
          })}
        </div>
        <div className="vote-voss" id="vote-voss-line">
          VOSS: Four people who don&apos;t agree on anything just agreed on you. That&apos;s not nothing. Move.
        </div>
        <div className="vote-outcome" id="vote-outcome" style={{ color: "var(--green-stable)" }}>
          {commits}/4 specialists committed. The hack is a go.
        </div>
        <div className="vote-sub" id="vote-sub">
          OMNI vault access initiated. Operation complete.
        </div>
        <button type="button" className="vote-cta" onClick={onContinue}>
          VIEW DEBRIEF →
        </button>
      </div>
    </div>
  );
}
