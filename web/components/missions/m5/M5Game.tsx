"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { M1HackOverlay } from "@/components/missions/m1/M1HackOverlay";
import { M5SynthOverlay } from "@/components/missions/m5/M5SynthOverlay";
import { M5VoteOverlay } from "@/components/missions/m5/M5VoteOverlay";
import { MissionDebriefScreen } from "@/components/missions/shared/MissionDebriefScreen";
import {
  CREW_META,
  CREW_ORDER,
  CREW_QUESTIONS,
  ECHO_FRAME,
  ECHO_VIZ,
  EVIDENCE_CARDS,
  FRAME_GLOSS,
  frameOptionsForCard,
  HACK_LINES,
  VIZ_GLOSS,
  VIZ_OPTIONS,
} from "@/lib/game/m5/data";
import { buildM5Debrief } from "@/lib/game/debriefBuilders";
import { M5GameProvider, useM5Game } from "@/lib/game/m5/context";
import { getDetectionClass } from "@/lib/game/m5/reducer";
import type { CrewId } from "@/lib/game/m5/types";

function framingReady(choices: ReturnType<typeof useM5Game>["state"]["frameChoices"]) {
  for (let i = 1; i <= 4; i++) {
    const c = choices[i];
    if (!c?.frame || !c?.viz) return false;
  }
  return true;
}

function M5GameInner() {
  const { state, dispatch } = useM5Game();
  const router = useRouter();
  const [voteUiReady, setVoteUiReady] = useState(false);
  const timer = `${String(Math.floor(state.timerSec / 60)).padStart(2, "0")}:${String(state.timerSec % 60).padStart(2, "0")}`;
  const detClass = getDetectionClass(state.detection);

  useEffect(() => {
    if (state.phase === "vote") setVoteUiReady(false);
  }, [state.phase]);

  const completeMission = useCallback(async () => {
    await fetch("/api/progress", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        missionId: "m5",
        status: "completed",
        checkpoint: "completed",
        score: state.score,
        stateJson: {
          version: 1,
          commits: state.commits,
          ships: state.ships,
          detection: state.detection,
          timerSec: state.timerSec,
        },
      }),
    });
    router.push("/hub");
    router.refresh();
  }, [router, state.commits, state.detection, state.score, state.ships, state.timerSec]);

  const debrief = useMemo(() => buildM5Debrief(state), [state]);

  return (
    <div id="gp-root" className="m5-game">
      <div id="m5-game" className={state.hackDone ? "active" : ""}>
        {state.hackDone && state.phase !== "debrief" && (
          <>
            <div id="hdr">
              <div className="hdr-left">
                <i className="fas fa-terminal" aria-hidden /> MASTERMIND TERMINAL · OPERATION OMNI
              </div>
              <div className="hdr-center">MISSION 05 OF 05 / THE FINAL BRIEF</div>
              <div className="hdr-right">
                <span id="det-display" className={detClass}>
                  <span id="det-icon">
                    <i className="fas fa-shield-alt" aria-hidden />
                  </span>
                  <span id="det-pct">{state.detection}%</span>
                  <span className="det-bar-wrap">
                    <span id="det-bar" className={`det-bar-${detClass.replace("det-", "")}`} style={{ width: `${state.detection}%` }} />
                  </span>
                  <span style={{ fontSize: 10, letterSpacing: 1.5, opacity: 0.7 }}>DARK</span>
                </span>
                <span style={{ color: "rgba(0,196,28,.2)", margin: "0 4px" }}>|</span>
                <span id="timer">{timer}</span>
                <span className="live-dot" />
                <span style={{ letterSpacing: 1, fontSize: 10 }}>LIVE</span>
              </div>
            </div>

            <div id="step-banner">{state.stepBanner}</div>

            <div id="main-row">
              <div id="brief-panel">
                {state.phase === "framing" && (
                  <div id="phase-framing">
                    <div className="phase-label">STEP 01 — ECHO FRAMING</div>
                    <div className="evidence-grid" id="ev-grid">
                      {EVIDENCE_CARDS.map((card) => {
                        const choice = state.frameChoices[card.id] ?? {};
                        const echoLines: string[] = [];
                        if (choice.frame) echoLines.push(ECHO_FRAME[card.id].msgs[choice.frame]);
                        if (choice.viz) echoLines.push(ECHO_VIZ[card.id].msgs[choice.viz]);
                        return (
                          <div key={card.id} className="ev-card" id={`evc-${card.id}`}>
                            <div className="ev-op">{card.op}</div>
                            <div className="ev-title">{card.title}</div>
                            <div className="ev-finding">{card.finding}</div>
                            <div className="ev-qual clean">● CLEAN</div>
                            <div className="ev-choices">
                              <div className="ev-choice-label">
                                <span className="gloss" data-gloss={FRAME_GLOSS} style={{ color: "var(--purple-light)", borderBottomColor: "rgba(143,68,232,0.5)" }}>
                                  FRAMING TYPE ⓘ
                                </span>
                              </div>
                              <div className="choice-btns" id={`frame-btns-${card.id}`}>
                                {frameOptionsForCard(card.id).map((opt) => (
                                  <button
                                    key={opt.key}
                                    type="button"
                                    data-key={opt.key}
                                    className={`choice-btn${choice.frame === opt.key ? " selected" : ""}${state.framingLocked ? " locked" : ""}`}
                                    disabled={state.framingLocked}
                                    onClick={() => dispatch({ type: "SELECT_FRAME", cardId: card.id, frame: opt.key })}
                                  >
                                    <span className="cb-ico">
                                      <i className={`fas ${opt.icon}`} aria-hidden />
                                    </span>
                                    <span className="cb-lbl">{opt.label}</span>
                                  </button>
                                ))}
                              </div>
                              <div className="ev-choice-label" style={{ marginTop: 5 }}>
                                <span className="gloss" data-gloss={VIZ_GLOSS} style={{ color: "var(--purple-light)", borderBottomColor: "rgba(143,68,232,0.5)" }}>
                                  VISUALISATION ⓘ
                                </span>
                              </div>
                              <div className="choice-btns" id={`viz-btns-${card.id}`}>
                                {VIZ_OPTIONS[card.id].map((opt) => (
                                  <button
                                    key={opt.key}
                                    type="button"
                                    data-viz={opt.key}
                                    className={`choice-btn${choice.viz === opt.key ? " selected" : ""}${state.framingLocked ? " locked" : ""}`}
                                    disabled={state.framingLocked}
                                    onClick={() => dispatch({ type: "SELECT_VIZ", cardId: card.id, viz: opt.key })}
                                  >
                                    <span className="cb-ico">
                                      <i className={`fas ${opt.icon}`} aria-hidden />
                                    </span>
                                    <span className="cb-lbl">{opt.label}</span>
                                  </button>
                                ))}
                              </div>
                              <div className={`echo-line${echoLines.length > 0 ? " show" : ""}`} id={`echo-${card.id}`}>
                                {echoLines.map((line, i) => (
                                  <span key={i}>
                                    <span className="echo-tag">ECHO</span>
                                    {line}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {!state.framingLocked && (
                      <button type="button" id="framing-confirm" disabled={!framingReady(state.frameChoices)} onClick={() => dispatch({ type: "CONFIRM_FRAMING" })}>
                        ENTER THE BRIEFING ROOM →
                      </button>
                    )}
                  </div>
                )}

                {state.phase === "briefing" && (
                  <div id="phase-briefing">
                    <div className="phase-label">STEP 02 — CREW BRIEFING</div>
                    {CREW_ORDER.map((crewId: CrewId) => {
                      const meta = CREW_META[crewId];
                      const cs = state.crewState[crewId];
                      const q = CREW_QUESTIONS[crewId];
                      const locked = cs.status === "pending" && state.activeCrew !== crewId;
                      const rowClass = [
                        "crew-member-row",
                        locked ? "locked" : "",
                        state.activeCrew === crewId ? "active" : "",
                        cs.status === "committed" ? "committed" : "",
                        cs.status === "sceptical" ? "sceptical" : "",
                      ]
                        .filter(Boolean)
                        .join(" ");
                      const badge =
                        cs.status === "committed" ? "COMMITTED ✓" : cs.status === "sceptical" ? "SCEPTICAL ✗" : cs.status === "asking" ? "ASKING" : "PENDING";
                      return (
                        <div key={crewId} className={rowClass} id={`crew-${crewId}`}>
                          <div className="crew-top">
                            <div
                              className="crew-avatar"
                              style={{ background: meta.avatarBg, border: `2px solid ${meta.color}`, color: meta.color }}
                            >
                              {meta.initial}
                            </div>
                            <div>
                              <div className="crew-name">{meta.name}</div>
                              <div className="crew-domain">{meta.domain}</div>
                            </div>
                            <div className={`crew-status-badge ${cs.status}`}>{badge}</div>
                          </div>
                          {cs.status === "asking" && (
                            <div className="crew-question show">
                              <div>{q.text}</div>
                              <div className="crew-opts">
                                {q.opts.map((opt, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    className={`crew-opt${cs.selected === i ? " selected" : ""}`}
                                    onClick={() => dispatch({ type: "SELECT_CREW_OPT", crewId, idx: i })}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                              <button type="button" className="crew-confirm" disabled={cs.selected === null} onClick={() => dispatch({ type: "CONFIRM_CREW", crewId })}>
                                SUBMIT →
                              </button>
                            </div>
                          )}
                          {cs.status === "committed" && <div className="crew-verdict v-commit show">{q.commit}</div>}
                          {cs.status === "sceptical" && <div className="crew-verdict v-skip show">Not convinced. Moving on.</div>}
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>

              <div id="right">
                <div id="voss-wrap">
                  <div className="voss-hdr">
                    <div className="bk-avatar">
                      <i className="fas fa-user-secret" aria-hidden />
                    </div>
                    <div className="bk-info">
                      <div className="bk-name">Mission Channel</div>
                      <div className="bk-members">
                        <span className="bk-member online">Voss</span>
                        <span className="bk-sep">,</span>
                        <span className="bk-member online">Echo</span>
                        <span className="bk-sep">,</span>
                        <span className="bk-member online">Zex</span>
                        <span className="bk-sep">,</span>
                        <span className="bk-member online">Atlas</span>
                        <span className="bk-sep">,</span>
                        <span className="bk-member online">Nova</span>
                        <span className="bk-sep">,</span>
                        <span className="bk-member online">Kade</span>
                      </div>
                    </div>
                    <div className="bk-icons">
                      <i className="fas fa-lock" aria-hidden />
                    </div>
                  </div>
                  <div id="voss-body">
                    <div className="bm-sep">
                      <div className="bm-sep-pill">TODAY</div>
                    </div>
                    {state.messages.map((m) => (
                      <div key={m.id} className="bm-group">
                        <div className="bm-sender">{m.sender.toUpperCase()}</div>
                        <div className={`bm-bubble ${m.tone}`}>{m.text}</div>
                        <div className="bm-ts">{m.ts}</div>
                      </div>
                    ))}
                  </div>
                  <div className="voss-footer">
                    <div className="voss-input-bar">
                      <input id="voss-input" type="text" placeholder="// channel encrypted — read only" disabled readOnly />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {state.phase === "hack" && <M1HackOverlay lines={HACK_LINES} visibleCount={state.hackLine + 1} />}

      {state.phase === "vote" && state.ships !== null && (
        <>
          <M5SynthOverlay
            active={!voteUiReady}
            ships={state.ships}
            commits={state.commits}
            crewState={state.crewState}
            onDone={() => setVoteUiReady(true)}
          />
          <M5VoteOverlay
            active={voteUiReady}
            ships={state.ships}
            commits={state.commits}
            crewState={state.crewState}
            onContinue={() => dispatch({ type: "TRIGGER_VOTE" })}
          />
        </>
      )}

      {state.phase === "debrief" && <MissionDebriefScreen config={debrief} onContinue={completeMission} />}
    </div>
  );
}

export function M5Game() {
  return (
    <M5GameProvider>
      <M5GameInner />
    </M5GameProvider>
  );
}
