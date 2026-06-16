"use client";

import { useEffect, useState } from "react";
import type { MissionIntro } from "@/lib/content";

type BriefPhaseProps = {
  brief: MissionIntro["brief"];
  onContinue: () => void;
};

export function BriefPhase({ brief, onContinue }: BriefPhaseProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [acked, setAcked] = useState(!brief.ackGateLabel);
  const isPremission = brief.params.length > 0;
  const encryptedLabel = brief.encryptedChannel ?? "VOSS";
  const canContinue = unlocked && acked;

  useEffect(() => {
    const timer = setTimeout(() => setUnlocked(true), brief.continueDelayMs);
    return () => clearTimeout(timer);
  }, [brief.continueDelayMs]);

  return (
    <div className={`mission-page${isPremission ? " mission-page--premission" : ""}`}>
      <div className="mission-page-eyebrow">{brief.eyebrow}</div>
      <h1 className="mission-page-title">{brief.title}</h1>

      <div className="mission-content">
        {brief.params.length > 0 && (
          <div className="mission-params mission-params--five">
            {brief.params.map((cell) => (
              <div key={cell.label} className="mission-param-cell">
                <div className="mission-param-label">{cell.label}</div>
                <div className="mission-param-value">{cell.value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="mission-brief-grid">
          <div className="mission-brief-col">
            <div className="mission-brief-section">
              <div className="mission-section-label">// Intelligence Brief</div>
              <div className="mission-brief-card">
                <div className="mission-brief-scanlines" aria-hidden="true" />
                <div className="mission-encrypted">
                  <span className="mission-encrypted-dot" />
                  {encryptedLabel}
                </div>
                <div className="mission-brief-text">
                  {brief.briefParagraphs.map((paragraph) =>
                    brief.useHtml ? (
                      <p key={paragraph.slice(0, 32)} dangerouslySetInnerHTML={{ __html: paragraph }} />
                    ) : (
                      <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                    )
                  )}
                  <div className="mission-pullquote">{brief.pullquote}</div>
                </div>
              </div>
            </div>
          </div>

          {brief.dossier.length > 0 && (
            <div className="mission-dossier-col">
              <div className="mission-brief-section">
                <div className="mission-section-label">// Dossier</div>
                <div className="mission-dossier-backdrop">
                  {brief.dossier.map((card) => (
                    <div key={card.label} className="mission-dossier-card">
                      <div className="mission-dossier-label">{card.label}</div>
                      <div className="mission-dossier-name">{card.name}</div>
                      <div className="mission-dossier-role">{card.role}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {brief.ackGateLabel && (
          <button
            type="button"
            id="ack-gate"
            className={`ack-gate${acked ? " is-checked" : ""}`}
            onClick={() => setAcked(true)}
          >
            <div className="ack-box">
              <div className="ack-tick" />
            </div>
            {brief.ackGateLabel}
          </button>
        )}
      </div>

      <div className={`mission-btn-section${isPremission ? " mission-btn-section--premission" : ""}`}>
        <button
          type="button"
          className={`mission-btn-next${brief.ghostContinue ? " mission-btn-next--ghost" : ""}${canContinue ? "" : " is-locked"}`}
          disabled={!canContinue}
          onClick={onContinue}
        >
          <span className="mission-btn-inner">
            <span>{brief.continueLabel}</span>
            <span className="mission-btn-arrow">→</span>
          </span>
        </button>
      </div>
    </div>
  );
}
