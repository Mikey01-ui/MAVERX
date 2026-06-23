"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FinaleContent } from "@/lib/content";
import { MissionChrome } from "@/components/missions/MissionChrome";
import { calculateOperationTotalScore } from "@/lib/game/operationScore";

export type FinaleMissionScore = {
  missionId: string;
  label: string;
  name: string;
  score: number | null;
  status: string;
};

type FinaleScreenProps = {
  content: FinaleContent;
  email: string;
  initialOptIn: boolean;
  scores: FinaleMissionScore[];
  preview?: boolean;
};

export function FinaleScreen({ content, email, initialOptIn, scores }: FinaleScreenProps) {
  const router = useRouter();
  const [optIn, setOptIn] = useState(initialOptIn);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const totalScore = calculateOperationTotalScore(scores);

  async function handleContinue() {
    setSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/player/email-report", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optIn }),
      });
      const data = (await res.json()) as {
        email?: string;
        reportSent?: boolean;
        reportError?: string | null;
      };

      if (!res.ok) {
        setStatusMessage(data.reportError ?? "Could not save your email preference.");
        return;
      }

      if (data.reportSent && data.email) {
        setStatusMessage(`Your operation report was sent to ${data.email}.`);
        await new Promise((resolve) => setTimeout(resolve, 1400));
      } else if (optIn && data.reportError) {
        setStatusMessage(data.reportError);
        return;
      }

      router.push("/hub");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const hint = content.emailOptInHint.replace("{email}", email);

  return (
    <MissionChrome statusLeft={content.statusLeft} statusRight={content.statusRight}>
      <div className="finale-page mission-page mission-page--premission">
        <div className="mission-page-eyebrow">{content.eyebrow}</div>
        <h1 className="mission-page-title">{content.title}</h1>
        {totalScore !== null && (
          <div className="finale-total-score">
            <div className="finale-total-score-value">{totalScore}%</div>
            <div className="finale-total-score-label">{content.totalScoreLabel}</div>
          </div>
        )}

        <div className="finale-content">
          <div className="finale-card">
            <div className="finale-text">
              {content.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
              <div className="mission-pullquote">{content.pullquote}</div>
            </div>
          </div>

          <div className="finale-card">
            <div className="mission-section-label">{content.scoresLabel}</div>
            <div className="finale-scores">
              {scores.map((row) => (
                <div key={row.missionId} className="finale-score-cell">
                  <div className="finale-score-label">{row.label}</div>
                  <div
                    className={`finale-score-value${row.score === null ? " pending" : ""}`}
                    title={row.name}
                  >
                    {row.status === "completed" && row.score !== null ? `${row.score}%` : "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="finale-card">
            <button
              type="button"
              className={`finale-opt-in${optIn ? " is-checked" : ""}`}
              onClick={() => setOptIn((v) => !v)}
              aria-pressed={optIn}
            >
              <div className="finale-opt-in-box">
                <div className="finale-opt-in-tick" />
              </div>
              <div className="finale-opt-in-copy">
                <span className="finale-opt-in-label">{content.emailOptInLabel}</span>
                <span className="finale-opt-in-hint">{hint}</span>
              </div>
            </button>
          </div>

          <div className="finale-actions mission-btn-section mission-btn-section--premission">
            {statusMessage && <p className="finale-status">{statusMessage}</p>}
            <button
              type="button"
              className="mission-btn-next btn-sweep"
              style={{ "--sweep-ms": "1820ms" } as React.CSSProperties}
              disabled={submitting}
              onClick={() => void handleContinue()}
            >
              <span className="mission-btn-inner">
                <span>{submitting ? "Saving…" : content.continueLabel}</span>
                <span className="mission-btn-arrow">→</span>
              </span>
            </button>
            <p className="finale-footer">{content.footer}</p>
          </div>
        </div>
      </div>
    </MissionChrome>
  );
}
