"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { M1TutorialDemoApi } from "@/lib/game/m1/tutorialDemo";
import { DET_INFO } from "@/components/missions/margus-m1/gameData";
import "@/components/missions/margus-m1/styles.css";

export type M1TutorialShellHandle = {
  root: HTMLDivElement | null;
  reset: () => void;
  prepareForStep: (stepIndex: number) => void;
  getDemoApi: () => M1TutorialDemoApi;
};

type LeadId = "compute" | "funding" | "personnel";
type LeadVisual = "n-dimmed" | "n-start" | "n-idle" | "n-active" | "n-locked";

const LEADS: Record<LeadId, { label: string }> = {
  compute: { label: "COMPUTE" },
  funding: { label: "FUNDING" },
  personnel: { label: "PERSONNEL" },
};

const LEAD_FA: Record<LeadId, string> = {
  compute: "fa-microchip",
  funding: "fa-sack-dollar",
  personnel: "fa-users",
};

const LEAD_ORDER: LeadId[] = ["compute", "funding", "personnel"];

const DESKTOP_ICONS = [
  { id: "di-it", label: "IT_Systems", top: 22, left: 14, win: "win-it" },
  { id: "di-finance", label: "Finance", top: 106, left: 14, win: "win-finance" },
  { id: "di-hr", label: "HR_Records", top: 190, left: 14, win: "win-hr" },
  { id: "di-misc", label: "Misc", top: 274, left: 14, win: "win-misc" },
  { id: "di-recycle", label: "Recycle Bin", top: 358, left: 14, emoji: "🗑️" },
];

// Demo sticky notes - different from real game to avoid spoilers
const STICKIES = [
  { id: "sty0", cls: "sticky-yellow", top: 22, right: 14, header: "REMINDERS", items: ["Team sync Monday", "Review Q2 numbers", "Call back IT dept", "Lunch w/ Sarah"] },
  { id: "sty1", cls: "sticky-pink", top: 220, right: 14, items: ["Check server logs", "Update firewall rules", "Monthly backup due"] },
  { id: "sty2", cls: "sticky-blue", top: 378, right: 14, items: ["Password reset pending", "New badge access form", "Submit expense report"] },
];

const now12 = () => {
  const n = new Date();
  let h = n.getHours();
  const m = String(n.getMinutes()).padStart(2, "0");
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
};

const now2 = () => {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
};

export const M1TutorialShell = forwardRef<M1TutorialShellHandle>(function M1TutorialShell(_, ref) {
  const rootRef = useRef<HTMLDivElement>(null);
  
  const [detection, setDetection] = useState(4);
  const [selectedLead, setSelectedLead] = useState<LeadId | null>(null);
  const [leadVisual, setLeadVisual] = useState<Record<LeadId, LeadVisual>>({
    compute: "n-start",
    funding: "n-dimmed",
    personnel: "n-dimmed",
  });
  const [leadStatus, setLeadStatus] = useState<Record<LeadId, string>>({
    compute: "START HERE →",
    funding: "LOCKED",
    personnel: "LOCKED",
  });
  const [lockedLeads, setLockedLeads] = useState<LeadId[]>([]);
  const [openWins, setOpenWins] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<Record<string, number>>({ "win-server": 0 });
  const [anomalyVisible, setAnomalyVisible] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [stepBanner, setStepBanner] = useState("Select a lead on the board to begin investigation");
  const [tbClock, setTbClock] = useState("--:--");
  const [chatTs, setChatTs] = useState("00:00");

  const applyBaseline = useCallback(() => {
    setDetection(4);
    setSelectedLead(null);
    setLeadVisual({ compute: "n-start", funding: "n-dimmed", personnel: "n-dimmed" });
    setLeadStatus({ compute: "START HERE →", funding: "LOCKED", personnel: "LOCKED" });
    setLockedLeads([]);
    setOpenWins([]);
    setActiveTab({ "win-server": 0 });
    setAnomalyVisible(false);
    setVerifyOpen(false);
    setStepBanner("Select a lead on the board to begin investigation");
  }, []);

  const selectLead = useCallback((id: LeadId) => {
    setSelectedLead(id);
    setLeadVisual((prev) => ({ ...prev, [id]: "n-active" }));
    setLeadStatus((prev) => ({ ...prev, [id]: "INVESTIGATING..." }));
  }, []);

  const openWindow = useCallback((id: string) => {
    setOpenWins((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const setActiveTabApi = useCallback((winId: string, tabIdx: number) => {
    setActiveTab((prev) => ({ ...prev, [winId]: tabIdx }));
  }, []);

  const showAnomaly = useCallback(() => {
    setAnomalyVisible(true);
  }, []);

  const triggerVerify = useCallback(() => {
    setVerifyOpen(true);
  }, []);

  const handleLeadClick = useCallback((id: LeadId) => {
    if (lockedLeads.includes(id)) return;
    selectLead(id);
    if (id === "compute") {
      openWindow("win-server");
      setActiveTab({ "win-server": 1 });
      setStepBanner("Demo window open — find the suspicious bar in the chart");
    }
  }, [lockedLeads, openWindow, selectLead]);

  const handleAnomalyClick = useCallback(() => {
    if (!anomalyVisible) {
      setAnomalyVisible(true);
      setStepBanner("Anomaly flagged — confirm your finding");
    }
  }, [anomalyVisible]);

  const handleVerifyClick = useCallback(() => {
    if (selectedLead && !lockedLeads.includes(selectedLead)) {
      setLockedLeads((prev) => [...prev, selectedLead]);
      setLeadVisual((prev) => ({ ...prev, [selectedLead]: "n-locked" }));
      setLeadStatus((prev) => ({ ...prev, [selectedLead]: "✓ LOCKED" }));
      setVerifyOpen(false);
      setAnomalyVisible(false);
      setSelectedLead(null);
      setOpenWins([]);
      setStepBanner("Lead locked — tutorial complete");
    }
  }, [selectedLead, lockedLeads]);

  const prepareForStep = useCallback((stepIndex: number) => {
    applyBaseline();

    const clickLeadStep = 6;
    const clickAnomalyStep = 7;
    const clickVerifyStep = 8;

    // Tour steps: no active lead, no windows — clean desktop for spotlight steps
    if (stepIndex < clickLeadStep) {
      setLeadVisual({ compute: "n-dimmed", funding: "n-dimmed", personnel: "n-dimmed" });
      setLeadStatus({ compute: "LOCKED", funding: "LOCKED", personnel: "LOCKED" });
      return;
    }

    if (stepIndex === clickLeadStep) {
      setLeadVisual({ compute: "n-start", funding: "n-dimmed", personnel: "n-dimmed" });
      setLeadStatus({
        compute: "START HERE →",
        funding: "LOCKED",
        personnel: "LOCKED",
      });
    } else if (stepIndex === clickAnomalyStep) {
      selectLead("compute");
      openWindow("win-server");
      setActiveTab({ "win-server": 1 });
      setStepBanner("Demo window open — find the suspicious bar in the chart");
    } else if (stepIndex === clickVerifyStep) {
      selectLead("compute");
      openWindow("win-server");
      setActiveTab({ "win-server": 1 });
      setAnomalyVisible(true);
      setStepBanner("Anomaly flagged — confirm your finding");
    }
  }, [applyBaseline, openWindow, selectLead]);

  const getDemoApi = useCallback((): M1TutorialDemoApi => ({
    applyBaseline,
    selectLead,
    openWindow,
    setActiveTab: setActiveTabApi,
    showAnomaly,
    triggerVerify,
    setStepBanner,
    getDetection: () => detection,
    setDetection,
  }), [applyBaseline, detection, openWindow, selectLead, setActiveTabApi, showAnomaly, triggerVerify]);

  useImperativeHandle(ref, () => ({
    root: rootRef.current,
    reset: applyBaseline,
    prepareForStep,
    getDemoApi,
  }), [applyBaseline, getDemoApi, prepareForStep]);

  useEffect(() => {
    applyBaseline();
  }, [applyBaseline]);

  useEffect(() => {
    const tick = () => {
      setTbClock(now12());
      setChatTs(now2());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const detState = detection < 30 ? "DARK" : detection < 60 ? "SCANNING" : detection < 80 ? "ALERT" : "CRITICAL";
  const detWrapCls = detection < 30 ? "det-green" : detection < 60 ? "det-amber" : "det-red";
  const detBarCls = detection < 30 ? "det-bar-green" : detection < 60 ? "det-bar-amber" : "det-bar-red";
  const detIcon = detection < 30 ? "fa-shield-alt" : detection < 60 ? "fa-eye" : detection < 80 ? "fa-exclamation-triangle" : "fa-skull";
  const dRound = Math.round(detection);

  return (
    <div id="m1-tutorial-root" ref={rootRef} className="margus-m1-game-root m1-tutorial-shell" aria-hidden="false">
      <div id="game" style={{ display: "flex" }}>
        {/* HEADER */}
        <div id="hdr">
          <div className="hdr-left"><i className="fas fa-terminal" aria-hidden /> MASTERMIND TERMINAL | OPERATION OMNI</div>
          <div className="hdr-center">MISSION 01 OF 05 / IDENTIFYING THE FOOTPRINT</div>
          <div className="hdr-right">
            <span id="det-cluster">
              <span id="det-display" className={detWrapCls}>
                <span id="det-icon"><i className={`fas ${detIcon}`} aria-hidden /></span>
                <span id="det-pct">{dRound}%</span>
                <span className="det-bar-wrap"><span id="det-bar" className={detBarCls} style={{ width: `${detection}%` }} /></span>
                <span id="det-label" style={{ fontSize: "clamp(10px,1vw,12px)", letterSpacing: 2, opacity: 0.7 }}>{detState}</span>
              </span>
              <span className="det-info-wrap" tabIndex={0}>
                <i className="fas fa-circle-info det-info-i" aria-hidden />
                <div className="det-info-pop" role="tooltip">
                  <div className="dip-ttl" style={{ color: DET_INFO[detState].color }}>{detState}</div>
                  <div className="dip-desc">{DET_INFO[detState].desc}</div>
                  <div className="dip-cause">Detection rises when you open the wrong files, fail a verification, or lean on hints, and slowly over time on the mirror. At 100% the operation fails.</div>
                </div>
              </span>
            </span>
            <span style={{ color: "var(--border)", margin: "0 6px" }}>|</span>
            <span id="mission-chrome">
              <span id="timer">00:00</span>
              <span className="live-dot" />
              <span style={{ letterSpacing: 1 }}>LIVE</span>
            </span>
          </div>
        </div>

        <div id="step-banner">{stepBanner}</div>

        <div id="main-row">
          {/* DESKTOP */}
          <div id="desktop-panel">
            <div id="wallpaper" className="visible" />
            
            {/* Desktop icons - vertical layout matching real game */}
            {DESKTOP_ICONS.map((ic) => {
              const leadForIcon = ic.id === "di-it" ? "compute" : ic.id === "di-finance" ? "funding" : ic.id === "di-hr" ? "personnel" : null;
              const isHighlighted = leadForIcon && selectedLead === leadForIcon;
              const isLocked = leadForIcon && lockedLeads.includes(leadForIcon);
              return (
                <div
                  key={ic.id}
                  className={`di visible${isHighlighted ? " di-mission" : ""}${isLocked ? " di-locked" : ""}`}
                  style={{ top: ic.top, left: ic.left }}
                >
                  <span className="di-icon">{ic.emoji ? ic.emoji : <i className="fas fa-folder" aria-hidden />}</span>
                  <div className="di-label">{ic.label}</div>
                </div>
              );
            })}

            {/* Sticky notes - matching real game */}
            {STICKIES.map((s) => (
              <div key={s.id} className={`sticky ${s.cls} visible`} style={{ top: s.top, right: s.right }}>
                {s.header && <span className="sticky-hdr">{s.header}</span>}
                <ul className="sticky-list">
                  {s.items.map((it, i) => <li key={i}>{it}</li>)}
                </ul>
              </div>
            ))}

            {/* Demo window - not showing real game files */}
            {openWins.includes("win-server") && (
              <div className="xp-win visible" style={{ top: 44, left: 86, width: 560 }}>
                <div className="xp-tb">
                  <div className="xp-title">
                    <span className="xp-ti"><i className="fas fa-file-excel" aria-hidden /></span>
                    demo_report.xls - Tutorial Demo
                  </div>
                  <div className="xp-btns">
                    <button className="xp-btn xp-cls" onClick={() => setOpenWins([])}>✕</button>
                  </div>
                </div>
                <div className="xp-tabs">
                  <button 
                    className={`xtab${activeTab["win-server"] === 0 ? " active" : ""}`}
                    onClick={() => setActiveTab({ "win-server": 0 })}
                  >
                    Tab A
                  </button>
                  <button 
                    className={`xtab${activeTab["win-server"] === 1 ? " active" : ""}`}
                    onClick={() => setActiveTab({ "win-server": 1 })}
                  >
                    Tab B (Anomaly)
                  </button>
                </div>
                <div className="xp-body" style={{ height: 200, padding: 12 }}>
                  {activeTab["win-server"] === 1 && (
                    <div className="chart-wrap" style={{ position: "relative" }}>
                      <div className="chart-ttl">DEMO: Sample Data Chart</div>
                      <div className="chart-sub">Tutorial example · Not real mission data</div>
                      <div className="m1-tut-demo-chart">
                        {["Q1", "Q2", "Q3", "Q4"].map((q, i) => {
                          const isAnomaly = q === "Q3";
                          const height = isAnomaly ? 92 : 25 + i * 10;
                          return (
                            <div 
                              key={q} 
                              className={`m1-tut-chart-bar${isAnomaly ? " anomaly" : ""}${isAnomaly && anomalyVisible ? " found" : ""}`}
                              style={{ height: `${height}%`, flex: 1 }}
                              onClick={isAnomaly ? handleAnomalyClick : undefined}
                              data-anomaly={isAnomaly ? "true" : undefined}
                            >
                              <span className="m1-tut-chart-label">{q}</span>
                            </div>
                          );
                        })}
                      </div>
                      {anomalyVisible && (
                        <div className="m1-tut-anomaly-panel">
                          <div className="m1-tut-anomaly-title">ANOMALY FOUND</div>
                          <p>This is a demo. In the real mission, you&apos;ll find actual anomalies hidden in the data.</p>
                          <button 
                            className="m1-tut-verify-btn"
                            onClick={handleVerifyClick}
                          >
                            ✓ VERIFY (DEMO)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {activeTab["win-server"] === 0 && (
                    <div className="chart-wrap">
                      <div className="chart-ttl">DEMO: Sample Network Data</div>
                      <div className="chart-sub">Tutorial example · Not real mission data</div>
                      <div className="m1-tut-demo-chart">
                        {["Q1", "Q2", "Q3", "Q4"].map((q, i) => (
                          <div 
                            key={q} 
                            className="m1-tut-chart-bar"
                            style={{ height: `${30 + i * 15}%`, flex: 1 }}
                          >
                            <span className="m1-tut-chart-label">{q}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Taskbar - Windows XP style */}
            <div id="xp-taskbar" className="visible">
              <button id="start-btn"><span className="start-flag">⊞</span> Start</button>
              <div className="tb-div" />
              <button className={`tb-wb${openWins.includes("win-it") ? " tb-on" : ""}`}>
                <i className="fas fa-folder" aria-hidden /> IT_Systems
              </button>
              <button className={`tb-wb${openWins.includes("win-finance") ? " tb-on" : ""}`}>
                <i className="fas fa-folder" aria-hidden /> Finance
              </button>
              <button className={`tb-wb${openWins.includes("win-hr") ? " tb-on" : ""}`}>
                <i className="fas fa-folder" aria-hidden /> HR_Records
              </button>
              <div id="tb-clock">{tbClock}</div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div id="right">
            <div id="eboard">
              <div className="eb-hdr">
                <span className="eb-htitle">EVIDENCE BOARD</span>
                <span id="eb-hint" />
              </div>
              <div id="eb-step">Lock all three leads to confirm OMNI&apos;s footprint.</div>
              <div className="eb-grid">
                {LEAD_ORDER.map((id) => (
                  <div
                    key={id}
                    className={`lead ${leadVisual[id]}`}
                    data-lead={id}
                    onClick={() => handleLeadClick(id)}
                  >
                    <div className="lead-icon">
                      <i className={`fas ${LEAD_FA[id]}`} aria-hidden />
                    </div>
                    <div className="lead-name">{LEADS[id].label}</div>
                    <div className="lead-status">{leadStatus[id]}</div>
                  </div>
                ))}
              </div>
              <div className="eb-progress">
                {LEAD_ORDER.map((id) => (
                  <div key={id} className={`ep-seg${lockedLeads.includes(id) ? " filled" : ""}`} />
                ))}
              </div>
              <button id="synth-btn" disabled>
                <i className="fas fa-circle-nodes" aria-hidden /> CONFIRM INTEL
              </button>
            </div>

            {/* Mission channel */}
            <div id="voss-wrap">
              <div className="voss-hdr">
                <div className="bk-avatar"><i className="fas fa-user-secret" aria-hidden /></div>
                <div className="bk-info">
                  <div className="bk-name">Mission Channel</div>
                  <div className="bk-members">
                    <span className="bk-member online">Voss</span><span className="bk-sep">,</span>
                    <span className="bk-member online">Zex</span><span className="bk-sep">,</span>
                    <span className="bk-member offline">Atlas</span><span className="bk-sep">,</span>
                    <span className="bk-member offline">Nova</span><span className="bk-sep">,</span>
                    <span className="bk-member offline">Kade</span>
                  </div>
                </div>
                <div className="bk-icons"><i className="fas fa-magnifying-glass" aria-hidden /> &nbsp; <i className="fas fa-lock" aria-hidden /></div>
              </div>
              <div id="voss-body">
                <div className="bm-sep"><div className="bm-sep-pill">Today</div></div>
                <div className="bm-group">
                  <div className="bm-sender s-voss">VOSS</div>
                  <div className="bm-bubble bm-d">Zex won&apos;t commit without a confirmed footprint. Everything we find goes on the board.</div>
                  <div className="bm-ts">{chatTs}</div>
                </div>
                <div className="bm-group">
                  <div className="bm-sender s-zex">ZEX</div>
                  <div className="bm-bubble bm-h">I&apos;ll be on the channel. Not committing to anything until I see real evidence.</div>
                  <div className="bm-ts">{chatTs}</div>
                </div>
              </div>
              <div className="voss-footer">
                <div className="voss-input-bar">
                  <div className="hint-wrap">
                    <button id="hint-btn" type="button" disabled><i className="fas fa-lightbulb" aria-hidden /></button>
                    <div className="hint-tooltip">Request hint · +8% detection</div>
                  </div>
                  <input id="voss-input" type="text" placeholder="Operation Channel, listen only" disabled readOnly />
                  <button type="button" className="mic-btn"><i className="fas fa-microphone" aria-hidden /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
