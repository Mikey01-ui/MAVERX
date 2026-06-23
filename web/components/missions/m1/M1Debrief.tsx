"use client";

import Link from "next/link";
import { useEffect } from "react";
import { DEBRIEF } from "@/lib/game/m1/data";
import { useM1Game } from "@/lib/game/m1/context";
import { getDebriefRating, getDetectionClass } from "@/lib/game/m1/reducer";

type Props = {
  timer: string;
  onContinue: () => void;
};

export function M1Debrief({ timer, onContinue }: Props) {
  const { state, dispatch } = useM1Game();
  const det = Math.round(state.detection);
  const acc = state.errors === 0 ? 100 : Math.round((4 / (4 + state.errors)) * 100);
  const detClass = getDetectionClass(det).replace("det-", "det-");

  useEffect(() => {
    const max = 3 + DEBRIEF.pillars.length + 1;
    if (state.debriefReveal >= max) return;
    const t = setTimeout(() => dispatch({ type: "ADVANCE_DEBRIEF_REVEAL" }), 520);
    return () => clearTimeout(t);
  }, [state.debriefReveal, dispatch]);

  const show = (n: number) => state.debriefReveal >= n;

  return (
    <div id="debrief-screen" className="active">
      <div className="db-header">
        <div className="db-eyebrow">{DEBRIEF.eyebrow}</div>
        <h1 className="db-title">{DEBRIEF.title}</h1>
      </div>

      <div className="db-main">
        <div className="db-panel">
          <div className="db-panel-label">// MISSION REPORT</div>
          <div className="mr-metrics">
            <div className="mr-metric">
              <div className="mr-metric-val">{timer}</div>
              <div className="mr-metric-lbl">TIME ON MISSION</div>
            </div>
            <div className="mr-metric">
              <div className="mr-metric-val">{acc}%</div>
              <div className="mr-metric-lbl">ACCURACY</div>
            </div>
            <div className="mr-metric">
              <div className={`mr-metric-val ${detClass}`}>{det}%</div>
              <div className="mr-metric-lbl">DETECTION</div>
            </div>
            <div className="mr-metric">
              <div className="mr-metric-val">4/4</div>
              <div className="mr-metric-lbl">LEADS CONFIRMED</div>
            </div>
          </div>
          <div className="mr-detect">
            <div className="mr-detect-ttl">DETECTION BREAKDOWN</div>
            <div className="mr-detect-row">
              <span>Decoy files</span>
              <span>{Math.round(state.decoyDetection)}%</span>
            </div>
            <div className="mr-detect-row">
              <span>Wrong clicks</span>
              <span>{Math.round(state.clickDetection)}%</span>
            </div>
            <div className="mr-detect-row">
              <span>Verify errors</span>
              <span>{Math.round(state.verifyDetection)}%</span>
            </div>
            <div className="mr-detect-row">
              <span>Hints used</span>
              <span>{Math.round(state.hintDetection)}%</span>
            </div>
            <div className="mr-detect-row">
              <span>Passive sweep</span>
              <span>{Math.round(state.passiveDetection)}%</span>
            </div>
            <div className="mr-detect-row total">
              <span>Total</span>
              <span>{det}%</span>
            </div>
            <div className="mr-rating">{getDebriefRating(det)}</div>
          </div>
        </div>

        <div className="db-panel">
          <div className="db-panel-label">// TRADECRAFT</div>
          <div className="tc-content">
            {DEBRIEF.tradecraft.map((p, i) => (
              <div key={i} className={`tc-block${show(i + 1) ? " show" : ""}`}>
                <p>{p}</p>
              </div>
            ))}
            <div className="tc-pillars">
              {DEBRIEF.pillars.map((p, i) => (
                <div key={p.title} className={`tc-pillar${show(4 + i) ? " show" : ""}`}>
                  <div className="tc-pillar-tag">{p.tag}</div>
                  <div className="tc-pillar-ttl">{p.title}</div>
                  <div className="tc-pillar-txt">{p.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={`db-cta-row${show(7) ? " show" : ""}`}>
        <button
          type="button"
          className="db-cta btn-sweep"
          style={{ "--sweep-ms": "1820ms" } as React.CSSProperties}
          disabled={!show(7)}
          onClick={onContinue}
        >
          <span>{DEBRIEF.cta}</span>
        </button>
      </div>
      <Link href="/hub" className="mission-hub-link" style={{ display: "block", textAlign: "center", marginTop: 12, color: "var(--text)" }}>
        ← Hub
      </Link>
    </div>
  );
}
