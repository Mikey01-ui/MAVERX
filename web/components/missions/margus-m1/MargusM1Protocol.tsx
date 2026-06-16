"use client";

import { useEffect, useState } from "react";
import "./MargusM1Protocol.css";

interface ProtocolCardProps {
  number: string;
  title: string;
  description: string;
  isActive: boolean;
  onNavigate: (direction: "prev" | "next") => void;
}

function ProtocolCard({ number, title, description, isActive, onNavigate }: ProtocolCardProps) {
  return (
    <div className={`step-card ${isActive ? "active" : ""}`}>
      {isActive && (
        <>
          <span className="nav-arrow nav-left" onClick={() => onNavigate("prev")}>
            ‹
          </span>
          <span className="nav-arrow nav-right" onClick={() => onNavigate("next")}>
            ›
          </span>
        </>
      )}
      <div className="card-body">
        <div className="step-number">{number}</div>
        <div className="step-title">{title}</div>
        <div className="step-desc">{description}</div>
      </div>
    </div>
  );
}

interface MargusM1ProtocolProps {
  onContinue: () => void;
}

export function MargusM1Protocol({ onContinue }: MargusM1ProtocolProps) {
  const [activeCard, setActiveCard] = useState(0);
  const [continueEnabled, setContinueEnabled] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setContinueEnabled(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const cards = [
    {
      number: "01",
      title: "FOLLOW THE BOARD",
      description: "Progress through three locked leads in order: COMPUTE, FUNDING, PERSONNEL. Complete each lead to unlock the next.",
    },
    {
      number: "02",
      title: "INVESTIGATE THE DESKTOP",
      description: "Browse the files linked to the active lead and find the anomaly hiding in the data. When you spot it, click directly on it.",
    },
    {
      number: "03",
      title: "VERIFY THE INTEL",
      description: "Answer the verification question using what you've found. A correct answer locks the lead and advances the operation.",
    },
  ];

  const handleNavigate = (direction: "prev" | "next") => {
    if (direction === "prev" && activeCard > 0) {
      setActiveCard(activeCard - 1);
    } else if (direction === "next" && activeCard < cards.length - 1) {
      setActiveCard(activeCard + 1);
    }
  };

  return (
    <div className="margus-m1-protocol">
      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-left">
          <span>
            <span className="status-dot live" />
            TERMINAL ACTIVE
          </span>
          <span>OP-OMNI / v2.4.1</span>
        </div>
        <div className="status-right">
          <span>ENCRYPTED</span>
        </div>
      </div>

      {/* Ambient effects */}
      <div className="ambient-glow" />
      <div className="bg-grid" />
      <div className="scanlines" />

      {/* Corner marks */}
      <div className="corner corner--tl" />
      <div className="corner corner--tr" />
      <div className="corner corner--bl" />
      <div className="corner corner--br" />

      {/* Main content */}
      <div className="page active">
        <div className="page-eyebrow">Mission 01 · Identifying the Footprint</div>
        <div className="page-title">Mission Protocol</div>

        <div className="content">
          <div className="ops-section">
            <div className="section-label">// How to Breach</div>
            <div className="steps-grid">
              {cards.map((card, index) => (
                <ProtocolCard
                  key={index}
                  number={card.number}
                  title={card.title}
                  description={card.description}
                  isActive={activeCard === index}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="button-section">
          <button
            className={`btn-next btn-sweep ${!continueEnabled ? "is-locked" : ""}`}
            style={{ "--sweep-ms": "3000ms" } as React.CSSProperties}
            onClick={onContinue}
            disabled={!continueEnabled}
          >
            <div className="btn-inner">
              <span>Continue to Mission</span>
              <span className="btn-arrow">→</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
