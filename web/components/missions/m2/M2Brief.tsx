"use client";

import { useEffect, useState } from "react";
import { Gloss } from "@/components/missions/shared/GlossTip";
import { M2StatusBar, M2Ambient } from "@/components/missions/m2/M2IntroChrome";

const G = (text: string, children: string) => (
  <Gloss scopeClass="m2-mission" text={text}>
    {children}
  </Gloss>
);

/** Intro page 1 — Pre-Mission Brief (round2_v14 #page1). */
export function M2Brief({ onContinue, onSkip }: { onContinue: () => void; onSkip: () => void }) {
  const [unlocked, setUnlocked] = useState(false);

  // Continue auto-unlocks after 3s — gives time to read the brief.
  useEffect(() => {
    const t = setTimeout(() => setUnlocked(true), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="m2-mission">
      <M2Ambient />
      <M2StatusBar />

      <div className="page active" id="page1">
        <div className="page-eyebrow">{"// Mission 2 — Forging the Master Key"}</div>
        <div className="page-title">Pre-Mission Brief</div>

        <div className="content">
          <div className="mission-params">
            <div className="mp-cell">
              <div className="mp-label">{"// Window"}</div>
              <div className="mp-value">20:00</div>
            </div>
            <div className="mp-cell">
              <div className="mp-label">{"// Detection Ceiling"}</div>
              <div className="mp-value">100%</div>
            </div>
            <div className="mp-cell">
              <div className="mp-label">{"// Disputes to Settle"}</div>
              <div className="mp-value">4</div>
            </div>
            <div className="mp-cell">
              <div className="mp-label">{"// Governance Access"}</div>
              <div className="mp-value">READ-ONLY / UNSTABLE</div>
            </div>
            <div className="mp-cell">
              <div className="mp-label">{"// Outcome"}</div>
              <div className="mp-value">ATLAS COMMITS</div>
            </div>
          </div>

          <div className="brief-grid">
            <div className="brief-col">
              <div className="brief-section">
                <div className="section-label">{"// Intelligence Brief"}</div>
                <div className="brief-card">
                  <div className="brief-scanlines" />
                  <div className="encrypted-indicator">
                    <span className="encrypted-dot" />
                    VOSS
                  </div>
                  <div className="brief-text">
                    <p>
                      Mission one is done. The footprint is mapped — compute, funding, personnel, payload, all pointing at
                      the same dead zone. <strong>OMNI is real.</strong> Now we need inside access.
                    </p>
                    <p>
                      Marshall&apos;s{" "}
                      {G(
                        "MegaCorp's internal data ownership registry. Still live. Contains unresolved disputes we can exploit.",
                        "governance system"
                      )}{" "}
                      is still running. Buried in it is a composite vault key, split across four department access tokens.
                      Each token is locked behind an unresolved ownership conflict — two departments claiming the same
                      dataset, both arguments sounding reasonable. One is wrong.
                    </p>
                    <p>
                      Your job is to settle each dispute using the evidence. The{" "}
                      {G(
                        "The person formally accountable for a dataset in the registry — but only when the entry is verified. An auto-filled or unverified steward is not authoritative.",
                        "verified Data Steward"
                      )}
                      , the{" "}
                      {G(
                        "The chain of systems a dataset has passed through. Shows origin and transformation — not the same as ownership.",
                        "lineage chain"
                      )}
                      , and the{" "}
                      {G(
                        "The governance label on a dataset. Can name the governing function or a regulation that overrides platform ownership.",
                        "classification"
                      )}{" "}
                      tell the real story. But read carefully — not every field can be trusted at face value. One of these
                      registries has been tampered with or left half-filled.
                    </p>
                    <p>
                      {G(
                        "Data governance specialist. Won't commit without correctly resolved disputes — he needs clean evidence the governance system can be trusted.",
                        "Atlas"
                      )}{" "}
                      is running point on this one. He will not commit to the next phase unless every dispute is settled by
                      evidence, not assumption. Resolve all four, compile the key, and we&apos;re through.
                    </p>
                    <p>
                      What you produce becomes the <strong>Master Key</strong> — four tokens synthesised into one vault
                      credential. That is the artifact that carries forward.
                    </p>
                    <div className="pullquote">Trust the evidence — but verify the evidence first.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="dossier-col">
              <div className="brief-section" style={{ height: "100%" }}>
                <div className="section-label">{"// Dossier"}</div>
                <div className="dossier-backdrop">
                  <div className="dossier-card">
                    <div className="dc-label">TARGET</div>
                    <div className="dc-name">Robert Marshall</div>
                    <div className="dc-role">SVP Strategy · desktop breached in Op 1</div>
                  </div>
                  <div className="dossier-card">
                    <div className="dc-label">HANDLER</div>
                    <div className="dc-name">Voss</div>
                    <div className="dc-role">Analyst · encrypted channel</div>
                  </div>
                  <div className="dossier-card">
                    <div className="dc-label">SPECIALIST</div>
                    <div className="dc-name">Atlas</div>
                    <div className="dc-role">Data governance · conditional on proof</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="button-section">
          <button
            className={`btn-next btn-sweep${unlocked ? "" : " is-locked"}`}
            style={{ "--sweep-ms": "3000ms" } as React.CSSProperties}
            id="btn-continue"
            disabled={!unlocked}
            onClick={onContinue}
          >
            <div className="btn-inner">
              <span>Continue</span>
              <span className="btn-arrow">→</span>
            </div>
          </button>
        </div>
        <button id="skip-intro" onClick={onSkip}>
          SKIP INTRO →
        </button>
      </div>
    </div>
  );
}
