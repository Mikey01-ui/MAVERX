"use client";

import { useState, useEffect } from "react";
import "./MargusM1Brief.css";

interface GlossItem {
  text: string;
  tooltip: string;
}

interface MargusM1BriefProps {
  onContinue: () => void;
}

export function MargusM1Brief({ onContinue }: MargusM1BriefProps) {
  const [continueEnabled, setContinueEnabled] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setContinueEnabled(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const glossItems: { [key: string]: string } = {
    "Project OMNI": "MegaCorp's covert AI program. Currently denied; this mission is the first attempt to prove its existence.",
    "Evidence Board": "Your case file. Confirmed leads land here. Reaches Zex at mission end.",
    Zex: "Infiltration specialist. Won't commit without confirmed proof.",
    "Footprint Dossier": "The evidence chain Zex needs to commit. Compute, funding, and personnel bound into one indictment. The artifact that carries forward to the next mission.",
    "The mirror": "Read-only shadow of Marshall's desktop. Unstable, time-limited, raises detection on overuse.",
  };

  return (
    <div className="margus-m1-brief">
      {/* Ambient background effects */}
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
        <div className="page-title">Pre-Mission Brief</div>

        <div className="content">
          {/* Mission Parameters */}
          <div className="mission-params">
            <div className="mp-cell">
              <div className="mp-label">// Window</div>
              <div className="mp-value">20:00</div>
            </div>
            <div className="mp-cell">
              <div className="mp-label">// Detection Ceiling</div>
              <div className="mp-value">100%</div>
            </div>
            <div className="mp-cell">
              <div className="mp-label">// Leads to Confirm</div>
              <div className="mp-value">3</div>
            </div>
            <div className="mp-cell">
              <div className="mp-label">// Carry Forward Artifact</div>
              <div className="mp-value">FOOTPRINT DOSSIER</div>
            </div>
            <div className="mp-cell">
              <div className="mp-label">// Outcome</div>
              <div className="mp-value">ZEX COMMITS</div>
            </div>
          </div>

          {/* Brief and Dossier Grid */}
          <div className="brief-grid">
            {/* Left: Intelligence Brief */}
            <div className="brief-col">
              <div className="brief-section">
                <div className="section-label">// Intelligence Brief</div>
                <div className="brief-card">
                  <div className="brief-scanlines" />
                  <div className="encrypted-indicator">
                    <span className="encrypted-dot" />
                    VOSS
                  </div>
                  <div className="brief-text" id="brief-text">
                    <p>
                      I got you a window. Not a breach, not control. Just fragile temporary access to one executive
                      desktop, and every second is borrowed time.
                    </p>
                    <p>
                      Your job: prove that{" "}
                      <span className="gloss" title={glossItems["Project OMNI"]}>
                        Project OMNI
                      </span>{" "}
                      exists. The evidence is buried across departments, scattered in forms that were never meant to
                      connect. Find those fragments and turn them into a pattern MegaCorp can no longer hide.
                    </p>
                    <p>
                      Everything you confirm goes onto the{" "}
                      <span className="gloss" title={glossItems["Evidence Board"]}>
                        Evidence Board
                      </span>
                      . By the end of this mission, the picture has to stand on its own. Not suspicion. Not instinct.
                      Proof.
                    </p>
                    <p>
                      <span className="gloss gloss-left" title={glossItems["Zex"]}>
                        Zex
                      </span>{" "}
                      is watching. She won't commit to a mission built on guesswork. If OMNI has no confirmed footprint,
                      she walks. What you assemble becomes the{" "}
                      <span className="gloss" title={glossItems["Footprint Dossier"]}>
                        <strong>Footprint Dossier</strong>
                      </span>
                      : compute, funding, personnel, bound into one indictment, signed by Zex. That is the artifact
                      that carries forward.
                    </p>
                    <p>
                      Work clean.{" "}
                      <span className="gloss" title={glossItems["The mirror"]}>
                        The mirror
                      </span>{" "}
                      is read-only, unstable, one wrong stretch from detection.
                    </p>
                    <div className="pullquote">Find the footprint. Build the case.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Dossier */}
            <div className="dossier-col">
              <div className="brief-section" style={{ height: "100%" }}>
                <div className="section-label">// Dossier</div>
                <div className="dossier-backdrop">
                  <div className="dossier-card">
                    <div className="dc-label">TARGET</div>
                    <div className="dc-name">MegaCorp</div>
                    <div className="dc-role">Global conglomerate · the institution burying OMNI</div>
                  </div>
                  <div className="dossier-card">
                    <div className="dc-label">OBJECTIVE</div>
                    <div className="dc-name">Confirm Footprint</div>
                    <div className="dc-role">Three traces, one indictment</div>
                  </div>
                  <div className="dossier-card">
                    <div className="dc-label">PROSPECT</div>
                    <div className="dc-name">Zex</div>
                    <div className="dc-role">Infiltration · conditional on proof</div>
                  </div>
                </div>
              </div>
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
              <span>Continue</span>
              <span className="btn-arrow">→</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
