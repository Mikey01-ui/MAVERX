"use client";

import { useEffect, useState } from "react";

const HINTS = [
  "Part 1 — Click the pulsing gate to inspect purpose, inputs, and bottleneck.",
  "Part 2 — Drag the matching dataset onto the gate. Purple ring = drop zone.",
  "Demo complete — correct drop greens the arrow. Live detection starts at 0%; wrong drops, hints, and time raise it.",
];

type DemoPhase = 0 | 1 | 2 | 3;

export function M4ProtocolDemo() {
  const [phase, setPhase] = useState<DemoPhase>(0);
  const [popVisible, setPopVisible] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dropped, setDropped] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const run = () => {
      setPhase(0);
      setPopVisible(false);
      setDragging(false);
      setDropped(false);
      timers.push(setTimeout(() => setPopVisible(true), 900));
      timers.push(setTimeout(() => setPhase(1), 900));
      timers.push(setTimeout(() => setDragging(true), 2400));
      timers.push(setTimeout(() => setPhase(2), 2400));
      timers.push(setTimeout(() => {
        setDragging(false);
        setDropped(true);
        setPhase(3);
      }, 3600));
      timers.push(setTimeout(run, 6200));
    };
    run();
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div id="r4-demo-panel" className="m4-protocol-demo">
      <div className="r4-demo-phase-row">
        <span className={`r4-demo-phase${phase >= 2 ? " r4-demo-phase-2" : ""}`}>
          {phase >= 2 ? "02 · ROUTE" : "01 · INSPECT"}
        </span>
      </div>
      <p className="demo-step-hint">{HINTS[Math.min(phase, HINTS.length - 1)]}</p>
      <div className="r4-demo-stage">
        <div className={`r4-demo-pop${popVisible ? "" : " hidden"}`}>
          <div className="r4-demo-pop-h">Step details</div>
          <div className="r4-demo-pop-t">Offer Letter Review</div>
          <div className="r4-demo-pop-lane">
            <i className="fas fa-building" aria-hidden /> Legal &amp; Compliance
          </div>
          <div className="r4-demo-pop-section">
            <span className="r4-demo-pop-label">Expects:</span> Offer letter, NDA, IP clauses
          </div>
        </div>
        <div className="r4-demo-right">
          <div className="r4-demo-flow">
            <div className={`r4-demo-node r4-dnode-legal avail${popVisible ? " sel" : ""}${dropped ? " done" : ""}${dragging && !dropped ? " drag-target" : ""}`}>
              <div className="r4-demo-node-box">
                <i className="fas fa-file-signature" aria-hidden />
              </div>
              <span className="r4-demo-node-label">Offer</span>
            </div>
            <div className={`r4-demo-edge${dropped ? " done" : ""}`}>
              <svg viewBox="0 0 40 24" preserveAspectRatio="none">
                <path d="M0,12 L40,12" />
              </svg>
            </div>
            <div className="r4-demo-node r4-dnode-it locked">
              <div className="r4-demo-node-box">
                <i className="fas fa-fingerprint" aria-hidden />
              </div>
              <span className="r4-demo-node-label">Identity</span>
            </div>
            <div className="r4-demo-edge">
              <svg viewBox="0 0 40 24" preserveAspectRatio="none">
                <path d="M0,12 L40,12" />
              </svg>
            </div>
            <div className="r4-demo-node r4-dnode-hr locked">
              <div className="r4-demo-node-box">
                <i className="fas fa-user-check" aria-hidden />
              </div>
              <span className="r4-demo-node-label">Background</span>
            </div>
          </div>
          <div className="r4-demo-datasets-hdr">Available datasets</div>
          <div className="r4-demo-cards">
            <div className={`r4-demo-card r4-dcard-legal${dragging ? " drag" : ""}${dropped ? " used" : ""}`}>
              <div className="r4-demo-card-row">
                <span className="r4-demo-card-ico">📄</span>
                <span className="r4-demo-card-name">Internal_Policy_Review.md</span>
              </div>
              <span className="r4-demo-card-desc">NDA_Clause, IP_Assignment</span>
            </div>
            <div className="r4-demo-card r4-dcard-it">
              <div className="r4-demo-card-row">
                <span className="r4-demo-card-ico">📄</span>
                <span className="r4-demo-card-name">Session_Traffic_Log.dat</span>
              </div>
              <span className="r4-demo-card-desc">session_id, 2fa_verified</span>
            </div>
          </div>
        </div>
      </div>
      <div className="r4-demo-coh" aria-label="Handoff detection">
        <span className="r4-demo-coh-label">DETECTION</span>
        <div className="r4-demo-coh-bar">
          <div className="r4-demo-coh-fill" style={{ width: "0%" }} />
        </div>
        <span>0%</span>
      </div>
    </div>
  );
}
