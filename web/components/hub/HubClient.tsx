"use client";

import Link from "next/link";
import type { HubContent, MissionMeta } from "@/lib/content";
import { restartGameAction, signOutAction } from "@/app/(protected)/hub/actions";

type SerializedProgress = {
  missionId: string;
  status: string;
  checkpoint: string | null;
  stateJson: Record<string, unknown> | null;
  score: number | null;
  updatedAt: string;
};

type ContinueMission = {
  id: string;
  name: string;
  label: string;
  checkpoint: string;
  url: string;
};

type HubClientProps = {
  content: HubContent;
  missions: MissionMeta[];
  progress: SerializedProgress[];
  access: Record<string, { playable: boolean; continueUrl?: string; label: string }>;
  continueMission: ContinueMission | null;
  showReportLink: boolean;
  showDashboardLink?: boolean;
};

function resumeUrl(mission: ContinueMission): string {
  if (mission.id === "m1" && (mission.checkpoint === "start" || mission.checkpoint === "intro")) {
    return "/intro";
  }
  return mission.url;
}

export function HubClient({
  content,
  missions,
  progress,
  access,
  continueMission,
  showReportLink,
  showDashboardLink = false,
}: HubClientProps) {
  const progressMap = new Map(progress.map((p) => [p.missionId, p]));

  return (
    <main className={`hub${continueMission ? " hub--centered" : ""}`}>
      <header className="hub-header">
        <p className="hub-eyebrow">{content.eyebrow}</p>
        <h1 className="hub-title">{content.title}</h1>
        <p
          className="hub-sub"
          dangerouslySetInnerHTML={{ __html: content.subtitle }}
        />
      </header>

      {continueMission ? (
        <section className="hub-choice" aria-label="Resume or restart">
          <div className="hub-choice-mission">
            <span className="hub-choice-label">{continueMission.label}</span>
            <h2 className="hub-choice-title">{continueMission.name}</h2>
            <p className="hub-choice-checkpoint">
              {content.checkpointLabel}: <strong>{continueMission.checkpoint}</strong>
            </p>
          </div>

          <div className="hub-choice-actions">
            <Link href={resumeUrl(continueMission)} className="btn-primary btn-sweep hub-choice-btn" style={{ "--sweep-ms": "1200ms" } as React.CSSProperties}>
              {content.continueLabel} →
            </Link>
            <form action={restartGameAction}>
              <button type="submit" className="btn-secondary hub-choice-btn">
                {content.restartLabel} →
              </button>
            </form>
            <form action={signOutAction}>
              <button type="submit" className="btn-secondary hub-choice-btn hub-signout">
                {content.signOut}
              </button>
            </form>
          </div>
          <p className="hub-choice-hint">{content.restartHint}</p>
          {showDashboardLink && (
            <div className="hub-report-link">
              <Link href="/dashboard" className="btn-secondary hub-choice-btn">
                Group language →
              </Link>
            </div>
          )}
          {showReportLink && (
            <div className="hub-report-link">
              <Link href="/finale" className="btn-secondary hub-choice-btn">
                {content.reportLabel} →
              </Link>
              <p className="hub-report-hint">{content.reportHint}</p>
            </div>
          )}
        </section>
      ) : (
        <>
        <div className="hub-top-actions">
          {showDashboardLink && (
            <Link href="/dashboard" className="btn-secondary">
              Group language →
            </Link>
          )}
          <form action={signOutAction}>
            <button type="submit" className="btn-secondary">
              {content.signOut}
            </button>
          </form>
        </div>
        {showReportLink && (
          <div className="hub-report-banner">
            <div>
              <p className="hub-report-banner-title">{content.reportLabel}</p>
              <p className="hub-report-banner-hint">{content.reportHint}</p>
            </div>
            <Link href="/finale" className="btn-secondary">
              {content.reportLabel} →
            </Link>
          </div>
        )}
        <ul className="round-grid">
          {missions.map((mission) => {
            const state = access[mission.id] ?? { playable: false, label: "locked" };
            const record = progressMap.get(mission.id);
            const href =
              state.continueUrl ?? `/mission/${mission.id}${record?.status === "completed" ? "?replay=1" : ""}`;
            const cta =
              state.label === "continue"
                ? content.continueLabel
                : state.label === "replay"
                  ? content.replayLabel
                  : state.label === "locked"
                    ? content.lockedLabel
                    : content.playLabel;

            return (
              <li key={mission.id}>
                {state.playable ? (
                  <Link href={href} className="round-card">
                    <div className="round-meta">
                      <span>{mission.label}</span>
                      <span className="round-badge">{cta}</span>
                    </div>
                    <h2 className="round-name">{mission.name}</h2>
                    <p className="round-desc">{mission.description}</p>
                    <div className="round-cta">
                      {cta} <span aria-hidden="true">→</span>
                    </div>
                  </Link>
                ) : (
                  <div className="round-card round-card--locked" aria-disabled="true">
                    <div className="round-meta">
                      <span>{mission.label}</span>
                      <span className="round-badge">{cta}</span>
                    </div>
                    <h2 className="round-name">{mission.name}</h2>
                    <p className="round-desc">{content.lockedHint}</p>
                    <div className="round-cta">
                      {cta} <span aria-hidden="true">→</span>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        </>
      )}

      <p className="hub-footer">{content.footer}</p>
    </main>
  );
}
