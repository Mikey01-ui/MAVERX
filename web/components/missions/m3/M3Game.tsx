"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { M1HackOverlay } from "@/components/missions/m1/M1HackOverlay";
import { M3Inspector } from "@/components/missions/m3/M3Inspector";
import { M3VaultDoor } from "@/components/missions/m3/M3VaultDoor";
import { MissionDebriefScreen } from "@/components/missions/shared/MissionDebriefScreen";
import { CHANNEL_LABELS, DATASETS, DETECTION, HACK_LINES, SIGNOFF_DETECTION_MAX } from "@/lib/game/m3/data";
import { buildM3Debrief } from "@/lib/game/debriefBuilders";
import { m3ReportSnapshot } from "@/lib/finale/missionReportSnapshot";
import { M3Header } from "@/components/missions/m3/M3DetectionHeader";
import { useM3MissionAudio } from "@/lib/audio/useM3MissionAudio";
import { M3GameProvider, useM3Game } from "@/lib/game/m3/context";
import type { Channel } from "@/lib/game/m3/types";

function M3RoutingPanel() {
  const { state, dispatch } = useM3Game();
  const routed = Object.keys(state.assigned).length;
  const selected = DATASETS.find((d) => d.id === state.selectedId);

  return (
    <>
      <div id="main-row">
        <div id="desktop-panel">
          <div className="r2-layout">
            <div className="r2-router">
              <div className="r2-r-hdr">STAGED FOR DISCLOSURE</div>
              <div id="r3-file-list">
                {DATASETS.map((ds) => (
                  <div
                    key={ds.id}
                    role="button"
                    tabIndex={0}
                    data-id={ds.id}
                    className={`r2-file${state.selectedId === ds.id ? " sel" : ""}${state.assigned[ds.id] ? " done" : ""}`}
                    onClick={() => dispatch({ type: "SELECT_DATASET", id: ds.id })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        dispatch({ type: "SELECT_DATASET", id: ds.id });
                      }
                    }}
                  >
                    <span>📄</span>
                    <span>{ds.file}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="r2-inspector">
              <div className="r2-ins-hdr">{selected ? `INSPECTOR — ${selected.file}` : "INSPECTOR — Select a file"}</div>
              <div className="r2-ins-body" id="r3-ins-body">
                {selected ? (
                  <M3Inspector dataset={selected} />
                ) : (
                  <span style={{ color: "#5a6a7a" }}>
                    Open a file and read what&apos;s in it — then pick the channel that fits <strong>audience</strong> and <strong>harm</strong>, not a label.
                  </span>
                )}
              </div>
              {selected && (
                <div className="ch-bar" id="ch-bar" style={{ display: "flex" }}>
                  <span>Assign release channel:</span>
                  <div className="ch-row">
                    {(["public", "official", "vault"] as Channel[]).map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        className={`ch-btn ch-${ch}`}
                        id={`ch-${ch}`}
                        disabled={!!state.assigned[selected.id]}
                        onClick={() => dispatch({ type: "ASSIGN_CHANNEL", channel: ch })}
                      >
                        <i className={`fas ${ch === "public" ? "fa-bullhorn" : ch === "official" ? "fa-landmark" : "fa-lock"}`} aria-hidden /> {CHANNEL_LABELS[ch]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div id="nexus-taskbar">DISTRIBUTION MATRIX · Audience-separated · Pre-release</div>
        </div>

        <div id="right">
          <div id="dist-panel">
            <div className="dist-hdr">
              <div className="dist-title">DISTRIBUTION MAP</div>
              <div className="dist-sub">WHERE EACH FILE IS SLATED TO GO</div>
            </div>
            <div className="dist-cols">
              {(["public", "official", "vault"] as Channel[]).map((ch) => (
                <div key={ch} className={`dist-col ${ch}`}>
                  <div className="dist-col-h">{ch === "vault" ? "NO REL." : ch.toUpperCase()}</div>
                  {DATASETS.filter((d) => state.assigned[d.id] === ch).map((d) => (
                    <div key={d.id} className={`dist-chip ${ch}`}>
                      {d.file.length > 22 ? `${d.file.slice(0, 20)}…` : d.file}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div id="routed-count">Routed: {routed} / 10</div>
            <button type="button" id="signoff-btn" className={routed >= 10 ? "ready" : ""} disabled={routed < 10} onClick={() => dispatch({ type: "REQUEST_SIGNOFF" })}>
              REQUEST NOVA SIGN-OFF
            </button>
          </div>

          <div id="broker-wrap">
            <div className="broker-hdr">
              <div className="bk-avatar">
                <i className="fas fa-shield-halved" aria-hidden />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="bk-name">Operation Channel</div>
                <div className="bk-members">
                  <span className="bk-member online">Voss</span>
                  <span className="bk-sep">·</span>
                  <span className="bk-member online">Zex</span>
                  <span className="bk-sep">·</span>
                  <span className="bk-member online">Nova</span>
                </div>
              </div>
              <div className="bk-icons">
                <i className="fas fa-lock" aria-hidden />
              </div>
            </div>
            <div id="broker-body">
              <div className="bm-sep">
                <div className="bm-sep-pill">Staging</div>
              </div>
              {state.messages.map((m) => (
                <div key={m.id} className="bm-group">
                  <div className="bm-sender">{m.sender.toUpperCase()}</div>
                  <div className={`bm-bubble ${m.tone}`} dangerouslySetInnerHTML={{ __html: m.text }} />
                  <div className="bm-ts">{m.ts}</div>
                </div>
              ))}
            </div>
            <div className="broker-footer">
              <div className="broker-input-bar">
                <div className="hint-wrap">
                  <button type="button" id="hint-btn" disabled={state.hintCooldown || !state.selectedId || !!(state.selectedId && state.assigned[state.selectedId])} onClick={() => dispatch({ type: "REQUEST_HINT" })}>
                    <i className="fas fa-lightbulb" aria-hidden />
                  </button>
                  <div className="hint-tooltip">
                    Hint · +{DETECTION.hint}% detection · {state.hintCooldown ? "cooldown…" : "25s cooldown"}
                  </div>
                </div>
                <input type="text" id="broker-input" placeholder="Operation Channel — listen only" disabled readOnly />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function M3GameInner() {
  const { state, dispatch } = useM3Game();
  const router = useRouter();
  const [desktopReady, setDesktopReady] = useState(false);
  useM3MissionAudio(state);
  const detection = Math.round(state.detection);
  const routed = Object.keys(state.assigned).length;

  useEffect(() => {
    if (state.phase === "desktop") {
      const t = setTimeout(() => setDesktopReady(true), 400);
      return () => clearTimeout(t);
    }
    setDesktopReady(false);
  }, [state.phase]);

  const completeMission = useCallback(async () => {
    const snapshot = m3ReportSnapshot(state);
    await fetch("/api/progress", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        missionId: "m3",
        status: "completed",
        checkpoint: "completed",
        score: snapshot.score,
        stateJson: snapshot.stateJson,
      }),
    });
    await fetch("/api/progress", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        missionId: "m4",
        status: "in_progress",
        checkpoint: "start",
      }),
    });
    router.push("/mission/m4");
    router.refresh();
  }, [router, state]);

  const debrief = useMemo(() => buildM3Debrief(state), [state]);

  const handleDebriefContinue = useCallback(() => {
    if (state.detection >= 100 || state.phase === "failed") {
      dispatch({ type: "RESET_MISSION" });
      return;
    }
    void completeMission();
  }, [completeMission, dispatch, state.detection, state.phase]);

  const isRouting = state.phase === "play" || state.phase === "signoff";
  const showGameChrome = state.hackDone && state.phase !== "debrief";

  return (
    <div className={`m3-game${isRouting ? " m3-routing" : " m3-desktop"}${state.vaultOpen ? " vault-open" : ""}`}>
      <div id="m3-game" className={state.hackDone ? "active" : ""}>
        <div className="m3-ambient" aria-hidden />
        {showGameChrome && (
          <>
            <M3Header />
            <div id="step-banner">{state.stepBanner}</div>
            {state.phase === "desktop" && (
              <div id="main-row">
                <div id="desktop-panel">
                  <div id="wallpaper" className={desktopReady ? "visible" : ""} />
                  <button
                    type="button"
                    className="di di-interactive di-mission visible"
                    id="di-disclosure"
                    style={{ top: 22, left: 14 }}
                    title="Double-click to open"
                    onDoubleClick={() => dispatch({ type: "OPEN_VAULT" })}
                  >
                    <span className="di-icon">
                      <i className="fas fa-lock" aria-hidden />
                    </span>
                    <span className="di-label">Data Vault</span>
                  </button>
                  {[
                    { top: 106, icon: "fa-folder-open", label: "Disclosure Queue" },
                    { top: 190, icon: "fa-folder", label: "HR_Records" },
                    { top: 274, icon: "fa-chart-bar", label: "Finance" },
                    { top: 358, emoji: "🗑️", label: "Recycle Bin" },
                  ].map((item) => (
                    <div key={item.label} className="di di-locked visible" style={{ top: item.top, left: 14 }}>
                      <span className="di-icon">{item.emoji ?? <i className={`fas ${item.icon}`} aria-hidden />}</span>
                      <span className="di-label">{item.label}</span>
                    </div>
                  ))}
                  <div id="xp-taskbar" className={desktopReady ? "visible" : ""}>
                    <div id="start-btn">⊞ Start</div>
                    <div className="tb-div" />
                    <button type="button" className="tb-wb" onDoubleClick={() => dispatch({ type: "OPEN_VAULT" })}>
                      <i className="fas fa-lock" aria-hidden /> Data Vault
                    </button>
                    <div id="tb-clock">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </div>
              </div>
            )}
            {isRouting && <M3RoutingPanel />}
          </>
        )}
      </div>

      <M3VaultDoor open={state.vaultOpen} onClose={() => dispatch({ type: "CLOSE_VAULT" })} onUnlocked={() => dispatch({ type: "VAULT_UNLOCKED" })} />

      {state.phase === "hack" && <M1HackOverlay lines={HACK_LINES} visibleCount={state.hackLine + 1} />}

      {state.phase === "signoff" && (
        <div id="signoff-overlay" className="show">
          <pre id="signoff-term">{`NOVA SIGN-OFF PROTOCOL
DETECTION: ${detection}%
ROUTED: ${routed}/10
${detection <= SIGNOFF_DETECTION_MAX && state.catastrophic === 0 ? "STATUS: APPROVED" : "STATUS: WITHHELD"}`}</pre>
        </div>
      )}

      {state.gameOver && (
        <div id="gameover-overlay" className="active">
          <div className="go-title">OPERATION COMPROMISED</div>
          <div className="go-sub">MegaCorp closed the breach. The mirror is dead.</div>
          <button type="button" className="db-cta btn-sweep" style={{ "--sweep-ms": "1200ms" } as React.CSSProperties} onClick={() => dispatch({ type: "RESET_MISSION" })}>
            RETRY MISSION
          </button>
        </div>
      )}

      {state.phase === "debrief" && <MissionDebriefScreen config={debrief} onContinue={handleDebriefContinue} />}
    </div>
  );
}

type M3GameProps = {
  savedState?: Record<string, unknown> | null;
};

export function M3Game({ savedState }: M3GameProps) {
  return (
    <M3GameProvider savedState={savedState}>
      <M3GameInner />
    </M3GameProvider>
  );
}
