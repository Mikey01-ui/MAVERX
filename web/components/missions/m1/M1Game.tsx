"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { M1BoardReport, M1HeadcountView, M1HrAuthView, M1VaultAuditView } from "@/components/missions/m1/M1CrossRefViews";
import { M1BudgetChart, M1PersonnelChart, M1ServerChart } from "@/components/missions/m1/M1Charts";
import { M1Debrief } from "@/components/missions/m1/M1Debrief";
import { M1DetectionHeader } from "@/components/missions/m1/M1DetectionHeader";
import { M1HackOverlay } from "@/components/missions/m1/M1HackOverlay";
import { M1MissionChannel } from "@/components/missions/m1/M1MissionChannel";
import { M1SynthOverlay } from "@/components/missions/m1/M1SynthOverlay";
import { M1Taskbar } from "@/components/missions/m1/M1Taskbar";
import {
  DESKTOP_ICONS,
  FOLDERS,
  HACK_LINES,
  HEATMAP_DATA,
  HEATMAP_FILES,
  HEATMAP_OMNI_ROW,
  HEATMAP_WEEK13,
  LEAD_FA_ICONS,
  LEAD_ORDER,
  LEADS,
  STICKIES,
} from "@/lib/game/m1/data";
import { M1GameProvider, useM1Game } from "@/lib/game/m1/context";

function heatColor(n: number) {
  if (n === 0) return "#f0f0f0";
  if (n <= 5) return "#c8ddf0";
  if (n <= 15) return "#5a88c8";
  return "#1a3a6a";
}

function M1GameInner() {
  const { state, dispatch } = useM1Game();
  const router = useRouter();

  const completeMission = useCallback(async () => {
    await fetch("/api/progress", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        missionId: "m1",
        status: "completed",
        checkpoint: "completed",
        score: Math.max(0, 100 - Math.round(state.detection)),
        stateJson: { version: 1, timerSec: state.timerSec, detection: state.detection },
      }),
    });
    router.push("/mission/m2");
    router.refresh();
  }, [router, state.detection, state.timerSec]);

  const timer = `${String(Math.floor(state.timerSec / 60)).padStart(2, "0")}:${String(state.timerSec % 60).padStart(2, "0")}`;

  return (
    <div className="m1-game">
      <div id="m1-game">
        <M1DetectionHeader detection={state.detection} timer={timer} />
        <div id="step-banner">{state.stepBanner}</div>

        <div id="main-row">
          <div id="desktop-panel">
            <div id="wallpaper" className={state.desktopRevealed ? "visible" : ""} />

            {STICKIES.map((s) => (
              <div
                key={s.id}
                className={`sticky ${s.className}${state.desktopRevealed ? " visible" : ""}`}
                style={{ top: s.top, right: s.right }}
              >
                {s.header && <span className="sticky-hdr">{s.header}</span>}
                {s.body.split("\n").map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < s.body.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </div>
            ))}

            {DESKTOP_ICONS.map((icon) => (
              <button
                key={icon.id}
                type="button"
                className={`di${state.desktopRevealed ? " visible" : ""}${state.activeLead && LEADS[state.activeLead].iconId === icon.id ? " di-mission" : ""}`}
                style={{ top: icon.top, left: icon.left }}
                onDoubleClick={() => dispatch({ type: "OPEN_FOLDER", folderKey: icon.folder })}
              >
                <span className="di-icon">
                  <i className="fas fa-folder" aria-hidden />
                </span>
                <div className="di-label">{icon.label}</div>
              </button>
            ))}
            <div className={`di${state.desktopRevealed ? " visible" : ""}`} style={{ top: 442, left: 14 }}>
              <span className="di-icon">🗑️</span>
              <div className="di-label">Recycle Bin</div>
            </div>

            {state.openWindows.map((winId) => (
              <div key={winId} className="xp-win visible" style={{ top: 58, left: 88, width: 420, zIndex: 120 }}>
                <div className="xp-tb">
                  <div className="xp-title">
                    <span className="xp-ti">
                      <i className="fas fa-folder" aria-hidden />
                    </span>
                    {winId.replace("win-", "").replace(/-/g, "_")}
                  </div>
                  <div className="xp-btns">
                    <button type="button" className="xp-btn xp-cls" onClick={() => dispatch({ type: "CLOSE_WINDOW", windowId: winId })}>
                      ✕
                    </button>
                  </div>
                </div>
                <div className="xp-body">
                  {FOLDERS[winId.replace("win-", "")] && (
                    <div className="folder-grid">
                      {FOLDERS[winId.replace("win-", "")].map((f) => (
                        <button
                          key={f.name}
                          type="button"
                          className="fg-item"
                          onDoubleClick={() => dispatch({ type: "FILE_INTERACT", folderKey: winId.replace("win-", ""), file: f })}
                        >
                          <div className="fg-icon">📄</div>
                          <div className="fg-label">{f.name}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {winId === "win-server" && (
                    <M1ServerChart
                      activeLead={state.activeLead}
                      onAnomaly={() => dispatch({ type: "TRIGGER_ANOMALY", leadId: "compute" })}
                      onWrong={() => dispatch({ type: "WRONG_DATA_CLICK" })}
                    />
                  )}
                  {winId === "win-budget" && (
                    <M1BudgetChart
                      activeLead={state.activeLead}
                      onAnomaly={() => dispatch({ type: "TRIGGER_ANOMALY", leadId: "funding" })}
                      onWrong={() => dispatch({ type: "WRONG_DATA_CLICK" })}
                    />
                  )}
                  {winId === "win-personnel" && (
                    <M1PersonnelChart
                      activeLead={state.activeLead}
                      onAnomaly={() => dispatch({ type: "TRIGGER_ANOMALY", leadId: "personnel" })}
                      onWrong={() => dispatch({ type: "WRONG_DATA_CLICK" })}
                    />
                  )}
                  {winId === "win-vault-heatmap" && (
                    <div className="heatmap-wrap" style={{ overflow: "auto", padding: 8 }}>
                      <table className="heatmap-tbl">
                        <thead>
                          <tr>
                            <th />
                            {Array.from({ length: 13 }, (_, w) => (
                              <th key={w}>W{w + 1}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {HEATMAP_FILES.map((fn, fi) => (
                            <tr key={fn}>
                              <td className="heatmap-fname">{fn}</td>
                              {HEATMAP_DATA[fi].map((n, wi) => (
                                <td
                                  key={wi}
                                  className="heatmap-cell"
                                  style={{ background: heatColor(n), cursor: "pointer" }}
                                  onClick={() => {
                                    const valid = fi === HEATMAP_OMNI_ROW && wi === HEATMAP_WEEK13;
                                    if (valid && state.activeLead === "payload") dispatch({ type: "TRIGGER_ANOMALY", leadId: "payload" });
                                    else dispatch({ type: "WRONG_DATA_CLICK" });
                                  }}
                                />
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {winId === "win-board" && <M1BoardReport />}
                  {winId === "win-hr-auth" && <M1HrAuthView />}
                  {winId === "win-headcount" && <M1HeadcountView />}
                  {winId === "win-vault-audit" && <M1VaultAuditView />}
                </div>
              </div>
            ))}

            {state.anomalyLead && (
              <div className="chart-anom-panel">
                <div className="cap-ttl">{LEADS[state.anomalyLead].anomalyTitle}</div>
                <div className="cap-txt">{LEADS[state.anomalyLead].anomalyText}</div>
                <button type="button" className="cap-btn" onClick={() => dispatch({ type: "OPEN_VERIFY", leadId: state.anomalyLead! })}>
                  VERIFY LEAD →
                </button>
              </div>
            )}

            {state.phase === "hack" && <M1HackOverlay lines={HACK_LINES} visibleCount={state.hackLine + 1} />}

            <M1Taskbar
              visible={state.desktopRevealed}
              openWindows={state.openWindows}
              onToggleWindow={(winId) => {
                const folder = winId.replace("win-", "");
                if (state.openWindows.includes(winId)) dispatch({ type: "CLOSE_WINDOW", windowId: winId });
                else dispatch({ type: "OPEN_FOLDER", folderKey: folder });
              }}
            />
          </div>

          <div id="right">
            <div id="eboard">
              <div className="eb-hdr">
                <span className="eb-htitle">EVIDENCE BOARD</span>
                <span id="eb-hint">{state.ebHint}</span>
              </div>
              <div id="eb-step">{state.ebStep}</div>
              <div className="eb-grid">
                {LEAD_ORDER.map((id) => {
                  const st = state.leadStatus[id];
                  const cls =
                    st === "confirmed"
                      ? "n-locked"
                      : st === "active"
                        ? "n-active"
                        : st === "mission"
                          ? "n-mission"
                          : st === "start"
                            ? "n-start"
                            : st === "next"
                              ? "n-next"
                              : st === "dimmed"
                                ? "n-dimmed"
                                : "n-idle";
                  return (
                    <button key={id} type="button" className={`lead ${cls}`} onClick={() => dispatch({ type: "LEAD_CLICK", leadId: id })}>
                      <div className="lead-icon">
                        <i className={`fas ${LEAD_FA_ICONS[id]}`} aria-hidden />
                      </div>
                      <div className="lead-name">{LEADS[id].label}</div>
                      <div className="lead-status">{state.leadStatusText[id]}</div>
                    </button>
                  );
                })}
              </div>
              <div className="eb-progress">
                {LEAD_ORDER.map((id) => (
                  <div key={id} className={`ep-seg${state.locked.includes(id) ? " filled" : ""}`} />
                ))}
              </div>
              <button
                id="synth-btn"
                type="button"
                className={state.synthReady ? "ready" : ""}
                disabled={!state.synthReady}
                onClick={() => dispatch({ type: "START_SYNTH" })}
              >
                <i className="fas fa-circle-nodes" aria-hidden /> CONFIRM INTEL
              </button>
            </div>

            <M1MissionChannel
              messages={state.messages}
              typing={state.typing}
              hintCooldown={state.hintCooldown}
              activeLead={!!state.activeLead}
              onHint={() => dispatch({ type: "REQUEST_HINT" })}
            />
          </div>
        </div>

        {state.verifyOpen && state.verifyLead && (
          <div id="verify-panel" className="open">
            <button type="button" id="verify-toggle" className="show" onClick={() => dispatch({ type: "TOGGLE_VERIFY" })} title="Toggle panel">
              ‹
            </button>
            <div className="cp-hdr">
              <div className="cp-lead" id="cp-lead">
                VERIFY: {LEADS[state.verifyLead].label}
              </div>
              <div className="cp-sub">Select the correct values from the evidence you found.</div>
            </div>
            <div className="cp-body">
              <div className="cp-params">
                {LEADS[state.verifyLead].params.map((p, i) => (
                  <div key={p.label} className="cp-param">
                    <div className="cp-plbl">{p.label}</div>
                    <div className="cp-chips">
                      {p.opts.map((opt, j) => (
                        <button
                          key={opt}
                          type="button"
                          className={`cp-chip${state.chipIdx[i] === j ? " cp-sel" : ""}`}
                          onClick={() => dispatch({ type: "SELECT_CHIP", paramIdx: i, chipIdx: j })}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="cp-foot">
              <button type="button" className="cp-ok" onClick={() => dispatch({ type: "CONFIRM_VERIFY" })}>
                ✓ CONFIRM LOCK
              </button>
            </div>
          </div>
        )}
      </div>

      {state.phase === "synth" && <M1SynthOverlay />}
      {state.phase === "debrief" && <M1Debrief timer={timer} onContinue={completeMission} />}

      {state.detectionToast != null && (
        <div className="det-toast" style={{ top: 80, left: "50%", transform: "translateX(-50%)" }}>
          +{state.detectionToast}% DETECTION
        </div>
      )}

      {state.breachOverlay && (
        <div id="det-breach" className="active">
          <div className="breach-title">DETECTION THRESHOLD EXCEEDED</div>
          <div className="breach-sub">Mirror feed dropped. Reconnecting on a cold relay...</div>
          <button type="button" className="db-cta btn-sweep" style={{ "--sweep-ms": "1200ms" } as React.CSSProperties} onClick={() => dispatch({ type: "DISMISS_BREACH" })}>
            RECONNECT FEED
          </button>
        </div>
      )}

      {state.gameOver && (
        <div id="gameover-overlay" className="active">
          <div className="go-title">OPERATION COMPROMISED</div>
          <div className="go-sub">MegaCorp closed the breach. The mirror is dead.</div>
          <button type="button" className="db-cta btn-sweep" style={{ "--sweep-ms": "1200ms" } as React.CSSProperties} onClick={() => dispatch({ type: "GAME_OVER_DISMISS" })}>
            RETRY MISSION
          </button>
        </div>
      )}
    </div>
  );
}

export function M1Game({ savedState }: { savedState?: Record<string, unknown> | null }) {
  return (
    <M1GameProvider savedState={savedState}>
      <M1GameInner />
    </M1GameProvider>
  );
}
