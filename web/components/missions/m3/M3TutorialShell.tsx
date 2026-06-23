"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { DATASETS } from "@/lib/game/m3/data";
import { DETECTION_INFO } from "@/lib/game/m3/detectionMeter";
import type { M3TutorialDemoApi } from "@/lib/game/m3/tutorialDemo";
import { m3TutDrillFileName, m3TutGetDocumentPreview } from "@/lib/game/m3/tutorialDrill";

const TUT_DETECTION = 0;
const TUT_BAND = "DARK" as const;

export type M3TutorialShellHandle = {
  root: HTMLDivElement | null;
  reset: () => void;
  prepareForStep: (stepIndex: number) => void;
  getDemoApi: () => M3TutorialDemoApi;
};

export const M3TutorialShell = forwardRef<M3TutorialShellHandle>(function M3TutorialShell(_, ref) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inspectorBodyRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(() => new Set());
  const [showChannels, setShowChannels] = useState(false);
  const [banner, setBanner] = useState(
    "Pick a file. Route it to the channel that matches audience + harm profile."
  );
  const [inspectorHdr, setInspectorHdr] = useState("INSPECTOR — Select a file");
  const [inspectorBody, setInspectorBody] = useState(
    '<span style="color:#5a6a7a">Open a file and read what\'s in it — then pick the channel that fits <strong>audience</strong> and <strong>harm</strong>, not a label.</span>'
  );
  const [chips, setChips] = useState<{ choice: string; name: string }[]>([]);
  const [routed, setRouted] = useState(0);

  const applyBaseline = useCallback(() => {
    setSelectedId(null);
    setDoneIds(new Set());
    setChips([]);
    setRouted(0);
    setShowChannels(false);
    setBanner("Pick a file. Route it to the channel that matches audience + harm profile.");
    setInspectorHdr("INSPECTOR — Select a file");
    setInspectorBody(
      '<span style="color:#5a6a7a">Open a file and read what\'s in it — then pick the channel that fits <strong>audience</strong> and <strong>harm</strong>, not a label.</span>'
    );
  }, []);

  const reset = applyBaseline;

  const selectDataset = useCallback((id: string, opts?: { silentBanner?: boolean }) => {
    setSelectedId(id);
    setShowChannels(true);
    setInspectorHdr(`INSPECTOR — ${m3TutDrillFileName(id)}`);
    setInspectorBody(m3TutGetDocumentPreview(id));
    if (!opts?.silentBanner) {
      setBanner("Choose PUBLIC (press), OFFICIAL (regulators/counsel), or NO RELEASE (vault).");
    }
  }, []);

  const routeFile = useCallback((id: string, choice: "public" | "official" | "vault") => {
    setDoneIds((prev) => new Set(prev).add(id));
    setChips((prev) => [...prev, { choice, name: m3TutDrillFileName(id) }]);
    setRouted((prev) => prev + 1);
    setSelectedId(id);
    setShowChannels(true);
  }, []);

  const prepareForStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 4) {
        applyBaseline();
        return;
      }
      applyBaseline();
      if (stepIndex === 1) {
        selectDataset("omni_exec", { silentBanner: true });
        setShowChannels(false);
        return;
      }
      if (stepIndex >= 2) {
        selectDataset("omni_exec", { silentBanner: true });
      }
    },
    [applyBaseline, selectDataset]
  );

  const getDemoApi = useCallback(
    (): M3TutorialDemoApi => ({
      applyBaseline,
      selectDataset,
      routeFile,
      setBanner,
      getInspectorBodyEl: () => inspectorBodyRef.current,
    }),
    [applyBaseline, routeFile, selectDataset]
  );

  useImperativeHandle(
    ref,
    () => ({
      root: rootRef.current,
      reset,
      prepareForStep,
      getDemoApi,
    }),
    [getDemoApi, prepareForStep, reset]
  );

  useEffect(() => {
    applyBaseline();
  }, [applyBaseline]);

  const shortName = (name: string) => (name.length > 22 ? `${name.slice(0, 20)}…` : name);

  const detInfo = DETECTION_INFO[TUT_BAND];

  return (
    <div id="gp-root" ref={rootRef} className="m3-tutorial-shell" aria-hidden="false">
      <div id="game">
        <div id="hdr">
          <div className="hdr-left">
            <i className="fas fa-terminal" aria-hidden /> MASTERMIND TERMINAL | OPERATION OMNI
          </div>
          <div className="hdr-center">MISSION 03 OF 05 / THE HUMAN SHIELD</div>
          <div className="hdr-right">
            <span id="det-cluster">
              <span id="det-display" className="det-green">
                <span id="det-icon">
                  <i className="fas fa-shield-alt" aria-hidden />
                </span>
                <span id="det-pct">{TUT_DETECTION}%</span>
                <span className="det-bar-wrap">
                  <span id="det-bar" className="det-bar-green" style={{ width: `${TUT_DETECTION}%` }} />
                </span>
                <span id="det-label">{TUT_BAND}</span>
              </span>
              <span className="det-info-wrap" tabIndex={0} aria-label="Detection status info">
                <i className="fas fa-circle-info det-info-i" aria-hidden />
                <div className="det-info-pop" role="tooltip">
                  <div className="dip-ttl" style={{ color: detInfo.color }}>
                    {TUT_BAND}
                  </div>
                  <div className="dip-desc">{detInfo.desc}</div>
                  <div className="dip-cause">{detInfo.cause}</div>
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
        <div id="step-banner">{banner}</div>
        <div id="main-row">
          <div id="desktop-panel">
            <div className="r2-layout">
              <div className="r2-router">
                <div className="r2-r-hdr">STAGED FOR DISCLOSURE</div>
                <div id="r3-file-list">
                  {DATASETS.map((ds) => (
                    <div
                      key={ds.id}
                      className={`r2-file${selectedId === ds.id ? " sel" : ""}${doneIds.has(ds.id) ? " done" : ""}`}
                      data-id={ds.id}
                      onClick={() => selectDataset(ds.id)}
                      onKeyDown={(e) => e.key === "Enter" && selectDataset(ds.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <span>📄</span>
                      <span>{m3TutDrillFileName(ds.id)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="r2-inspector">
                <div className="r2-ins-hdr" id="r3-ins-hdr">
                  {inspectorHdr}
                </div>
                <div
                  ref={inspectorBodyRef}
                  className="r2-ins-body"
                  id="r3-ins-body"
                  dangerouslySetInnerHTML={{ __html: inspectorBody }}
                />
                <div className="ch-bar" id="ch-bar" style={{ display: showChannels ? "flex" : "none" }}>
                  <span>Assign release channel:</span>
                  <div className="ch-row">
                    <button type="button" className="ch-btn ch-public" id="ch-public">
                      <i className="fas fa-bullhorn" aria-hidden /> PUBLIC WALL
                    </button>
                    <button type="button" className="ch-btn ch-official" id="ch-official">
                      <i className="fas fa-landmark" aria-hidden /> OFFICIAL FILING
                    </button>
                    <button type="button" className="ch-btn ch-vault" id="ch-vault">
                      <i className="fas fa-lock" aria-hidden /> NO RELEASE
                    </button>
                  </div>
                </div>
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
                <div className="dist-col public" id="col-public">
                  <div className="dist-col-h">PUBLIC</div>
                  {chips
                    .filter((c) => c.choice === "public")
                    .map((c) => (
                      <div key={c.name} className="dist-chip public">
                        {shortName(c.name)}
                      </div>
                    ))}
                </div>
                <div className="dist-col official" id="col-official">
                  <div className="dist-col-h">OFFICIAL</div>
                  {chips
                    .filter((c) => c.choice === "official")
                    .map((c) => (
                      <div key={c.name} className="dist-chip official">
                        {shortName(c.name)}
                      </div>
                    ))}
                </div>
                <div className="dist-col vault" id="col-vault">
                  <div className="dist-col-h">NO REL.</div>
                  {chips
                    .filter((c) => c.choice === "vault")
                    .map((c) => (
                      <div key={c.name} className="dist-chip vault">
                        {shortName(c.name)}
                      </div>
                    ))}
                </div>
              </div>
              <div id="routed-count">Routed: {routed} / 10</div>
              <button type="button" id="signoff-btn" disabled>
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
                  <div className="bk-members" id="bk-members">
                    <span className="bk-member online">Voss — 🟢</span>
                    <span className="bk-sep"> · </span>
                    <span className="bk-member online">Zex — 🟢</span>
                    <span className="bk-sep"> · </span>
                    <span className="bk-member online">Nova — 🟢</span>
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
              </div>
              <div className="broker-footer">
                <div className="broker-input-bar">
                  <div className="hint-wrap">
                    <button type="button" id="hint-btn" disabled>
                      <i className="fas fa-lightbulb" aria-hidden />
                    </button>
                    <div className="hint-tooltip">Hint · +8% detection</div>
                  </div>
                  <input
                    id="broker-input"
                    type="text"
                    placeholder="Operation Channel — listen only"
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
