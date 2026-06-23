"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type DebriefMetric = {
  value: string;
  label: string;
  valueClass?: string;
};

export type DebriefRow = {
  label: string;
  value: string;
  valueClass?: string;
  total?: boolean;
};

export type DebriefBlock = {
  html: string;
};

export type DebriefLearningRow = {
  who: string;
  text: string;
  ok: boolean;
};

export type MissionDebriefConfig = {
  eyebrow: string;
  title: string;
  metrics: DebriefMetric[];
  breakdownTitle: string;
  breakdownRows: DebriefRow[];
  rating: string;
  tradecraft: DebriefBlock[];
  learningRows?: DebriefLearningRow[];
  learningTitle?: string;
  cta: string;
};

type Props = {
  config: MissionDebriefConfig;
  onContinue: () => void;
  hubLink?: boolean;
};

export function MissionDebriefScreen({ config, onContinue, hubLink = true }: Props) {
  const [reveal, setReveal] = useState(0);
  const totalSteps = config.tradecraft.length + (config.learningRows?.length ? 1 : 0) + 1;

  useEffect(() => {
    if (reveal >= totalSteps) return;
    const t = setTimeout(() => setReveal((r) => r + 1), 520);
    return () => clearTimeout(t);
  }, [reveal, totalSteps]);

  const show = (n: number) => reveal >= n;

  return (
    <div id="debrief-screen" className="active">
      <div className="db-header">
        <div className="deb-eyebrow">{config.eyebrow}</div>
        <h1 className="deb-title db-title">{config.title}</h1>
      </div>

      <div className="db-main">
        <div className="db-panel">
          <div className="db-panel-label">// MISSION REPORT</div>
          <div className="mr-metrics">
            {config.metrics.map((m) => (
              <div key={m.label} className="mr-metric">
                <div className={`mr-metric-val${m.valueClass ? ` ${m.valueClass}` : ""}`}>{m.value}</div>
                <div className="mr-metric-lbl">{m.label}</div>
              </div>
            ))}
          </div>
          <div className="mr-detect">
            <div className="mr-detect-ttl">{config.breakdownTitle}</div>
            {config.breakdownRows.map((row) => (
              <div key={row.label} className={`mr-detect-row${row.total ? " total" : ""}`}>
                <span>{row.label}</span>
                <span className={row.valueClass} dangerouslySetInnerHTML={{ __html: row.value }} />
              </div>
            ))}
            <div className="mr-rating">{config.rating}</div>
          </div>
        </div>

        <div className="db-panel">
          <div className="db-panel-label">// TRADECRAFT</div>
          <div className="tc-content">
            {config.tradecraft.map((block, i) => (
              <div key={i} className={`tc-block${show(i + 1) ? " show" : ""}`}>
                <p dangerouslySetInnerHTML={{ __html: block.html }} />
              </div>
            ))}
            {config.learningRows && config.learningRows.length > 0 && (
              <div className={`tc-block tc-learning${show(config.tradecraft.length + 1) ? " show" : ""}`}>
                <div className="tc-learning-ttl">{config.learningTitle ?? "WHAT EACH CHALLENGE ACTUALLY TESTED"}</div>
                <div id="tc-learning-rows">
                  {config.learningRows.map((row) => (
                    <div key={row.who} className="tc-lrn-row">
                      <div className={`tc-lrn-dot ${row.ok ? "ok" : "no"}`}>{row.ok ? "✓" : "✕"}</div>
                      <div className="tc-lrn-body">
                        <div className="tc-lrn-who">{row.who}</div>
                        <div className="tc-lrn-txt" dangerouslySetInnerHTML={{ __html: row.text }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`db-cta-row${show(totalSteps) ? " show" : ""}`}>
        <button
          type="button"
          className="db-cta btn-sweep"
          style={{ "--sweep-ms": "1820ms" } as React.CSSProperties}
          disabled={!show(totalSteps)}
          onClick={onContinue}
        >
          <span>{config.cta}</span>
        </button>
      </div>
      {hubLink && (
        <Link href="/hub" className="mission-hub-link" style={{ display: "block", textAlign: "center", marginTop: 12, color: "var(--text)" }}>
          ← Hub
        </Link>
      )}
    </div>
  );
}
