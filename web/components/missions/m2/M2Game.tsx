"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { M1HackOverlay } from "@/components/missions/m1/M1HackOverlay";
import { M2SynthOverlay } from "@/components/missions/m2/M2SynthOverlay";
import { MissionDebriefScreen } from "@/components/missions/shared/MissionDebriefScreen";
import { useXpWindows } from "@/components/missions/m2/useXpWindows";
import { buildM2Debrief } from "@/lib/game/debriefBuilders";
import {
  DISPUTES,
  FILES,
  HACK_LINES,
  PERSONAL_FILES,
  TOKEN_LEADS,
  VERIFY,
} from "@/lib/game/m2/data";
import { M2GameProvider, useM2Game } from "@/lib/game/m2/context";
import { getDetectionClass, getDetectionLabel } from "@/lib/game/m2/reducer";
import { useM2MissionAudio } from "@/lib/audio/useM2MissionAudio";
import { DET_INFO } from "@/components/missions/margus-m1/gameData";

const M2_DET_CAUSE =
  "Detection rises when you rule incorrectly, fail verification, request hints, or idle too long. At 100% MegaCorp closes the connection.";
import type { ChatMessage, DisputeId, FileRecord } from "@/lib/game/m2/types";

const SENDER_COLORS: Record<string, string> = {
  Atlas: "#00c41c",
  Voss: "#8f44e8",
  Zex: "#f79421",
  Nova: "#00FF41",
};

const WINDOW_CONFIG = {
  "win-tribunal": { top: 36, left: 86, width: 498, z: 112, bodyHeight: 320 },
  "win-inspector": { top: 115, left: 106, width: 432, z: 110, bodyHeight: 280 },
  "win-registry": { top: 195, left: 72, width: 458, z: 108, bodyHeight: 230 },
  "win-personal": { top: 280, left: 128, width: 370, z: 106, bodyHeight: 164 },
};

const TASKBAR = [
  { id: "win-tribunal", icon: "fa-gavel", label: "Tribunal" },
  { id: "win-registry", icon: "fa-folder", label: "Registry" },
  { id: "win-inspector", icon: "fa-magnifying-glass", label: "Inspector" },
  { id: "win-personal", icon: "fa-folder", label: "Personal" },
];

const LEAD_ICONS: Record<string, string> = {
  "lead-finance": "fa-coins",
  "lead-it": "fa-server",
  "lead-operations": "fa-cogs",
  "lead-compliance": "fa-shield-alt",
};

function regBadge(f: FileRecord) {
  return f.classification.split("—")[0].trim().split(" ")[0];
}

function InspectorBody({ fileKey }: { fileKey: string }) {
  const f = FILES[fileKey];
  if (!f) return <div className="insp-empty">No file selected.</div>;
  const unverified = /UNVERIFIED/i.test(f.steward);

  return (
    <div>
      <div className="insp-file-hdr">
        <span className="insp-file-icon">
          <i className="fas fa-file" style={{ color: "#888" }} />
        </span>
        <div>
          <div className="insp-file-name">{f.name}</div>
          <div className="insp-file-meta">
            {f.records.toLocaleString()} records · last access {f.lastAccess}
          </div>
        </div>
      </div>
      <div className="insp-section-hdr">OWNERSHIP &amp; GOVERNANCE</div>
      <div className="insp-row">
        <span className="insp-key">Source System</span>
        <span className="insp-val">{f.source}</span>
      </div>
      <div className="insp-row">
        <span className="insp-key">Data Steward ★</span>
        {unverified ? (
          <span className="insp-val" style={{ color: "#b00020", fontWeight: 700 }}>
            {f.steward}{" "}
            <span style={{ display: "inline-block", fontSize: 8, background: "#b00020", color: "#fff", padding: "1px 5px", borderRadius: 2, letterSpacing: 0.5, verticalAlign: "middle" }}>
              ⚠ NOT VERIFIED
            </span>
          </span>
        ) : (
          <span className="insp-val highlight">{f.steward}</span>
        )}
      </div>
      <div className="insp-row">
        <span className="insp-key">Classification</span>
        <span className="insp-val warn">{f.classification}</span>
      </div>
      <div className="insp-row">
        <span className="insp-key">Claimed By</span>
        <span className="insp-val">{f.claimedBy}</span>
      </div>
      <div className="insp-section-hdr">DATA LINEAGE</div>
      <div className="insp-lineage">
        {f.lineage.map((n, i) => {
          const isKey = !!f.keyNode && n === f.keyNode;
          return (
            <span key={n}>
              <span className={`lin-node${isKey ? " lin-node-key" : ""}`}>
                {n}
                {isKey ? " ★" : ""}
              </span>
              {i < f.lineage.length - 1 && <span className="lin-arrow"> → </span>}
            </span>
          );
        })}
      </div>
      {f.keyNode && (
        <div className="lin-caption">
          ★ <strong>{f.keyNode}</strong> — {f.keyNodeNote ?? "governance handoff point"}
        </div>
      )}
      <div className="insp-section-hdr">SCHEMA FIELDS</div>
      <div className="insp-schema">
        {f.schema.map((s) => (
          <span key={s} className="insp-field">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function TribunalBody({ disputeId }: { disputeId: DisputeId }) {
  const { state, dispatch } = useM2Game();
  const d = DISPUTES.find((x) => x.id === disputeId)!;
  const done = !!state.results[disputeId];
  const verified = !!state.verifyResults[disputeId];
  const [cA, cB] = d.claimants;
  const winner = d.claimants[d.correctIdx];

  return (
    <>
      <div className="trib-header">
        <div className="trib-case-id">
          CASE {d.caseId} · {d.topic}
        </div>
        <div className="trib-case-title">Ownership Conflict — {d.dataset}</div>
      </div>
      <div className="trib-claimant">
        <div className="trib-claimant-hdr cl-a">
          ⚠ CLAIMANT A — {cA.dept.toUpperCase()} &nbsp;
          <span style={{ fontWeight: 400, opacity: 0.7 }}>{cA.rep}</span>
        </div>
        <div className="trib-claimant-body" dangerouslySetInnerHTML={{ __html: cA.arg }} />
        <div className="trib-evidence">
          Evidence: <strong>{d.dataset}</strong> — double-click in the Registry to inspect
        </div>
      </div>
      <div className="trib-claimant">
        <div className="trib-claimant-hdr cl-b">
          ⚠ CLAIMANT B — {cB.dept.toUpperCase()} &nbsp;
          <span style={{ fontWeight: 400, opacity: 0.7 }}>{cB.rep}</span>
        </div>
        <div className="trib-claimant-body" dangerouslySetInnerHTML={{ __html: cB.arg }} />
      </div>
      {!done && (
        <div className="trib-verdict-row">
          {([0, 1] as const).map((idx) => {
            const c = d.claimants[idx];
            return (
              <button
                key={idx}
                type="button"
                className={`trib-btn trib-btn-${idx === 0 ? "a" : "b"}${state.wrongShake === idx ? " wrong-shake" : ""}`}
                onClick={() => dispatch({ type: "RULE", disputeId, chosenIdx: idx })}
              >
                <span className="trib-btn-name">RULE FOR {c.dept.toUpperCase()}</span>
                <span className="trib-btn-role">{c.rep}</span>
              </button>
            );
          })}
        </div>
      )}
      {done && !verified && (
        <div className="trib-ruling-done">
          <strong>✓ RULING RECORDED:</strong> {winner.dept} ({winner.rep})
          <br />
          <span style={{ color: "#555", fontSize: 10 }}>{d.settleFact}</span>
          <br />
          <br />
          <span style={{ color: "#555", fontSize: 10, display: "block", marginBottom: 6 }}>
            Verification panel opens automatically. If you closed it:
          </span>
          <button
            type="button"
            onClick={() => dispatch({ type: "OPEN_VERIFY", disputeId })}
            style={{
              background: "linear-gradient(to bottom,#2b5edb,#1239b4)",
              border: "1px solid #0a2a8a",
              color: "#fff",
              padding: "5px 14px",
              fontFamily: "Tahoma,sans-serif",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              borderRadius: 3,
              boxShadow: "1px 1px 0 rgba(255,255,255,.15) inset",
            }}
          >
            ↻ Reopen Verification Panel
          </button>
        </div>
      )}
      {verified && (
        <div className="trib-ruling-done" style={{ background: "#f0fdf4", borderTop: "2px solid #28a745" }}>
          <strong>✓ RULING + VERIFICATION COMPLETE</strong>
          <br />
          {winner.dept} — Token extracted.
        </div>
      )}
    </>
  );
}

/** Mission channel with the original's typing-dots reveal (650ms per message). */
function MissionChannel({ messages }: { messages: ChatMessage[] }) {
  const [revealed, setRevealed] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const pending = messages.length > revealed;

  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => setRevealed((r) => r + 1), 650);
    return () => clearTimeout(t);
  }, [pending, revealed]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [revealed, pending]);

  const shown = messages.slice(0, revealed);
  const next = pending ? messages[revealed] : null;
  const nextShowsSender = next && (revealed === 0 || shown[revealed - 1]?.sender !== next.sender);

  return (
    <div id="voss-body" ref={bodyRef}>
      <div className="bm-sep">
        <div className="bm-sep-pill">TODAY</div>
      </div>
      {shown.map((m, i) => {
        const showSender = i === 0 || shown[i - 1].sender !== m.sender;
        return (
          <div key={m.id} className="bm-group">
            {showSender && (
              <div className="bm-sender" style={{ color: SENDER_COLORS[m.sender] ?? "#7fa8cc" }}>
                {m.sender.toUpperCase()}
              </div>
            )}
            <div className={`bm-bubble ${m.tone} show`}>{m.text}</div>
            <div className="bm-ts">{m.ts}</div>
          </div>
        );
      })}
      {next && (
        <div className="bm-typing-wrap">
          {nextShowsSender && (
            <div className="bm-sender" style={{ color: SENDER_COLORS[next.sender] ?? "#7fa8cc" }}>
              {next.sender.toUpperCase()}
            </div>
          )}
          <div className="bm-typing">
            <span className="tdot" />
            <span className="tdot" />
            <span className="tdot" />
          </div>
        </div>
      )}
    </div>
  );
}

function TaskbarClock() {
  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () => {
      const t = new Date();
      setClock(`${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`);
    };
    tick();
    const iv = setInterval(tick, 10000);
    return () => clearInterval(iv);
  }, []);
  return <div id="tb-clock">{clock}</div>;
}

function HintCooldown({ active }: { active: boolean }) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!active) {
      setSec(0);
      return;
    }
    setSec(30);
    const iv = setInterval(() => setSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(iv);
  }, [active]);
  if (!active || sec <= 0) return null;
  return <div id="hint-cd" className="show">{sec}</div>;
}

function M2GameInner() {
  const { state, dispatch } = useM2Game();
  const router = useRouter();
  const desktopRef = useRef<HTMLDivElement>(null);
  const windows = useXpWindows(WINDOW_CONFIG, desktopRef);
  useM2MissionAudio({
    phase: state.phase,
    hackDone: state.hackDone,
    tokensLen: state.tokens.length,
    wrongRulings: state.wrongRulings,
    verifyErrors: state.verifyErrors,
    detection: state.detection,
    gameOver: state.gameOver,
  });
  const [lang, setLang] = useState<"en" | "nl">("en");
  const preVerifyLeft = useRef<number | null>(null);
  const prevOpenRef = useRef<string[]>([]);

  const timer = `${String(Math.floor(state.timerSec / 60)).padStart(2, "0")}:${String(state.timerSec % 60).padStart(2, "0")}`;
  const det = Math.round(state.detection);
  const detClass = getDetectionClass(det);
  const detLabel = getDetectionLabel(det);
  const detInfo = DET_INFO[detLabel] ?? DET_INFO.DARK;
  const barClass = det < 35 ? "det-bar-green" : det < 70 ? "det-bar-amber" : "det-bar-red";
  const detIcon = det < 35 ? "fa-shield-alt" : det < 70 ? "fa-eye" : "fa-exclamation-triangle";

  // Restore + focus windows the reducer opens (e.g. Inspector on file dblclick).
  useEffect(() => {
    const prev = prevOpenRef.current;
    const added = state.openWindows.filter((w) => !prev.includes(w));
    prevOpenRef.current = state.openWindows;
    added.forEach((id) => windows.restore(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.openWindows]);

  // Re-focus inspector when a new file is inspected.
  useEffect(() => {
    if (state.selectedFile) windows.restore("win-inspector");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedFile]);

  // Nudge the tribunal window left while the verify panel is open (original behaviour).
  useEffect(() => {
    if (state.verifyOpen) {
      const left = windows.geoms["win-tribunal"].left;
      if (left > 80) {
        preVerifyLeft.current = left;
        windows.setLeft("win-tribunal", 20);
      }
    } else if (preVerifyLeft.current != null) {
      windows.setLeft("win-tribunal", preVerifyLeft.current);
      preVerifyLeft.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.verifyOpen]);

  // Clear post-confirm chip feedback after 2.2s (original resets the chips then).
  useEffect(() => {
    if (!state.verifyFeedback) return;
    const t = setTimeout(() => dispatch({ type: "CLEAR_VERIFY_FEEDBACK" }), 2200);
    return () => clearTimeout(t);
  }, [state.verifyFeedback, dispatch]);

  const openWin = useCallback(
    (id: string) => {
      dispatch({ type: "OPEN_WINDOW", windowId: id });
      windows.restore(id);
    },
    [dispatch, windows]
  );

  const openDisputeById = useCallback(
    (id: DisputeId) => {
      if (state.verifyResults[id]) return;
      if (state.results[id] === "correct") {
        dispatch({ type: "OPEN_VERIFY", disputeId: id });
        return;
      }
      dispatch({ type: "LOAD_DISPUTE", id });
      windows.restore("win-tribunal");
    },
    [state.verifyResults, state.results, dispatch, windows]
  );

  const completeMission = useCallback(async () => {
    await fetch("/api/progress", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        missionId: "m2",
        status: "completed",
        checkpoint: "completed",
        score: state.score,
        stateJson: {
          version: 2,
          timerSec: state.timerSec,
          tokens: state.tokens.length,
          wrongRulings: state.wrongRulings,
          verifyErrors: state.verifyErrors,
          hintsUsed: state.hintsUsed,
        },
      }),
    });
    router.push("/mission/m3");
    router.refresh();
  }, [router, state.hintsUsed, state.score, state.timerSec, state.tokens.length, state.verifyErrors, state.wrongRulings]);

  const debrief = useMemo(() => buildM2Debrief(state), [state]);

  const activeDispute = state.activeDispute ?? 1;
  const vd = state.verifyDispute ? VERIFY[state.verifyDispute] : null;
  const fb = state.verifyFeedback;
  const allAnswered = vd ? vd.questions.every((_, qi) => state.vpSelections[qi] !== undefined) : false;
  const completeCount = Object.keys(state.verifyResults).length;

  // Desktop-icon attention cue: registry pulses while a dispute needs evidence
  // and the player has not yet opened the Registry or Inspector.
  const registryCue =
    state.hackDone &&
    state.tokens.length < 4 &&
    state.activeDispute != null &&
    !state.verifyResults[state.activeDispute] &&
    !state.everOpened.includes("win-registry") &&
    !state.everOpened.includes("win-inspector");
  const tribunalCue = state.hackDone && !state.everOpened.includes("win-tribunal");

  const isWinShown = (id: string) => state.openWindows.includes(id) && !windows.geoms[id].minimized;

  const winChrome = (id: string, icon: string, iconColor: string, title: string, menu: string[]) => (
    <>
      <div className="xp-tb" onMouseDown={(e) => windows.startDrag(e, id)}>
        <span className="xp-ti">
          <i className={`fas ${icon}`} style={{ color: iconColor }} />
        </span>
        <span className="xp-title">{title}</span>
        <div className="xp-btns">
          <button type="button" className="xp-btn xp-min" onMouseDown={(e) => e.stopPropagation()} onClick={() => windows.minimize(id)}>
            ─
          </button>
          <button type="button" className="xp-btn xp-max" onMouseDown={(e) => e.stopPropagation()} onClick={() => windows.toggleMaximize(id)}>
            □
          </button>
          <button type="button" className="xp-btn xp-cls" onMouseDown={(e) => e.stopPropagation()} onClick={() => dispatch({ type: "CLOSE_WINDOW", windowId: id })}>
            ✕
          </button>
        </div>
      </div>
      <div className="xp-menu">
        {menu.map((m) => (
          <span key={m} className="xpm">
            {m}
          </span>
        ))}
      </div>
    </>
  );

  const winClass = (id: string) =>
    `xp-win${state.openWindows.includes(id) && !windows.geoms[id].minimized ? " visible" : ""}${windows.geoms[id].maximized ? " xp-maximised" : ""}`;

  const bodyHeight = (id: string) => (windows.geoms[id].maximized ? undefined : windows.geoms[id].bodyHeight ?? undefined);

  return (
    <div className="m2-mission gp-html-active">
      {state.phase === "hack" && <M1HackOverlay lines={HACK_LINES} visibleCount={state.hackLine + 1} />}

      <div id="gp-root" className={state.hackDone ? "active" : ""}>
        <div id="game">
          <div id="hdr">
            <div className="hdr-left">
              <i className="fas fa-terminal" /> MASTERMIND TERMINAL · OPERATION OMNI
            </div>
            <div className="hdr-center">MISSION 02 OF 05 / FORGING THE MASTER KEY</div>
            <div className="hdr-right">
              <span id="det-cluster">
                <span id="det-display" className={detClass}>
                  <span id="det-icon">
                    <i className={`fas ${detIcon}`} aria-hidden />
                  </span>
                  <span id="det-pct">{det}%</span>
                  <span className="det-bar-wrap">
                    <span id="det-bar" className={barClass} style={{ width: `${det}%` }} />
                  </span>
                  <span id="det-label" style={{ fontSize: "clamp(10px,1vw,12px)", letterSpacing: 2, opacity: 0.7 }}>
                    {detLabel}
                  </span>
                </span>
                <span className="det-info-wrap" tabIndex={0}>
                  <i className="fas fa-circle-info det-info-i" aria-hidden />
                  <div className="det-info-pop" role="tooltip">
                    <div className="dip-ttl" style={{ color: detInfo.color }}>
                      {detLabel}
                    </div>
                    <div className="dip-desc">{detInfo.desc}</div>
                    <div className="dip-cause">{M2_DET_CAUSE}</div>
                  </div>
                </span>
              </span>
              <span style={{ color: "rgba(0,196,28,.2)", margin: "0 4px" }}>|</span>
              <div className="lang-toggle">
                <button className={`lang-btn${lang === "en" ? " active" : ""}`} onClick={() => setLang("en")}>
                  EN
                </button>
                <button className={`lang-btn${lang === "nl" ? " active" : ""}`} onClick={() => setLang("nl")}>
                  NL
                </button>
              </div>
              <span id="timer">{timer}</span>
              <span className="live-dot" />
              <span style={{ letterSpacing: 1, fontSize: 10 }}>LIVE</span>
            </div>
          </div>

          <div id="step-banner">{state.stepBanner}</div>

          <div id="main-row">
            <div id="desktop-panel" ref={desktopRef}>
              <div id="wallpaper" className="visible" />

              {/* Desktop icons */}
              <div
                className={`di visible${tribunalCue ? " di-mission" : ""}`}
                id="icon-tribunal"
                style={{ top: 20, left: 12 }}
                onDoubleClick={() => openWin("win-tribunal")}
              >
                <span className="di-icon">
                  <i className="fas fa-gavel" />
                </span>
                <div className="di-label">Governance_Tribunal</div>
              </div>
              <div
                className={`di visible${registryCue ? " di-mission" : ""}`}
                id="icon-registry"
                style={{ top: 118, left: 12 }}
                onDoubleClick={() => openWin("win-registry")}
              >
                <span className="di-icon">
                  <i className="fas fa-folder" />
                </span>
                <div className="di-label">Data_Registry</div>
              </div>
              <div className="di visible" style={{ top: 216, left: 12 }} onDoubleClick={() => openWin("win-inspector")}>
                <span className="di-icon">
                  <i className="fas fa-magnifying-glass" />
                </span>
                <div className="di-label">File_Inspector</div>
              </div>
              <div className="di visible" style={{ top: 314, left: 12 }} onDoubleClick={() => openWin("win-personal")}>
                <span className="di-icon" style={{ color: "#f0c538" }}>
                  <i className="fas fa-folder" />
                </span>
                <div className="di-label">Marshall_Personal</div>
              </div>
              <div className="di visible" style={{ top: 400, left: 12 }}>
                <span className="di-icon" style={{ color: "#888" }}>
                  <i className="fas fa-trash-alt" />
                </span>
                <div className="di-label">Recycle Bin</div>
              </div>

              {/* Stickies */}
              <div className="sticky sticky-yellow visible" style={{ top: 18, right: 12 }}>
                <span className="sticky-hdr">THIS WEEK</span>
                {"SFO flight Fri 6am\nJenkins call Wed\nSub-Acct 7 → do NOT escalate\nDentist Thurs"}
              </div>
              <div className="sticky sticky-pink visible" style={{ top: 200, right: 12 }}>
                {"CFO verbal 09/14\n$47.2M — keep off tracker\ndo not log"}
              </div>
              <div className="sticky sticky-blue visible" style={{ top: 352, right: 12 }}>
                {"voicemail — Stanton 09/28\n847TB out.\nThey have no idea.\ndelete this"}
              </div>

              {/* Tribunal window */}
              <div className={winClass("win-tribunal")} id="win-tribunal" style={windows.styleFor("win-tribunal")}>
                {winChrome("win-tribunal", "fa-gavel", "#f0c538", "Governance_Tribunal.exe — Ownership Dispute", ["Case", "Evidence", "View"])}
                <div className="xp-body" style={{ height: bodyHeight("win-tribunal") }} id="tribunal-body">
                  {state.activeDispute == null ? (
                    <div style={{ padding: "28px 18px", textAlign: "center", fontFamily: "'Tahoma',sans-serif", fontSize: 11, color: "#888", lineHeight: 1.8 }}>
                      No case loaded.
                      <br />
                      Select a dispute from the queue on the right.
                    </div>
                  ) : (
                    <TribunalBody disputeId={activeDispute} />
                  )}
                </div>
                <div className="xp-status">
                  <span id="tribunal-status">
                    {state.activeDispute == null
                      ? "No case loaded"
                      : `Case: ${DISPUTES.find((d) => d.id === activeDispute)!.caseId} — ${
                          !state.results[activeDispute] ? "AWAITING RULING" : !state.verifyResults[activeDispute] ? "VERIFY PENDING" : "COMPLETE ✓"
                        }`}
                  </span>
                  <span id="tribunal-counter" style={{ marginLeft: "auto", fontSize: 10 }}>
                    {completeCount}/4 complete
                  </span>
                </div>
                <div className="xp-grip" onMouseDown={(e) => windows.startResize(e, "win-tribunal")} />
              </div>

              {/* Inspector window */}
              <div className={winClass("win-inspector")} id="win-inspector" style={windows.styleFor("win-inspector")}>
                {winChrome("win-inspector", "fa-magnifying-glass", "#90caf9", "File_Inspector.exe — Metadata Viewer", ["File", "Inspect"])}
                <div className="xp-body" style={{ height: bodyHeight("win-inspector") }} id="inspector-body">
                  {state.selectedFile ? (
                    <InspectorBody fileKey={state.selectedFile} />
                  ) : (
                    <div className="insp-empty">
                      Double-click any file in the Data Registry
                      <br />
                      to inspect its metadata here.
                    </div>
                  )}
                </div>
                <div className="xp-status">
                  <span id="inspector-status">
                    {state.selectedFile ? `${FILES[state.selectedFile].name} — ${FILES[state.selectedFile].records.toLocaleString()} records` : "No file selected"}
                  </span>
                </div>
                <div className="xp-grip" onMouseDown={(e) => windows.startResize(e, "win-inspector")} />
              </div>

              {/* Registry window */}
              <div className={winClass("win-registry")} id="win-registry" style={windows.styleFor("win-registry")}>
                {winChrome("win-registry", "fa-folder", "#f0c538", "Data_Governance_Registry — C:\\MegaCorp\\Governance\\", ["File", "View", "Tools"])}
                <div className="xp-body" style={{ height: bodyHeight("win-registry") }}>
                  <table className="reg-table">
                    <thead>
                      <tr>
                        <th>FILENAME</th>
                        <th>CLAIMED BY</th>
                        <th>CLASS.</th>
                        <th>RECORDS</th>
                      </tr>
                    </thead>
                    <tbody id="reg-tbody">
                      {Object.entries(FILES).map(([key, f]) => (
                        <tr
                          key={key}
                          className={state.selectedFile === key ? "reg-selected" : undefined}
                          style={
                            state.highlightDispute && f.dispute === state.highlightDispute
                              ? { background: "rgba(247,148,33,.10)", outline: "1px solid rgba(247,148,33,.35)" }
                              : undefined
                          }
                          onDoubleClick={() => dispatch({ type: "INSPECT_FILE", fileKey: key })}
                        >
                          <td>
                            <i className="fas fa-file" style={{ color: "#888", marginRight: 4 }} />
                            {f.name}
                          </td>
                          <td>{f.claimedBy}</td>
                          <td>
                            <span className={`reg-badge ${f.cls}`}>{regBadge(f)}</span>
                          </td>
                          <td>{f.records.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="xp-status">
                  <span id="registry-status">{Object.keys(FILES).length} files — double-click to inspect</span>
                </div>
                <div className="xp-grip" onMouseDown={(e) => windows.startResize(e, "win-registry")} />
              </div>

              {/* Marshall personal (decoy) window */}
              <div className={winClass("win-personal")} id="win-personal" style={windows.styleFor("win-personal")}>
                {winChrome("win-personal", "fa-folder", "#f0c538", "Marshall_Personal — C:\\Users\\DMarshall\\Documents\\", ["File", "Edit", "View"])}
                <div className="xp-body" style={{ height: bodyHeight("win-personal") }}>
                  <div className="folder-grid">
                    {PERSONAL_FILES.map((f) => (
                      <div key={f.key} className="fg-item" onDoubleClick={() => dispatch({ type: "DECOY_PERSONAL", key: f.key })}>
                        <div className="fg-icon">
                          <i className={`fas ${f.icon}`} />
                        </div>
                        <div className="fg-label">{f.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="xp-status">
                  <span>5 objects · Last modified: 29-Sep-2003</span>
                </div>
                <div className="xp-grip" onMouseDown={(e) => windows.startResize(e, "win-personal")} />
              </div>

              {/* Verify panel */}
              <div id="verify-panel" className={state.verifyOpen ? "open" : ""}>
                <button id="verify-toggle" className={vd ? "show" : ""} title="Toggle verification panel" onClick={() => dispatch({ type: "TOGGLE_VERIFY" })}>
                  {state.verifyOpen ? "‹" : "›"}
                </button>
                <div className="cp-hdr">
                  <div className="cp-node" id="vp-node">
                    {vd ? vd.title : "SECURITY VERIFICATION"}
                  </div>
                  <div className="cp-sub" id="vp-sub">
                    {vd ? vd.sub : "Answer the questions to extract the access token."}
                  </div>
                </div>
                <div className="cp-body">
                  <div className="cp-params" id="vp-params">
                    {vd &&
                      vd.questions.map((q, qi) => (
                        <div key={qi}>
                          <div className="cp-param">
                            <div className="cp-plbl">
                              {qi + 1}. {q.label}
                              <span className="cp-note">{q.note}</span>
                            </div>
                            <div className="cp-chips">
                              {q.opts.map((opt, ci) => {
                                let cls = "cp-chip";
                                if (fb) {
                                  if (fb.correct[qi] && fb.selections[qi] === ci) cls += " cp-correct cp-disabled";
                                  else if (!fb.correct[qi] && fb.selections[qi] === ci) cls += " cp-wrong";
                                  else cls += " cp-disabled";
                                } else if (state.vpSelections[qi] === ci) {
                                  cls += " cp-sel";
                                }
                                return (
                                  <button key={opt} type="button" className={cls} disabled={!!fb} onClick={() => dispatch({ type: "SELECT_CHIP", qi, ci })}>
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                            <div className={`cp-err${fb && !fb.correct[qi] ? " show" : ""}`}>{q.err}</div>
                          </div>
                          {qi < vd.questions.length - 1 && <div className="cp-divider" />}
                        </div>
                      ))}
                  </div>
                </div>
                <div className="cp-foot">
                  <button className="cp-ok" id="vp-confirm" disabled={!vd || !allAnswered || !!fb} onClick={() => dispatch({ type: "CONFIRM_VERIFY" })}>
                    ▶ EXTRACT TOKEN
                  </button>
                </div>
              </div>

              {/* Taskbar */}
              <div id="xp-taskbar" className="visible">
                <button id="start-btn">⊞ Start</button>
                <div className="tb-div" />
                {TASKBAR.map((t) => (
                  <button
                    key={t.id}
                    className={`tb-wb${isWinShown(t.id) ? " tb-on" : ""}`}
                    onClick={() => windows.taskbarToggle(t.id, state.openWindows.includes(t.id), (id) => dispatch({ type: "OPEN_WINDOW", windowId: id }))}
                  >
                    <i className={`fas ${t.icon}`} /> {t.label}
                  </button>
                ))}
                <TaskbarClock />
              </div>
            </div>

            {/* Right panel */}
            <div id="right">
              <div id="eboard">
                <div className="eb-hdr">
                  <span className="eb-htitle">KEY FORGE</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--amber)" }} id="eb-count">
                    {state.tokenCount}
                  </span>
                </div>
                <div className="eb-grid">
                  {DISPUTES.map((d) => {
                    const meta = TOKEN_LEADS[d.token];
                    return (
                      <div key={d.id} className={`lead ${state.leadStatus[meta.leadId] ?? "n-dimmed"}`} id={meta.leadId} onClick={() => openDisputeById(d.id)}>
                        <div className="lead-icon">
                          <i className={`fas ${LEAD_ICONS[meta.leadId]}`} />
                        </div>
                        <div className="lead-name">{meta.label}</div>
                        <div className="lead-status" id={meta.lsId}>
                          {state.leadStatusText[meta.leadId]}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="eb-progress">
                  {DISPUTES.map((d) => (
                    <div key={d.id} className={`ep-seg${state.verifyResults[d.id] ? " filled" : ""}`} id={TOKEN_LEADS[d.token].segId} />
                  ))}
                </div>
                <button id="synth-btn" className={state.tokens.length >= 4 ? "ready" : ""} disabled={state.tokens.length < 4} onClick={() => dispatch({ type: "START_SYNTH" })}>
                  <i className="fas fa-key" /> COMPILE MASTER KEY
                </button>
              </div>

              <div id="voss-wrap">
                <div className="voss-hdr">
                  <div className="bk-avatar">
                    <i className="fas fa-user-secret" />
                  </div>
                  <div className="bk-info">
                    <div className="bk-name">Mission Channel</div>
                    <div className="bk-members">
                      <span className="bk-member online">Voss</span>
                      <span className="bk-sep">,</span>
                      <span className="bk-member online">Atlas</span>
                      <span className="bk-sep">,</span>
                      <span className="bk-member online">Zex</span>
                      <span className="bk-sep">,</span>
                      <span className="bk-member offline">Nova</span>
                      <span className="bk-sep">,</span>
                      <span className="bk-member offline">Kade</span>
                    </div>
                  </div>
                  <div className="bk-icons">
                    <i className="fas fa-lock" />
                  </div>
                </div>
                <MissionChannel messages={state.messages} />
                <div className="voss-footer">
                  <div className="voss-input-bar">
                    <div className="hint-wrap">
                      <button id="hint-btn" disabled={state.hintCooldown} onClick={() => dispatch({ type: "REQUEST_HINT" })} title="Request hint">
                        💡
                      </button>
                      <div className="hint-tooltip">REQUEST HINT · −100 pts</div>
                      <HintCooldown active={state.hintCooldown} />
                    </div>
                    <input id="voss-input" readOnly placeholder="// channel encrypted — read only" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {state.phase === "synth" && <M2SynthOverlay onDone={() => dispatch({ type: "SYNTH_DONE" })} />}

      {state.phase === "debrief" && <MissionDebriefScreen config={debrief} onContinue={completeMission} />}
    </div>
  );
}

export function M2Game({ savedState }: { savedState?: Record<string, unknown> | null }) {
  return (
    <M2GameProvider savedState={savedState}>
      <M2GameInner />
    </M2GameProvider>
  );
}
