"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { M4FlowCanvas } from "@/components/missions/m4/M4FlowCanvas";
import { M4StepPop } from "@/components/missions/m4/M4StepPop";
import { FILES, INTRO_CHAT, STEPS, getDatasetCandidatesForStep } from "@/lib/game/m4/data";
import type { M4TutorialDemoApi } from "@/lib/game/m4/tutorialDemo";

export type M4TutorialShellHandle = {
  root: HTMLDivElement | null;
  reset: () => void;
  prepareForStep: (stepIndex: number) => void;
  getDemoApi: () => M4TutorialDemoApi;
};

export const M4TutorialShell = forwardRef<M4TutorialShellHandle>(function M4TutorialShell(_, ref) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [popHidden, setPopHidden] = useState(false);
  const [stepBanner, setStepBanner] = useState(
    "Case-flow reconstruction — link each leak file to the correct onboarding gate."
  );

  const linked = Object.keys(picks).length;
  const candidates = getDatasetCandidatesForStep(selectedStepId, picks);

  const applyBaseline = useCallback(() => {
    setPicks({});
    setSelectedStepId(null);
    setSelectedFileId(null);
    setPopHidden(false);
    setStepBanner("Case-flow reconstruction — link each leak file to the correct onboarding gate.");
  }, []);

  const selectStep = useCallback((stepId: string) => {
    const step = STEPS.find((s) => s.id === stepId);
    if (!step) return;
    setPopHidden(false);
    setSelectedStepId(stepId);
    setSelectedFileId(null);
    setStepBanner(`${step.title} — select the matching dataset from the rail`);
  }, []);

  const dismissStepPop = useCallback(() => {
    setPopHidden(true);
  }, []);

  const selectFile = useCallback((fileId: string) => {
    setSelectedFileId(fileId);
  }, []);

  const assignToStep = useCallback((fileId: string, stepId: string) => {
    setPicks((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (next[k] === stepId) delete next[k];
      });
      next[fileId] = stepId;
      return next;
    });
    setSelectedFileId(null);
    setSelectedStepId(null);
    setPopHidden(true);
    const step = STEPS.find((s) => s.id === stepId);
    const f = FILES.find((x) => x.id === fileId);
    if (step && f) {
      setStepBanner(`Linked ${f.name} → ${step.title}.`);
    }
  }, []);

  const prepareForStep = useCallback(
    (stepIndex: number) => {
      applyBaseline();
      if (stepIndex === 1) {
        selectStep("offer-review");
        setPopHidden(true);
      }
    },
    [applyBaseline, selectStep]
  );

  const getDemoApi = useCallback(
    (): M4TutorialDemoApi => ({
      applyBaseline,
      selectStep,
      dismissStepPop,
      selectFile,
      assignToStep,
    }),
    [applyBaseline, assignToStep, dismissStepPop, selectFile, selectStep]
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

  return (
    <div id="gp-root" ref={rootRef} className="m4-game" aria-hidden="false">
      <div id="m4-game" className="active">
        <div id="hdr">
          <div className="hdr-left">
            <i className="fas fa-terminal" aria-hidden /> MASTERMIND TERMINAL | OPERATION OMNI
          </div>
          <div className="hdr-center">MISSION 04 OF 05 / THE ONBOARDING</div>
          <div className="hdr-right">
            <span className="coh-wrap">
              <span className="coh-label">NOVA</span>
              <span className="coh-bar">
                <span className="coh-fill conf-ok" style={{ width: "100%" }} />
              </span>
              <span>100%</span>
            </span>
            <span style={{ color: "rgba(0,196,28,.2)", margin: "0 4px" }}>|</span>
            <span id="timer">00:00</span>
            <span className="live-dot" />
            <span style={{ letterSpacing: 1, fontSize: 10 }}>LIVE</span>
          </div>
        </div>

        <div id="sort-banner">
          <strong>Case-flow reconstruction</strong> — MegaCorp&apos;s OMNI diagram is one regulated disclosure from open to
          close; your leak files are the <strong>payload each department receives</strong> at its handoff.
          {stepBanner !== "Case-flow reconstruction — link each leak file to the correct onboarding gate." && (
            <span className="m4-sort-banner-live"> · {stepBanner}</span>
          )}
        </div>
        <div id="sort-help">
          <strong>How:</strong> <strong>1)</strong> Click a <strong>gate icon</strong> — the brief opens and up to{" "}
          <strong>four files</strong> load in the rail. <strong>2)</strong> Drag the matching file toward that gate.{" "}
          <strong>3)</strong> While the file is over the icon, the gate turns <strong>purple</strong> (dashed ring) —{" "}
          <strong>release to drop</strong>. Correct link → <strong>green arrow</strong>; wrong link → Nova.
        </div>

        <div id="main-row">
          <div id="flow-canvas-wrap">
            <div id="flow-canvas-inner">
              <M4FlowCanvas
                picks={picks}
                selectedStepId={selectedStepId}
                submitted={false}
                onSelectStep={selectStep}
                onDropFile={(fileId, stepId) => assignToStep(fileId, stepId)}
              />
              {selectedStepId && (
                <M4StepPop
                  selectedStepId={selectedStepId}
                  picks={picks}
                  hidden={popHidden}
                  onClose={dismissStepPop}
                />
              )}
            </div>
            <div className="flow-canvas-footer">
              <span id="r4-routed-count">Linked: {linked} / 8</span>
              <button type="button" id="btn-submit-sort" disabled>
                FINALIZE PROCESS MAP →
              </button>
            </div>
          </div>

          <div id="right-rail">
            <div className="datasets-panel">
              <div className="datasets-panel-hdr">
                <i className="fas fa-database" aria-hidden /> Available datasets
              </div>
              <div className="datasets-panel-sub">
                {selectedStepId
                  ? "Drag the matching file onto its icon. The gate turns purple only while you're dragging over it."
                  : "After you click a gate, drag the matching file onto its icon. The gate turns purple only while you're dragging over it — drop when you see that purple dashed ring."}
              </div>
              <div id="r4-file-list" className="datasets-grid">
                {!selectedStepId ? (
                  <div className="datasets-empty">
                    Click a <strong>gate icon</strong> on the flow first. Up to <strong>four</strong> candidate files
                    appear here.
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="datasets-empty">No files left in the pool for this view.</div>
                ) : (
                  candidates.map((f) => {
                    const st = STEPS.find((s) => s.okFile === f.id);
                    return (
                      <div
                        key={f.id}
                        data-file-id={f.id}
                        role="button"
                        tabIndex={0}
                        className={`ds-card ${st?.deptCls ? `ds-${st.deptCls}` : ""}${selectedFileId === f.id ? " sel" : ""}`}
                        onClick={() => selectedStepId && assignToStep(f.id, selectedStepId)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && selectedStepId && assignToStep(f.id, selectedStepId)
                        }
                      >
                        <span className="ds-ico" aria-hidden>
                          📄
                        </span>
                        <span className="ds-name">{f.name}</span>
                        <span className="ds-desc">{f.desc}</span>
                        <span className="ds-tag">Leak file</span>
                      </div>
                    );
                  })
                )}
              </div>
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
                    <span className="bk-member online">Nova</span>
                    <span className="bk-sep">·</span>
                    <span className="bk-member online">Kade</span>
                  </div>
                </div>
                <div className="bk-icons">
                  <i className="fas fa-lock" aria-hidden />
                </div>
              </div>
              <div id="broker-body">
                <div className="bm-sep">
                  <div className="bm-sep-pill">Process map queue · live</div>
                </div>
                {INTRO_CHAT.map((m) => (
                  <div key={m.sender} className="bm-group">
                    <div className="bm-sender">{m.sender.toUpperCase()}</div>
                    <div className={`bm-bubble ${m.tone}`} dangerouslySetInnerHTML={{ __html: m.text }} />
                  </div>
                ))}
                <div className="bm-group">
                  <div className="bm-sender">NOVA</div>
                  <div className="bm-bubble bm-d">
                    Mis-link the spine and analysts will read &apos;random dump&apos; — we need a believable{" "}
                    <strong>department-to-department</strong> path.
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
