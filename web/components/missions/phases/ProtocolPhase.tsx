"use client";

import { useEffect, useState } from "react";
import type { MissionIntro } from "@/lib/content";

type ProtocolPhaseProps = {
  protocol: MissionIntro["protocol"];
  onBreach: () => void;
  showAllSteps?: boolean;
  hideBreachButton?: boolean;
};

function pillClass(variant: string) {
  if (variant === "low") return "mission-dpill mission-dpill--low";
  if (variant === "mid") return "mission-dpill mission-dpill--mid";
  if (variant === "high") return "mission-dpill mission-dpill--high";
  return "mission-dpill mission-dpill--hint";
}

export function ProtocolPhase({
  protocol,
  onBreach,
  showAllSteps = false,
  hideBreachButton = false,
}: ProtocolPhaseProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [breachUnlocked, setBreachUnlocked] = useState(protocol.steps.length === 0);
  const hasM3Protocol = protocol.steps.some((s) => s.title.includes("WALL") || s.title.includes("RELEASE"));

  useEffect(() => {
    if (protocol.steps.length === 0) return;
    const timer = setTimeout(() => setBreachUnlocked(true), 1400);
    return () => clearTimeout(timer);
  }, [protocol.steps.length]);

  const detectionParagraphs =
    protocol.detection?.paragraphs ??
    (protocol.detection?.description ? [protocol.detection.description] : []);

  return (
    <div className={`mission-page mission-page--protocol${hasM3Protocol ? " mission-page--m3-protocol" : ""}`}>
      <div className="mission-page-eyebrow">{protocol.eyebrow}</div>
      <h1 className="mission-page-title">{protocol.title}</h1>

      <div className="mission-content mission-content--protocol">
        <div className="mission-ops-section">
          <div className="mission-section-label">{protocol.sectionLabel}</div>

          {protocol.steps.length > 0 && (
            <>
              {!showAllSteps && (
                <div className="mission-step-nav">
                  {protocol.steps.map((step, index) => (
                    <button
                      key={step.number}
                      type="button"
                      className={index === activeStep ? "active" : ""}
                      onClick={() => setActiveStep(index)}
                    >
                      {step.number}
                    </button>
                  ))}
                </div>
              )}
              <div className="mission-steps-grid">
                {protocol.steps.map((step, index) => (
                  <div
                    key={step.number}
                    className={`mission-step-card${showAllSteps || index === activeStep ? " active" : ""}`}
                  >
                    <div className="mission-step-number">{step.number}</div>
                    <div className="mission-step-title">{step.title}</div>
                    <div
                      className="mission-step-desc"
                      dangerouslySetInnerHTML={{ __html: step.description }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {protocol.atlasNote && (
            <p className="mission-atlas-note" dangerouslySetInnerHTML={{ __html: protocol.atlasNote }} />
          )}
        </div>

        {protocol.detection && (
          <div className="mission-detection-section">
            <div className="mission-detection-card">
              <div className="mission-detection-body">
                <div className="mission-detection-title">
                  {protocol.detection.title}
                  <span className="mission-detection-tag">
                    <i className="fas fa-user-shield" aria-hidden /> {protocol.detection.tag}
                  </span>
                </div>
                <div className="mission-detection-desc">
                  {detectionParagraphs.map((p) => (
                    <p key={p.slice(0, 24)} dangerouslySetInnerHTML={{ __html: p }} />
                  ))}
                </div>
                <div className="mission-detection-pills">
                  {protocol.detection.pills.map((pill) => {
                    if (typeof pill === "string") {
                      return (
                        <span key={pill} className="mission-detection-pill">
                          {pill}
                        </span>
                      );
                    }
                    return (
                      <span key={pill.text} className={pillClass(pill.variant)}>
                        {pill.text}
                      </span>
                    );
                  })}
                </div>
                <div className="mission-detection-hint-row">
                  <i className="fas fa-lightbulb mission-dh-icon" aria-hidden />
                  <div className="mission-dh-body">
                    <p
                      className="mission-dh-text"
                      dangerouslySetInnerHTML={{ __html: protocol.detection.hint }}
                    />
                    {protocol.detection.hintPills && protocol.detection.hintPills.length > 0 && (
                      <div className="mission-dh-pills">
                        {protocol.detection.hintPills.map((hp) => (
                          <span key={hp} className="mission-dpill mission-dpill--hint">
                            {hp}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {!hideBreachButton && (
        <div className="mission-btn-section">
          <div className="mission-btn-label">{protocol.breachReadyLabel}</div>
          <button
            type="button"
            className={`mission-btn-next btn-sweep${breachUnlocked ? "" : " is-locked"}`}
            style={{ "--sweep-ms": "1400ms" } as React.CSSProperties}
            disabled={!breachUnlocked}
            onClick={onBreach}
          >
            {protocol.breachLabel} →
          </button>
        </div>
      )}
    </div>
  );
}
