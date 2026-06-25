"use client";

import { useEffect, useState } from "react";
import type { CrewId } from "@/lib/game/m5/types";

type Props = {
  active: boolean;
  ships: boolean;
  commits: number;
  crewState: Record<CrewId, { status: string }>;
  onSkip: () => void;
};

const CREW_NODES = [
  { id: "zex" as const, lbl: "ZEX", x: 80, y: 70, col: "#f79421" },
  { id: "atlas" as const, lbl: "ATLAS", x: 440, y: 70, col: "#00c41c" },
  { id: "nova" as const, lbl: "NOVA", x: 80, y: 250, col: "#d31972" },
  { id: "kade" as const, lbl: "KADE", x: 440, y: 250, col: "#8f44e8" },
];

export function M5SynthOverlay({ active, ships, commits, crewState, onSkip }: Props) {
  const [label, setLabel] = useState("");
  const [showCenter, setShowCenter] = useState(false);

  useEffect(() => {
    if (!active) {
      setShowCenter(false);
      setLabel("");
      return;
    }
    setShowCenter(false);
    setLabel("");
    const t1 = setTimeout(() => setShowCenter(true), 1800);
    const t2 = setTimeout(() => {
      setLabel(ships ? "✓ OPERATION SHIPS — VAULT ACCESS GRANTED" : "✗ MISSION FAILED — THRESHOLD NOT MET");
    }, 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active, ships]);

  if (!active) return null;

  const cx = 260;
  const cy = 160;

  return (
    <div
      id="synth-overlay"
      className="active"
      role="button"
      tabIndex={0}
      onClick={onSkip}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSkip();
      }}
      aria-label="Continue to debrief card"
    >
      <svg id="synth-svg" viewBox="0 0 520 320" width="520" height="320" style={{ pointerEvents: "none" }}>
        <defs>
          <filter id="sg2">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {CREW_NODES.map((n) => {
          const committed = crewState[n.id]?.status === "committed";
          const col = committed ? n.col : "rgba(100,100,100,.4)";
          return (
            <g key={n.id}>
              <line x1={n.x} y1={n.y} x2={cx} y2={cy} stroke={col} strokeWidth={committed ? 2 : 1} filter="url(#sg2)" className="synth-line" />
              <circle cx={n.x} cy={n.y} r={28} fill={committed ? "rgba(0,0,0,.4)" : "rgba(0,0,0,.2)"} stroke={col} strokeWidth={1.5} filter="url(#sg2)" />
              <text x={n.x} y={n.y + 3} textAnchor="middle" fill={col} fontSize={9} fontWeight={600}>
                {n.lbl}
              </text>
              {committed && (
                <text x={n.x} y={n.y + 16} textAnchor="middle" fill={col} fontSize={8}>
                  COMMITTED
                </text>
              )}
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={showCenter ? 42 : 0} fill={ships ? "rgba(0,255,65,.08)" : "rgba(211,25,114,.08)"} stroke={ships ? "#00FF41" : "#d31972"} strokeWidth={2} filter="url(#sg2)" style={{ transition: "r 0.6s ease" }} />
        {showCenter && (
          <text x={cx} y={cy + 5} textAnchor="middle" fill={ships ? "#00FF41" : "#d31972"} fontSize={11} fontWeight={700}>
            {commits}/4 COMMITTED
          </text>
        )}
      </svg>
      <div id="synth-label" className="show" style={{ color: ships ? "var(--green-matrix)" : "var(--pink)" }}>
        {label}
      </div>
      <p className="synth-skip-hint">Click anywhere to continue</p>
    </div>
  );
}
