"use client";

/**
 * M2 tutorial shell — React component (same pattern as M1TutorialShell).
 * Visual design reference: reference/legacy-missions/Mission 2.html
 * Not wired to M2Game.tsx / backend gameplay.
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import "@/app/m2-game.css";
import {
  TUT_CLAIMANTS,
  TUT_CORRECT_RULING_IDX,
  TUT_CASE_ID,
  TUT_DEMO_FILE,
  TUT_VERIFY,
  type M2TutorialDemoApi,
} from "@/lib/game/m2/tutorialDemo";
import { DET_INFO } from "@/components/missions/margus-m1/gameData";

const M2_DET_CAUSE =
  "Detection rises when you rule incorrectly, fail verification, request hints, or idle too long. At 100% MegaCorp closes the connection.";

export type M2TutorialShellHandle = {
  root: HTMLDivElement | null;
  reset: () => void;
  prepareForStep: (stepIndex: number) => void;
  getDemoApi: () => M2TutorialDemoApi;
};

const TOKEN_LEADS = [
  { id: "lead-finance", segId: "ep-finance", lsId: "ls-finance", label: "FINANCE", icon: "fa-coins" },
  { id: "lead-it", segId: "ep-it", lsId: "ls-it", label: "IT", icon: "fa-server" },
  { id: "lead-operations", segId: "ep-operations", lsId: "ls-operations", label: "OPERATIONS", icon: "fa-cogs" },
  { id: "lead-compliance", segId: "ep-compliance", lsId: "ls-compliance", label: "COMPLIANCE", icon: "fa-shield-alt" },
] as const;

type DesktopIcon = {
  id: string;
  label: string;
  top: number;
  left: number;
  icon: string;
  win?: string;
  mission?: boolean;
  iconColor?: string;
};

const DESKTOP_ICONS: DesktopIcon[] = [
  { id: "di-tribunal", label: "Governance_Tribunal", top: 20, left: 12, win: "win-tribunal", icon: "fa-gavel", mission: true },
  { id: "di-registry", label: "Data_Registry", top: 118, left: 12, win: "win-registry", icon: "fa-folder" },
  { id: "di-inspector", label: "File_Inspector", top: 216, left: 12, win: "win-inspector", icon: "fa-magnifying-glass" },
  { id: "di-personal", label: "Marshall_Personal", top: 314, left: 12, icon: "fa-folder", iconColor: "#f0c538" },
  { id: "di-recycle", label: "Recycle Bin", top: 400, left: 12, icon: "fa-trash-alt", iconColor: "#888" },
];

const STICKIES = [
  {
    id: "sty-week",
    cls: "sticky-yellow",
    top: 18,
    right: 12,
    header: "THIS WEEK",
    body: "SFO flight Fri 6am\nJenkins call Wed\nSub-Acct 7 → do NOT escalate\nDentist Thurs",
  },
  {
    id: "sty-cfo",
    cls: "sticky-pink",
    top: 200,
    right: 12,
    body: "CFO verbal 09/14\n$47.2M — keep off tracker\ndo not log",
  },
  {
    id: "sty-stanton",
    cls: "sticky-blue",
    top: 352,
    right: 12,
    body: "voicemail — Stanton 09/28\n847TB out.\nThey have no idea.\ndelete this",
  },
] as const;

const TASKBAR_BUTTONS = [
  { win: "win-tribunal", label: "Tribunal", icon: "fa-gavel" },
  { win: "win-registry", label: "Registry", icon: "fa-folder" },
  { win: "win-inspector", label: "Inspector", icon: "fa-magnifying-glass" },
  { win: "win-personal", label: "Personal", icon: "fa-folder" },
] as const;

const now12 = () => {
  const n = new Date();
  let h = n.getHours();
  const m = String(n.getMinutes()).padStart(2, "0");
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
};

const DEFAULT_BANNER =
  "Open the Governance Tribunal — read the active dispute, inspect the evidence file, then rule on ownership";

const LEAD_STATUS_IDLE: Record<string, string> = {
  "lead-finance": "START HERE →",
  "lead-it": "LOCKED",
  "lead-operations": "LOCKED",
  "lead-compliance": "LOCKED",
};

const LEAD_CLASS_IDLE: Record<string, string> = {
  "lead-finance": "n-start",
  "lead-it": "n-dimmed",
  "lead-operations": "n-dimmed",
  "lead-compliance": "n-dimmed",
};

function XpTitleBar({
  iconClass,
  iconColor,
  title,
  menu,
}: {
  iconClass: string;
  iconColor: string;
  title: string;
  menu: string[];
}) {
  return (
    <>
      <div className="xp-tb">
        <span className="xp-ti">
          <i className={iconClass} style={{ color: iconColor }} />
        </span>
        <span className="xp-title">{title}</span>
        <div className="xp-btns">
          <button type="button" className="xp-btn xp-min" tabIndex={-1}>
            ─
          </button>
          <button type="button" className="xp-btn xp-max" tabIndex={-1}>
            □
          </button>
          <button type="button" className="xp-btn xp-cls" tabIndex={-1}>
            ✕
          </button>
        </div>
      </div>
      <div className="xp-menu">
        {menu.map((item) => (
          <span key={item} className="xpm">
            {item}
          </span>
        ))}
      </div>
    </>
  );
}

export const M2TutorialShell = forwardRef<M2TutorialShellHandle>(function M2TutorialShell(_, ref) {
  const rootRef = useRef<HTMLDivElement>(null);
  const demoFlagsRef = useRef({
    registrySelected: false,
    ruledCorrect: false,
    verifyComplete: false,
    tokenLocked: false,
  });

  const [stepBanner, setStepBanner] = useState(DEFAULT_BANNER);
  const [openWindows, setOpenWindows] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState(false);
  const [ruledCorrect, setRuledCorrect] = useState(false);
  const [wrongShake, setWrongShake] = useState<number | null>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyInteractive, setVerifyInteractive] = useState(false);
  const [vpSelections, setVpSelections] = useState<(number | undefined)[]>([undefined, undefined]);
  const [verifyComplete, setVerifyComplete] = useState(false);
  const [leadStatus, setLeadStatus] = useState(LEAD_STATUS_IDLE);
  const [leadClass, setLeadClass] = useState(LEAD_CLASS_IDLE);
  const [filledSegs, setFilledSegs] = useState<string[]>([]);
  const [tokenCount, setTokenCount] = useState(0);
  const [ebStep, setEbStep] = useState("DISPUTE 1 OF 4");
  const [tbClock, setTbClock] = useState("9:14 AM");
  const [registryPickActive, setRegistryPickActive] = useState(false);
  const detection = 4;

  const applyBaseline = useCallback(() => {
    demoFlagsRef.current = {
      registrySelected: false,
      ruledCorrect: false,
      verifyComplete: false,
      tokenLocked: false,
    };
    setStepBanner(DEFAULT_BANNER);
    setOpenWindows([]);
    setSelectedFile(false);
    setRuledCorrect(false);
    setWrongShake(null);
    setVerifyOpen(false);
    setVerifyInteractive(false);
    setVpSelections([undefined, undefined]);
    setVerifyComplete(false);
    setLeadStatus({ ...LEAD_STATUS_IDLE });
    setLeadClass({ ...LEAD_CLASS_IDLE });
    setFilledSegs([]);
    setTokenCount(0);
    setEbStep("DISPUTE 1 OF 4");
    setRegistryPickActive(false);
  }, []);

  const openWindow = useCallback((id: string) => {
    setOpenWindows((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const handleRegistryClick = useCallback(() => {
    demoFlagsRef.current.registrySelected = true;
    setRegistryPickActive(false);
    setSelectedFile(true);
    openWindow("win-inspector");
    setStepBanner("File Inspector open — read the Data Steward before ruling");
  }, [openWindow]);

  const handleRule = useCallback(
    (idx: 0 | 1) => {
      if (ruledCorrect) return;
      if (idx === TUT_CORRECT_RULING_IDX) {
        demoFlagsRef.current.ruledCorrect = true;
        setRuledCorrect(true);
        setVerifyOpen(true);
        setVerifyInteractive(true);
        setStepBanner("Step 2: Answer verification questions in the side panel — use the Inspector to find the answers");
      } else {
        setWrongShake(idx);
        setStepBanner("Wrong owner — read the Data Steward in the Inspector and try again");
        window.setTimeout(() => setWrongShake(null), 500);
      }
    },
    [ruledCorrect]
  );

  const handleChip = useCallback(
    (qi: number, ci: number) => {
      if (!verifyInteractive || verifyComplete) return;
      setVpSelections((prev) => {
        const next = [...prev];
        next[qi] = ci;
        return next;
      });
    },
    [verifyComplete, verifyInteractive]
  );

  const handleConfirmVerify = useCallback(() => {
    if (!verifyInteractive || verifyComplete) return;
    const allSelected = TUT_VERIFY.questions.every((_, qi) => vpSelections[qi] !== undefined);
    if (!allSelected) return;

    const allCorrect = TUT_VERIFY.questions.every((q, qi) => vpSelections[qi] === q.correct);
    if (!allCorrect) {
      setStepBanner("Not quite — check the Inspector metadata and try again");
      return;
    }

    setVerifyComplete(true);
    demoFlagsRef.current.verifyComplete = true;
    demoFlagsRef.current.tokenLocked = true;
    setFilledSegs(["ep-finance"]);
    setTokenCount(1);
    setLeadStatus((prev) => ({ ...prev, "lead-finance": "LOCKED" }));
    setLeadClass((prev) => ({ ...prev, "lead-finance": "n-locked" }));
    setVerifyOpen(false);
    setStepBanner("Finance token extracted — one down, three to go");
  }, [verifyComplete, verifyInteractive, vpSelections]);

  const prepareForStep = useCallback(
    (stepIndex: number) => {
      applyBaseline();

      if (stepIndex === 1) {
        openWindow("win-tribunal");
        setStepBanner("Read both claimants before ruling");
      } else if (stepIndex === 2) {
        openWindow("win-registry");
        openWindow("win-inspector");
        setSelectedFile(true);
        setStepBanner("Inspect the disputed file metadata");
      } else if (stepIndex === 3) {
        openWindow("win-tribunal");
        openWindow("win-registry");
        openWindow("win-inspector");
        setSelectedFile(true);
        setRuledCorrect(true);
        setVerifyOpen(true);
        setVerifyInteractive(false);
        setVpSelections([1, 1]);
        setStepBanner("Verify panel opens after a correct ruling");
      } else if (stepIndex === 4) {
        setFilledSegs(["ep-finance", "ep-it", "ep-operations"]);
        setTokenCount(3);
        setEbStep("DISPUTE 4 OF 4");
        setStepBanner("One token left — then compile the Master Key");
      } else if (stepIndex === 5) {
        setOpenWindows(["win-registry"]);
        setRegistryPickActive(true);
        setStepBanner("Click the highlighted file in the Data Registry");
      } else if (stepIndex === 6) {
        setOpenWindows(["win-registry", "win-inspector", "win-tribunal"]);
        setSelectedFile(true);
        setStepBanner(`Case ${TUT_CASE_ID} — Step 1: Rule on ownership · Step 2: Verify with evidence questions`);
      } else if (stepIndex === 7) {
        setOpenWindows(["win-registry", "win-inspector", "win-tribunal"]);
        setSelectedFile(true);
        setRuledCorrect(true);
        setVerifyOpen(true);
        setVerifyInteractive(true);
        setStepBanner("Step 2: Answer verification questions in the side panel — use the Inspector to find the answers");
      } else if (stepIndex === 8) {
        demoFlagsRef.current.tokenLocked = true;
        setFilledSegs(["ep-finance"]);
        setTokenCount(1);
        setLeadStatus((prev) => ({ ...prev, "lead-finance": "LOCKED" }));
        setLeadClass((prev) => ({ ...prev, "lead-finance": "n-locked" }));
        setStepBanner("Finance token locked on the Key Forge");
      }
    },
    [applyBaseline, openWindow]
  );

  const getDemoApi = useCallback(
    (): M2TutorialDemoApi => ({
      applyBaseline,
      prepareForStep,
      isRegistrySelected: () => demoFlagsRef.current.registrySelected,
      isRuledCorrect: () => demoFlagsRef.current.ruledCorrect,
      isVerifyComplete: () => demoFlagsRef.current.verifyComplete,
      isTokenLocked: () => demoFlagsRef.current.tokenLocked,
      setStepBanner,
    }),
    [applyBaseline, prepareForStep]
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

  useEffect(() => {
    const tick = () => setTbClock(now12());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const winVisible = (id: string) => openWindows.includes(id);

  const detState = detection < 30 ? "DARK" : detection < 60 ? "SCANNING" : detection < 80 ? "ALERT" : "CRITICAL";
  const detWrapCls = detection < 30 ? "det-green" : detection < 60 ? "det-amber" : "det-red";
  const detBarCls = detection < 30 ? "det-bar-green" : detection < 60 ? "det-bar-amber" : "det-bar-red";
  const detIcon = detection < 30 ? "fa-shield-alt" : detection < 60 ? "fa-eye" : detection < 80 ? "fa-exclamation-triangle" : "fa-skull";

  return (
    <div id="m2-tutorial-root" ref={rootRef} className="m2-mission m2-tutorial-shell" aria-hidden="false">
      <div id="gp-root" className="active">
        <div id="game">
        <div id="hdr">
          <div className="hdr-left">
            <i className="fas fa-terminal" /> MASTERMIND TERMINAL · OPERATION OMNI
          </div>
          <div className="hdr-center">MISSION 02 OF 05 / FORGING THE MASTER KEY</div>
          <div className="hdr-right">
            <span id="det-cluster">
              <span id="det-display" className={detWrapCls}>
                <span id="det-icon">
                  <i className={`fas ${detIcon}`} aria-hidden />
                </span>
                <span id="det-pct">{detection}%</span>
                <span className="det-bar-wrap">
                  <span id="det-bar" className={detBarCls} style={{ width: `${detection}%` }} />
                </span>
                <span id="det-label" style={{ fontSize: "clamp(10px,1vw,12px)", letterSpacing: 2, opacity: 0.7 }}>
                  {detState}
                </span>
              </span>
              <span className="det-info-wrap" tabIndex={0}>
                <i className="fas fa-circle-info det-info-i" aria-hidden />
                <div className="det-info-pop" role="tooltip">
                  <div className="dip-ttl" style={{ color: DET_INFO[detState].color }}>
                    {detState}
                  </div>
                  <div className="dip-desc">{DET_INFO[detState].desc}</div>
                  <div className="dip-cause">{M2_DET_CAUSE}</div>
                </div>
              </span>
            </span>
            <span style={{ color: "rgba(0,196,28,.2)", margin: "0 4px" }}>|</span>
            <span id="mission-chrome">
              <span id="timer">00:00</span>
              <span className="live-dot" />
              <span style={{ letterSpacing: 1, fontSize: 10 }}>LIVE</span>
            </span>
          </div>
        </div>

        <div id="step-banner">{stepBanner}</div>

        <div id="main-row">
          <div id="desktop-panel">
            <div id="wallpaper" className="visible" />

            {DESKTOP_ICONS.map((icon) => (
              <button
                type="button"
                key={icon.id}
                id={icon.id}
                className={`di visible${icon.mission ? " di-mission" : ""}${icon.win ? " m2-tut-icon" : ""}`}
                style={{ top: icon.top, left: icon.left }}
                onDoubleClick={icon.win ? () => openWindow(icon.win as string) : undefined}
                tabIndex={icon.win ? undefined : -1}
              >
                <span className="di-icon">
                  <i className={`fas ${icon.icon}`} style={icon.iconColor ? { color: icon.iconColor } : undefined} aria-hidden />
                </span>
                <div className="di-label">{icon.label}</div>
              </button>
            ))}

          {STICKIES.map((note) => (
            <div key={note.id} className={`sticky ${note.cls} visible`} style={{ top: note.top, right: note.right }}>
              {"header" in note && note.header ? <span className="sticky-hdr">{note.header}</span> : null}
              {note.body}
            </div>
          ))}

            {winVisible("win-tribunal") && (
              <div className="xp-win visible" id="win-tribunal" style={{ top: 36, left: 86, width: 498, zIndex: 112 }}>
                <XpTitleBar
                  iconClass="fas fa-gavel"
                  iconColor="#f0c538"
                  title="Governance_Tribunal.exe — Ownership Dispute"
                  menu={["Case", "Evidence", "View"]}
                />
                <div className="xp-body" style={{ height: 320, overflow: "auto" }}>
                  <div className="trib-header">
                    <div className="trib-case-id">
                      CASE {TUT_CASE_ID} · Finance / IT ownership
                    </div>
                    <div className="trib-case-title">Ownership Conflict — {TUT_DEMO_FILE.name}</div>
                  </div>
                  <div className="trib-claimant">
                    <div className="trib-claimant-hdr cl-a">
                      ⚠ CLAIMANT A — {TUT_CLAIMANTS.a.dept.toUpperCase()}{" "}
                      <span style={{ fontWeight: 400, opacity: 0.7 }}>{TUT_CLAIMANTS.a.rep}</span>
                    </div>
                    <div className="trib-claimant-body">{TUT_CLAIMANTS.a.arg}</div>
                    <div className="trib-evidence">
                      Evidence: <strong>{TUT_DEMO_FILE.name}</strong> — inspect in Registry
                    </div>
                  </div>
                  <div className="trib-claimant">
                    <div className="trib-claimant-hdr cl-b">
                      ⚠ CLAIMANT B — {TUT_CLAIMANTS.b.dept.toUpperCase()}{" "}
                      <span style={{ fontWeight: 400, opacity: 0.7 }}>{TUT_CLAIMANTS.b.rep}</span>
                    </div>
                    <div className="trib-claimant-body">{TUT_CLAIMANTS.b.arg}</div>
                  </div>
                  {!ruledCorrect && (
                    <div className="trib-verdict-row">
                      <button
                        type="button"
                        className={`trib-btn trib-btn-a m2-tut-rule-btn${wrongShake === 0 ? " wrong-shake" : ""}`}
                        onClick={() => handleRule(0)}
                      >
                        <span className="trib-btn-name">RULE FOR {TUT_CLAIMANTS.a.dept.toUpperCase()}</span>
                        <span className="trib-btn-role">{TUT_CLAIMANTS.a.rep}</span>
                      </button>
                      <button
                        type="button"
                        className={`trib-btn trib-btn-b m2-tut-rule-btn${wrongShake === 1 ? " wrong-shake" : ""}`}
                        onClick={() => handleRule(1)}
                      >
                        <span className="trib-btn-name">RULE FOR {TUT_CLAIMANTS.b.dept.toUpperCase()}</span>
                        <span className="trib-btn-role">{TUT_CLAIMANTS.b.rep}</span>
                      </button>
                    </div>
                  )}
                  {ruledCorrect && !verifyComplete && (
                    <div className="trib-ruling-done">
                      <strong>✓ RULING RECORDED:</strong> {TUT_CLAIMANTS.a.dept}
                    </div>
                  )}
                  {verifyComplete && (
                    <div className="trib-ruling-done" style={{ background: "#f0fdf4", borderTop: "2px solid #28a745" }}>
                      <strong>✓ RULING + VERIFICATION COMPLETE</strong>
                      <br />
                      {TUT_CLAIMANTS.a.dept} — Token extracted.
                    </div>
                  )}
                </div>
                <div className="xp-status">
                  <span>{ruledCorrect ? "Ruling recorded" : "Active dispute loaded"}</span>
                </div>
                <div className="xp-grip" />
              </div>
            )}

            {winVisible("win-inspector") && (
              <div className="xp-win visible" id="win-inspector" style={{ top: 115, left: 106, width: 432, zIndex: 111 }}>
                <XpTitleBar
                  iconClass="fas fa-magnifying-glass"
                  iconColor="#90caf9"
                  title="File_Inspector.exe — Metadata Viewer"
                  menu={["File", "Inspect"]}
                />
                <div className="xp-body" style={{ height: 280, overflow: "auto" }}>
                  {selectedFile ? (
                    <div>
                      <div className="m2-tut-watermark">TUTORIAL SAMPLE</div>
                      <div className="insp-file-hdr">
                        <span className="insp-file-icon">📄</span>
                        <div>
                          <div className="insp-file-name">{TUT_DEMO_FILE.name}</div>
                          <div className="insp-file-meta">
                            {TUT_DEMO_FILE.records.toLocaleString()} records · last access {TUT_DEMO_FILE.lastAccess}
                          </div>
                        </div>
                      </div>
                      <div className="insp-section-hdr">OWNERSHIP & GOVERNANCE</div>
                      <div className="insp-row">
                        <span className="insp-key">Source System</span>
                        <span className="insp-val">{TUT_DEMO_FILE.source}</span>
                      </div>
                      <div className="insp-row">
                        <span className="insp-key">Data Steward ★</span>
                        <span className="insp-val highlight">{TUT_DEMO_FILE.steward}</span>
                      </div>
                      <div className="insp-row">
                        <span className="insp-key">Classification</span>
                        <span className="insp-val warn">{TUT_DEMO_FILE.classification}</span>
                      </div>
                      <div className="insp-section-hdr">DATA LINEAGE</div>
                      <div className="insp-lineage">
                        {TUT_DEMO_FILE.lineage.map((n, i) => (
                          <span key={n}>
                            <span className="lin-node">{n}</span>
                            {i < TUT_DEMO_FILE.lineage.length - 1 && <span className="lin-arrow"> → </span>}
                          </span>
                        ))}
                      </div>
                      <div className="insp-section-hdr">SCHEMA FIELDS</div>
                      <div className="insp-schema">
                        {TUT_DEMO_FILE.schema.map((f) => (
                          <span key={f} className="insp-field">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="insp-empty">
                      Double-click any file in the Data Registry
                      <br />
                      to inspect its metadata here.
                    </div>
                  )}
                </div>
                <div className="xp-status">
                  <span>{selectedFile ? TUT_DEMO_FILE.name : "No file selected"}</span>
                </div>
                <div className="xp-grip" />
              </div>
            )}

            {winVisible("win-registry") && (
              <div
                className="xp-win visible"
                id="win-registry"
                style={{ top: registryPickActive ? 80 : 195, left: registryPickActive ? 100 : 72, width: 458, zIndex: registryPickActive ? 120 : 108 }}
              >
                <XpTitleBar
                  iconClass="fas fa-folder"
                  iconColor="#f0c538"
                  title="Data_Governance_Registry — C:\\MegaCorp\\Governance\\"
                  menu={["File", "View", "Tools"]}
                />
                <div className="xp-body" style={{ height: 230, overflow: "auto", padding: 0 }}>
                  <table className="reg-table">
                    <thead>
                      <tr>
                        <th>FILENAME</th>
                        <th>CLAIMED BY</th>
                        <th>CLASS.</th>
                        <th>RECORDS</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        id="m2-tut-reg-row"
                        className={`m2-tut-reg-row${registryPickActive ? " m2-tut-pick-me" : ""}${selectedFile ? " reg-selected" : ""}`}
                        onClick={handleRegistryClick}
                      >
                        <td>{TUT_DEMO_FILE.name}</td>
                        <td>{TUT_DEMO_FILE.claimedBy}</td>
                        <td>
                          <span className={`reg-badge ${TUT_DEMO_FILE.cls}`}>CONFIDENTIAL</span>
                        </td>
                        <td>{TUT_DEMO_FILE.records.toLocaleString()}</td>
                      </tr>
                      <tr style={{ opacity: 0.45 }}>
                        <td>sample_payroll.dat</td>
                        <td>HR</td>
                        <td>
                          <span className="reg-badge badge-internal">INTERNAL</span>
                        </td>
                        <td>1,200</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="xp-status">
                  <span>Double-click to inspect</span>
                </div>
                <div className="xp-grip" />
              </div>
            )}

            <div id="verify-panel" className={verifyOpen ? "open" : ""}>
              <button type="button" id="verify-toggle" className={verifyOpen ? "show" : ""} tabIndex={-1}>
                ›
              </button>
              <div className="cp-hdr">
                <div className="cp-node" id="vp-node">
                  {TUT_VERIFY.title}
                </div>
                <div className="cp-sub" id="vp-sub">
                  {TUT_VERIFY.sub}
                </div>
              </div>
              <div className="cp-body">
                <div className="cp-params" id="vp-params">
                  {TUT_VERIFY.questions.map((q, qi) => (
                    <div key={qi} className="cp-param">
                      <div className="cp-plbl">
                        {qi + 1}. {q.label}
                        {q.note ? <span className="cp-note">{q.note}</span> : null}
                      </div>
                      <div className="cp-chips">
                        {q.opts.map((opt, ci) => (
                          <button
                            key={opt}
                            type="button"
                            className={`cp-chip m2-tut-chip${vpSelections[qi] === ci ? " cp-sel" : ""}`}
                            onClick={() => handleChip(qi, ci)}
                            disabled={!verifyInteractive || verifyComplete}
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
                <button
                  type="button"
                  className="cp-ok m2-tut-verify-btn"
                  id="vp-confirm"
                  disabled={
                    !verifyInteractive ||
                    verifyComplete ||
                    TUT_VERIFY.questions.some((_, qi) => vpSelections[qi] === undefined)
                  }
                  onClick={handleConfirmVerify}
                >
                  ▶ EXTRACT TOKEN
                </button>
              </div>
            </div>

            <div id="xp-taskbar" className="visible">
              <button type="button" id="start-btn" tabIndex={-1}>
                ⊞ Start
              </button>
              <div className="tb-div" />
              {TASKBAR_BUTTONS.map((btn) => (
                <button
                  key={btn.win}
                  type="button"
                  className={`tb-wb${winVisible(btn.win) ? " tb-on" : ""}`}
                  tabIndex={-1}
                >
                  <i className={`fas ${btn.icon}`} aria-hidden /> {btn.label}
                </button>
              ))}
              <div id="tb-clock">{tbClock}</div>
            </div>
          </div>

          <div id="right">
            <div id="eboard">
              <div className="eb-hdr">
                <span className="eb-htitle">KEY FORGE</span>
                <span id="eb-count">
                  {tokenCount} / 4 TOKENS
                </span>
              </div>
              <div id="eb-step">{ebStep}</div>
              <div className="eb-grid">
                {TOKEN_LEADS.map((t) => (
                  <div key={t.id} id={t.id} className={`lead ${leadClass[t.id] ?? "n-dimmed"}`}>
                    <div className="lead-icon">
                      <i className={`fas ${t.icon}`} />
                    </div>
                    <div className="lead-name">{t.label}</div>
                    <div className="lead-status" id={t.lsId}>
                      {leadStatus[t.id]}
                    </div>
                  </div>
                ))}
              </div>
              <div id="m2-tut-forge-footer">
                <div className="eb-progress">
                  {TOKEN_LEADS.map((t) => (
                    <div key={t.segId} id={t.segId} className={`ep-seg${filledSegs.includes(t.segId) ? " filled" : ""}`} />
                  ))}
                </div>
                <button id="synth-btn" type="button" className={tokenCount >= 4 ? "ready" : ""} disabled={tokenCount < 4} tabIndex={-1}>
                  <i className="fas fa-key" /> COMPILE MASTER KEY
                </button>
              </div>
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
              <div id="voss-body">
                <div className="bm-sep">
                  <div className="bm-sep-pill">TODAY</div>
                </div>
                <div className="bm-group">
                  <div className="bm-sender" style={{ color: "#00c41c" }}>
                    ATLAS
                  </div>
                  <div className="bm-bubble bm-d show">
                    Two steps per dispute: rule in the Tribunal, then verify with evidence from the Inspector.
                  </div>
                </div>
              </div>
              <div className="voss-footer">
                <div className="voss-input-bar">
                  <div className="hint-wrap">
                    <button type="button" id="hint-btn" tabIndex={-1} title="Request hint">
                      💡
                    </button>
                    <div className="hint-tooltip">REQUEST HINT · −100 pts</div>
                  </div>
                  <input id="voss-input" readOnly placeholder="// channel encrypted — read only" tabIndex={-1} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
});
