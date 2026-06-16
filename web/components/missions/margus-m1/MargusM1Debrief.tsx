"use client";

import { useEffect, useState } from "react";
import { DEBRIEF, debriefRating } from "./gameData";
import type { GameStats } from "./MargusM1Game";
import "./styles.css";

export function MargusM1Debrief({ stats, onContinue }: { stats: GameStats; onContinue: () => void }) {
  const [reveal, setReveal] = useState(0); // 0..(3 blocks + 3 pillars + 1 cta)
  const m = String(Math.floor(stats.timerSec / 60)).padStart(2, "0");
  const s = String(stats.timerSec % 60).padStart(2, "0");
  const acc = stats.errors === 0 ? 100 : Math.round((4 / (4 + stats.errors)) * 100);
  const d = Math.min(100, Math.round(stats.detection));
  const detClass = d < 30 ? "det-green" : d < 60 ? "det-amber" : "det-red";
  const pFmt = (n: number) => Math.min(100, Math.round(n)) + "%";

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    [180, 480, 780].forEach((t, i) => timers.push(setTimeout(() => setReveal((r) => Math.max(r, i + 1)), t)));
    DEBRIEF.pillars.forEach((_, i) => timers.push(setTimeout(() => setReveal((r) => Math.max(r, 4 + i)), 1080 + i * 130)));
    timers.push(setTimeout(() => setReveal((r) => Math.max(r, 7)), 1080 + DEBRIEF.pillars.length * 130 + 350));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="margus-m1-game-root">
      <div id="debrief-screen" className="active">
        <div className="db-header">
          <div className="page-eyebrow">{DEBRIEF.eyebrow}</div>
          <div className="page-title">{DEBRIEF.title}</div>
        </div>

        <div className="db-main">
          <div className="db-panel">
            <div className="db-panel-label">// MISSION REPORT</div>
            <div className="mr-metrics">
              <div className="mr-metric"><div className="mr-metric-val">{m}:{s}</div><div className="mr-metric-lbl">TIME</div></div>
              <div className="mr-metric"><div className="mr-metric-val">{acc}%</div><div className="mr-metric-lbl">ACCURACY</div></div>
              <div className="mr-metric"><div className={`mr-metric-val ${detClass}`}>{pFmt(d)}</div><div className="mr-metric-lbl">DETECTION</div></div>
              <div className="mr-metric"><div className="mr-metric-val">{stats.hintsUsed}</div><div className="mr-metric-lbl">HINTS USED</div></div>
            </div>
            <div className="mr-detect">
              <div className="mr-detect-ttl">DETECTION BREAKDOWN</div>
              <div className="mr-detect-row"><span>Passive exposure (time)</span><span style={{ color: "var(--amber)" }}>+{pFmt(stats.passive)}</span></div>
              <div className="mr-detect-row"><span>Wrong file interactions</span><span style={{ color: "var(--red)" }}>+{pFmt(stats.decoy)}</span></div>
              <div className="mr-detect-row"><span>Wrong data clicks</span><span style={{ color: "var(--red)" }}>+{pFmt(stats.click)}</span></div>
              <div className="mr-detect-row"><span>Failed verifications</span><span style={{ color: "var(--red)" }}>+{pFmt(stats.verify)}</span></div>
              <div className="mr-detect-row"><span>Hints requested</span><span style={{ color: "var(--red)" }}>+{pFmt(stats.hint)}</span></div>
              <div className="mr-detect-row total"><span>Final detection level</span><span className={detClass}>{pFmt(d)}</span></div>
              <div className="mr-rating">{debriefRating(d)}</div>
            </div>
          </div>

          <div className="db-panel">
            <div className="db-panel-label">// TRADECRAFT · VOSS</div>
            <div className="tc-content">
              {DEBRIEF.tradecraft.map((p, i) => (
                <div key={i} className={`tc-block${reveal >= i + 1 ? " show" : ""}`}>
                  <p dangerouslySetInnerHTML={{ __html: p }} />
                </div>
              ))}
              <div className="tc-pillars">
                {DEBRIEF.pillars.map((p, i) => (
                  <div key={p.title} className={`tc-pillar${reveal >= 4 + i ? " show" : ""}`}>
                    <div className="tc-pillar-tag">{p.tag}</div>
                    <div className="tc-pillar-ttl">{p.title}</div>
                    <div className="tc-pillar-txt">{p.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="db-cta-row show">
          <button className="db-cta btn-sweep" style={{ "--sweep-ms": "1820ms" } as React.CSSProperties} disabled={reveal < 7} onClick={onContinue}><span>{DEBRIEF.cta}</span></button>
        </div>
      </div>
    </div>
  );
}
