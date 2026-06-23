"use client";

import { useEffect, useState } from "react";
import { M2Ambient, M2StatusBar } from "@/components/missions/m2/M2IntroChrome";
import { Card01Preview, Card02Preview, Card03Preview } from "@/components/missions/m2/M2ProtocolPreviews";

const CARDS = [
  {
    number: "01",
    title: "READ THE DISPUTE",
    desc: "Open the Governance Tribunal. Two departments claim the same dataset. Read both arguments before touching anything else.",
    Preview: Card01Preview,
  },
  {
    number: "02",
    title: "INSPECT THE EVIDENCE",
    desc: "Double-click the disputed file in the Data Registry. The File Inspector shows the Data Steward, lineage chain, and classification. Usually the steward settles it — but check it's verified first.",
    Preview: Card02Preview,
  },
  {
    number: "03",
    title: "RULE & VERIFY",
    desc: "Pick the correct owner in the Tribunal. Then answer two evidence questions in the verify panel — all answers are in the Inspector. Correct answers extract the token.",
    Preview: Card03Preview,
  },
];

/** Intro pages 2 + 3 — Mission Protocol (GSAP cards) and Launch (round2_v14 #page2/#page3). */
export function M2Protocol({ onBreach, onSkip }: { onBreach: () => void; onSkip: () => void }) {
  const [page, setPage] = useState<2 | 3>(2);
  const [activeCard, setActiveCard] = useState(0);
  const [breachUnlocked, setBreachUnlocked] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBreachUnlocked(true), 1400);
    return () => clearTimeout(t);
  }, []);

  const navigateCard = (dir: number) => {
    const next = activeCard + dir;
    if (next >= 0 && next <= 2) setActiveCard(next);
  };

  return (
    <div className="m2-mission">
      <M2Ambient />
      <M2StatusBar />

      {page === 2 && (
        <div className="page active" id="page2">
          <div className="page-eyebrow">{"// Mission 2 — Forging the Master Key"}</div>
          <div className="page-title">Mission Protocol</div>

          <div className="content">
            <div className="ops-section">
              <div className="section-label">{"// How to Breach"}</div>
              <div className="steps-grid">
                {CARDS.map((card, i) => (
                  <div key={card.number} className={`step-card${activeCard === i ? " active" : ""}`} data-card-index={i}>
                    <span className={`nav-arrow nav-left${i === 0 ? " hidden" : ""}`} onClick={() => navigateCard(-1)}>
                      ‹
                    </span>
                    <span className={`nav-arrow nav-right${i === 2 ? " hidden" : ""}`} onClick={() => navigateCard(1)}>
                      ›
                    </span>
                    <card.Preview active={activeCard === i} />
                    <div className="card-body">
                      <div className="step-number">{card.number}</div>
                      <div className="step-title">{card.title}</div>
                      <div className="step-desc">{card.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="detection-section">
              <div className="detection-card">
                <div className="detection-body">
                  <div className="detection-title">
                    THE DETECTION METER
                    <span className="detection-title-tag">
                      <i className="fas fa-exclamation-triangle" /> ACTIVE THREAT
                    </span>
                  </div>
                  <div className="detection-desc">
                    <p>Every mistake pushes the meter up. Hit 100% and MegaCorp closes the connection.</p>
                  </div>
                  <div className="detection-pills">
                    <span className="dpill dpill-high">Wrong ruling · +12%</span>
                    <span className="dpill dpill-high">Failed verification · +10%</span>
                    <span className="dpill dpill-mid">Hint requested · −100 pts</span>
                    <span className="dpill dpill-mid">Idle time · passive rise</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="button-section">
            <div className="button-label">{"// ready to breach?"}</div>
            <button
              className={`btn-next btn-sweep${breachUnlocked ? "" : " is-locked"}`}
              style={{ "--sweep-ms": "1400ms" } as React.CSSProperties}
              id="btn-breach"
              disabled={!breachUnlocked}
              onClick={() => setPage(3)}
            >
              <div className="btn-inner">
                <span>Breach the Desktop</span>
                <span className="btn-arrow">→</span>
              </div>
            </button>
          </div>
          <button id="skip-intro" onClick={onSkip}>
            SKIP INTRO →
          </button>
        </div>
      )}

      {page === 3 && (
        <div className="page active" id="page3">
          <div className="page-eyebrow">MISSION 02 — READY TO DEPLOY</div>
          <div className="page-title">Four Disputes. One Key.</div>
          <div className="content">
            <div style={{ animation: "fadeUp .6s .3s both" }}>
              <div className="section-label">OBJECTIVES</div>
              <div className="steps-grid">
                <div className="step-card active" style={{ borderColor: "rgba(247,148,33,.3)" }}>
                  <div className="step-number" style={{ color: "var(--orange)" }}>
                    4
                  </div>
                  <div className="step-title">OWNERSHIP DISPUTES</div>
                  <div className="step-desc">Resolve every conflict in the tribunal queue using evidence from the Dataset Inspector.</div>
                </div>
                <div className="step-card active" style={{ borderColor: "rgba(0,255,65,.3)" }}>
                  <div className="step-number" style={{ color: "var(--green)" }}>
                    4
                  </div>
                  <div className="step-title">DEPARTMENT TOKENS</div>
                  <div className="step-desc">CFO · COO · CTO · CCO — each unlocked by a correct ruling followed by passing two verification questions.</div>
                </div>
                <div className="step-card active" style={{ borderColor: "rgba(143,68,232,.5)" }}>
                  <div className="step-number" style={{ color: "var(--purple-light)" }}>
                    1
                  </div>
                  <div className="step-title">MASTER KEY</div>
                  <div className="step-desc">Compile all four tokens into the Master Key to gain vault access.</div>
                </div>
              </div>
            </div>
          </div>
          <div className="button-section">
            <div className="button-label">{"// ready to breach?"}</div>
            <button
              className="btn-next btn-sweep"
              style={{ "--sweep-ms": "1820ms" } as React.CSSProperties}
              onClick={onBreach}
            >
              <div className="btn-inner">
                BREACH THE DESKTOP <span className="btn-arrow">→</span>
              </div>
            </button>
          </div>
          <div className="page-nav-dots">
            <div className="pnd" />
            <div className="pnd" onClick={() => setPage(2)} />
            <div className="pnd active" />
          </div>
          <div className="slide-nav">
            <button className="snav-btn" onClick={() => setPage(2)}>
              ◄ PREV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
