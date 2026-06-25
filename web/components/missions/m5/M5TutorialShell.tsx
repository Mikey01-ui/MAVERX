"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  CREW_META,
  CREW_ORDER,
  CREW_QUESTIONS,
  ECHO_FRAME,
  ECHO_VIZ,
  EVIDENCE_CARDS,
  FRAME_GLOSS,
  frameOptionsForCard,
  INTRO_CHAT,
  VIZ_GLOSS,
  VIZ_OPTIONS,
} from "@/lib/game/m5/data";
import type { M5TutorialDemoApi } from "@/lib/game/m5/tutorialDemo";
import type { CrewId, FrameKey } from "@/lib/game/m5/types";

export type M5TutorialShellHandle = {
  root: HTMLDivElement | null;
  reset: () => void;
  prepareForStep: (stepIndex: number) => void;
  getDemoApi: () => M5TutorialDemoApi;
};

type FrameChoices = Record<number, { frame?: FrameKey; viz?: string }>;
type CrewStatus = "pending" | "asking" | "committed" | "sceptical";

const FRAMING_BANNER = "Work with ECHO — frame each evidence card before entering the briefing room";
const BRIEFING_BANNER = "Present your dossier — answer each crew member's challenge to earn their commitment";

function framingReady(choices: FrameChoices) {
  for (let i = 1; i <= 4; i++) {
    const c = choices[i];
    if (!c?.frame || !c?.viz) return false;
  }
  return true;
}

function buildAllCorrectChoices(): FrameChoices {
  const next: FrameChoices = {};
  for (let i = 1; i <= 4; i++) {
    next[i] = { frame: ECHO_FRAME[i].correct, viz: ECHO_VIZ[i].correct };
  }
  return next;
}

export const M5TutorialShell = forwardRef<M5TutorialShellHandle>(function M5TutorialShell(_, ref) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [shellPhase, setShellPhase] = useState<"framing" | "briefing">("framing");
  const [choices, setChoices] = useState<FrameChoices>({});
  const [showVotePreview, setShowVotePreview] = useState(false);
  const [activeCrew, setActiveCrew] = useState<CrewId | null>(null);
  const [crewStatus, setCrewStatus] = useState<Record<CrewId, CrewStatus>>({
    zex: "pending",
    atlas: "pending",
    nova: "pending",
    kade: "pending",
  });
  const [crewSelected, setCrewSelected] = useState<Record<CrewId, number | null>>({
    zex: null,
    atlas: null,
    nova: null,
    kade: null,
  });
  const [stepBanner, setStepBanner] = useState(FRAMING_BANNER);

  const applyBaseline = useCallback(() => {
    setShellPhase("framing");
    setChoices({});
    setShowVotePreview(false);
    setActiveCrew(null);
    setCrewStatus({ zex: "pending", atlas: "pending", nova: "pending", kade: "pending" });
    setCrewSelected({ zex: null, atlas: null, nova: null, kade: null });
    setStepBanner(FRAMING_BANNER);
  }, []);

  const fillAllFrames = useCallback(() => {
    setChoices(buildAllCorrectChoices());
  }, []);

  const selectFrame = useCallback((cardId: number, frame: FrameKey) => {
    setChoices((prev) => ({ ...prev, [cardId]: { ...prev[cardId], frame } }));
  }, []);

  const selectViz = useCallback((cardId: number, viz: string) => {
    setChoices((prev) => ({ ...prev, [cardId]: { ...prev[cardId], viz } }));
  }, []);

  const fillRemainingCardsCorrect = useCallback(() => {
    setChoices((prev) => {
      const next = { ...prev };
      for (let i = 1; i <= 4; i++) {
        if (!next[i]?.frame) next[i] = { ...next[i], frame: ECHO_FRAME[i].correct };
        if (!next[i]?.viz) next[i] = { ...next[i], viz: ECHO_VIZ[i].correct };
      }
      return next;
    });
  }, []);

  const confirmFraming = useCallback(() => {
    setShellPhase("briefing");
    setActiveCrew("zex");
    setCrewStatus({ zex: "asking", atlas: "pending", nova: "pending", kade: "pending" });
    setStepBanner(BRIEFING_BANNER);
  }, []);

  const selectCrewOpt = useCallback((crewId: CrewId, idx: number) => {
    setCrewSelected((prev) => ({ ...prev, [crewId]: idx }));
  }, []);

  const submitCrewAnswer = useCallback((crewId: CrewId, idx?: number) => {
    setCrewSelected((prev) => {
      const q = CREW_QUESTIONS[crewId];
      const selected = idx ?? prev[crewId];
      const ok = selected === q.ans;
      setCrewStatus((s) => ({ ...s, [crewId]: ok ? "committed" : "sceptical" }));
      setActiveCrew(null);
      return idx !== undefined ? { ...prev, [crewId]: idx } : prev;
    });
  }, []);

  const prepareForStep = useCallback(
    (stepIndex: number) => {
      setShowVotePreview(false);
      if (stepIndex >= 5) {
        applyBaseline();
        return;
      }
      if (stepIndex === 4) {
        setShellPhase("briefing");
        setShowVotePreview(true);
        setStepBanner(BRIEFING_BANNER);
        return;
      }
      if (stepIndex === 3) {
        setShellPhase("briefing");
        fillAllFrames();
        setActiveCrew("zex");
        setCrewStatus({ zex: "asking", atlas: "pending", nova: "pending", kade: "pending" });
        setCrewSelected({ zex: null, atlas: null, nova: null, kade: null });
        setStepBanner(BRIEFING_BANNER);
        return;
      }
      setShellPhase("framing");
      if (stepIndex === 0) {
        applyBaseline();
        return;
      }
      if (stepIndex === 1) {
        applyBaseline();
        setChoices({ 1: { frame: "opportunity" } });
        return;
      }
      if (stepIndex === 2) {
        applyBaseline();
        fillAllFrames();
      }
    },
    [applyBaseline, fillAllFrames]
  );

  const getDemoApi = useCallback(
    (): M5TutorialDemoApi => ({
      applyBaseline,
      selectFrame,
      selectViz,
      fillRemainingCardsCorrect,
      confirmFraming,
      selectCrewOpt,
      submitCrewAnswer,
      setBanner: setStepBanner,
    }),
    [
      applyBaseline,
      confirmFraming,
      fillRemainingCardsCorrect,
      selectCrewOpt,
      selectFrame,
      selectViz,
    ]
  );

  useImperativeHandle(
    ref,
    () => ({
      root: rootRef.current,
      reset: applyBaseline,
      prepareForStep,
      getDemoApi,
    }),
    [applyBaseline, getDemoApi, prepareForStep]
  );

  useEffect(() => {
    applyBaseline();
  }, [applyBaseline]);

  const echoLines = (cardId: number) => {
    const c = choices[cardId];
    const lines: string[] = [];
    if (c?.frame) lines.push(ECHO_FRAME[cardId].msgs[c.frame]);
    if (c?.viz) lines.push(ECHO_VIZ[cardId].msgs[c.viz]);
    return lines;
  };

  return (
    <div id="gp-root" ref={rootRef} className="m5-game m5-tutorial-shell" aria-hidden="false">
      <div id="game" className="active">
        <div id="hdr">
          <div className="hdr-left">
            <i className="fas fa-terminal" aria-hidden /> MASTERMIND TERMINAL · OPERATION OMNI
          </div>
          <div className="hdr-center">MISSION 05 OF 05 / THE FINAL BRIEF</div>
          <div className="hdr-right">
            <span id="det-display" className="det-green">
              <span id="det-icon">
                <i className="fas fa-shield-alt" aria-hidden />
              </span>
              <span id="det-pct">0%</span>
              <span className="det-bar-wrap">
                <span id="det-bar" className="det-bar-green" style={{ width: "0%" }} />
              </span>
              <span style={{ fontSize: 10, letterSpacing: 1.5, opacity: 0.7 }}>DARK</span>
            </span>
            <span style={{ color: "rgba(0,196,28,.2)", margin: "0 4px" }}>|</span>
            <span id="timer">00:00</span>
            <span className="live-dot" />
            <span style={{ letterSpacing: 1, fontSize: 10 }}>LIVE</span>
          </div>
        </div>

        <div id="step-banner">{stepBanner}</div>

        <div id="main-row">
          <div id="brief-panel">
            {shellPhase === "framing" && (
              <div id="phase-framing">
                <div className="phase-label">STEP 01 — ECHO FRAMING</div>
                <div className="evidence-grid" id="ev-grid">
                  {EVIDENCE_CARDS.map((card) => {
                    const c = choices[card.id] ?? {};
                    const lines = echoLines(card.id);
                    return (
                      <div key={card.id} className="ev-card" id={`evc-${card.id}`}>
                        <div className="ev-op">{card.op}</div>
                        <div className="ev-title">{card.title}</div>
                        <div className="ev-finding">{card.finding}</div>
                        <div className="ev-qual clean">● CLEAN</div>
                        <div className="ev-choices">
                          <div className="ev-choice-label">
                            <span
                              className="gloss"
                              data-gloss={FRAME_GLOSS}
                              style={{ color: "var(--purple-light)", borderBottomColor: "rgba(143,68,232,0.5)" }}
                            >
                              FRAMING TYPE ⓘ
                            </span>
                          </div>
                          <div className="choice-btns" id={`frame-btns-${card.id}`}>
                            {frameOptionsForCard(card.id).map((opt) => (
                              <button
                                key={opt.key}
                                type="button"
                                data-key={opt.key}
                                className={`choice-btn${c.frame === opt.key ? " selected" : ""}`}
                                onClick={() => selectFrame(card.id, opt.key)}
                              >
                                <span className="cb-ico">
                                  <i className={`fas ${opt.icon}`} aria-hidden />
                                </span>
                                <span className="cb-lbl">{opt.label}</span>
                              </button>
                            ))}
                          </div>
                          <div className="ev-choice-label" style={{ marginTop: 5 }}>
                            <span
                              className="gloss"
                              data-gloss={VIZ_GLOSS}
                              style={{ color: "var(--purple-light)", borderBottomColor: "rgba(143,68,232,0.5)" }}
                            >
                              VISUALISATION ⓘ
                            </span>
                          </div>
                          <div className="choice-btns" id={`viz-btns-${card.id}`}>
                            {VIZ_OPTIONS[card.id].map((opt) => (
                              <button
                                key={opt.key}
                                type="button"
                                data-viz={opt.key}
                                className={`choice-btn${c.viz === opt.key ? " selected" : ""}`}
                                onClick={() => selectViz(card.id, opt.key)}
                              >
                                <span className="cb-ico">
                                  <i className={`fas ${opt.icon}`} aria-hidden />
                                </span>
                                <span className="cb-lbl">{opt.label}</span>
                              </button>
                            ))}
                          </div>
                          <div className={`echo-line${lines.length > 0 ? " show" : ""}`} id={`echo-${card.id}`}>
                            {lines.map((line, i) => (
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
                <button type="button" id="framing-confirm" disabled={!framingReady(choices)}>
                  ENTER THE BRIEFING ROOM →
                </button>
              </div>
            )}

            {shellPhase === "briefing" && (
              <div id="phase-briefing">
                <div className="phase-label">STEP 02 — CREW BRIEFING</div>
                {CREW_ORDER.map((crewId) => {
                  const meta = CREW_META[crewId];
                  const cs = crewStatus[crewId];
                  const q = CREW_QUESTIONS[crewId];
                  const locked = cs === "pending" && activeCrew !== crewId;
                  const rowClass = [
                    "crew-member-row",
                    locked ? "locked" : "",
                    activeCrew === crewId ? "active" : "",
                    cs === "committed" ? "committed" : "",
                    cs === "sceptical" ? "sceptical" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  const badge =
                    cs === "committed"
                      ? "COMMITTED ✓"
                      : cs === "sceptical"
                        ? "SCEPTICAL ✗"
                        : cs === "asking"
                          ? "ASKING"
                          : "PENDING";
                  return (
                    <div key={crewId} className={rowClass} id={`crew-${crewId}`}>
                      <div className="crew-top">
                        <div
                          className="crew-avatar"
                          style={{
                            background: meta.avatarBg,
                            border: `2px solid ${meta.color}`,
                            color: meta.color,
                          }}
                        >
                          {meta.initial}
                        </div>
                        <div>
                          <div className="crew-name">{meta.name}</div>
                          <div className="crew-domain">{meta.domain}</div>
                        </div>
                        <div className={`crew-status-badge ${cs}`} id={`badge-${crewId}`}>
                          {badge}
                        </div>
                      </div>
                      <div className={`crew-question${cs === "asking" ? " show" : ""}`} id={`q-${crewId}`}>
                        <div id={`q-${crewId}-text`}>{q.text}</div>
                        <div className="crew-opts" id={`opts-${crewId}`}>
                          {q.opts.map((opt, i) => (
                            <button
                              key={i}
                              type="button"
                              data-idx={String(i)}
                              className={`crew-opt${crewSelected[crewId] === i ? " selected" : ""}`}
                              onClick={() => selectCrewOpt(crewId, i)}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="crew-confirm"
                          id={`conf-${crewId}`}
                          disabled={crewSelected[crewId] === null}
                          onClick={() => submitCrewAnswer(crewId)}
                        >
                          SUBMIT →
                        </button>
                      </div>
                      {cs === "committed" && (
                        <div className="crew-verdict v-commit show" id={`verdict-${crewId}`}>
                          {q.commit}
                        </div>
                      )}
                      {cs === "sceptical" && (
                        <div className="crew-verdict v-skip show" id={`verdict-${crewId}`}>
                          Not convinced. Moving on.
                        </div>
                      )}
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
                {INTRO_CHAT.map((msg) => (
                  <div key={msg.text.slice(0, 24)} className="bm-group">
                    <div className="bm-sender">{msg.sender.toUpperCase()}</div>
                    <div className={`bm-bubble ${msg.tone}`}>{msg.text}</div>
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
      </div>

      {showVotePreview && (
        <div id="vote-overlay" className="active m5-tut-vote-preview">
          <div className="vote-card">
            <div className="vote-badge">THE VOTE</div>
            <div className="vote-title" id="vote-title">
              CREW VOTE
            </div>
            <div className="vote-tally" id="vote-tally">
              <div className="vote-pip commit" title="ZEX">
                Z
              </div>
              <div className="vote-pip commit" title="ATLAS">
                A
              </div>
              <div className="vote-pip commit" title="NOVA">
                N
              </div>
              <div className="vote-pip sceptical" title="KADE">
                K
              </div>
            </div>
            <div className="vote-voss" id="vote-voss-line">
              VOSS: Threshold met. Briefing closed.
            </div>
            <div className="vote-outcome" id="vote-outcome" style={{ color: "var(--green-stable)" }}>
              3 OF 4 COMMITS — OPERATION SHIPS
            </div>
            <div className="vote-sub" id="vote-sub">
              You needed all four specialists on board. Detection meter still applies during framing and crew Q&A.
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
