"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import type { HubContent, MissionMeta } from "@/lib/content";

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
}: HubClientProps) {
  const router = useRouter();
  const [restarting, setRestarting] = useState(false);
  const progressMap = new Map(progress.map((p) => [p.missionId, p]));

  async function handleRestart() {
    if (restarting) return;
    setRestarting(true);
    try {
      // Restart the WHOLE game: clear every mission, unlock only M1, back to the intro.
      await Promise.all(
        missions.map((m) =>
          fetch("/api/progress", {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              missionId: m.id,
              status: m.id === "m1" ? "in_progress" : "locked",
              checkpoint: "start",
              stateJson: null,
              score: null,
            }),
          })
        )
      );
      router.push("/intro");
      router.refresh();
    } finally {
      setRestarting(false);
    }
  }

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
            <button
              type="button"
              className="btn-secondary hub-choice-btn"
              onClick={handleRestart}
              disabled={restarting}
            >
              {restarting ? "Resetting…" : `${content.restartLabel} →`}
            </button>
            <button
              type="button"
              className="btn-secondary hub-choice-btn hub-signout"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              {content.signOut}
            </button>
          </div>
          <p className="hub-choice-hint">{content.restartHint}</p>
        </section>
      ) : (
        <>
        <div className="hub-top-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            {content.signOut}
          </button>
        </div>
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
                <Link
                  href={state.playable ? href : "#"}
                  className={`round-card${state.playable ? "" : " round-card--locked"}`}
                  aria-disabled={!state.playable}
                >
                  <div className="round-meta">
                    <span>{mission.label}</span>
                    <span className="round-badge">{cta}</span>
                  </div>
                  <h2 className="round-name">{mission.name}</h2>
                  <p className="round-desc">
                    {state.playable ? mission.description : content.lockedHint}
                  </p>
                  <div className="round-cta">
                    {cta} <span aria-hidden="true">→</span>
                  </div>
                </Link>
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
