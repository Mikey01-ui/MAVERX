"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { M1HackOverlay } from "@/components/missions/m1/M1HackOverlay";
import { M4FilePreview } from "@/components/missions/m4/M4FilePreview";
import { M4FlowCanvas } from "@/components/missions/m4/M4FlowCanvas";
import { M4StepPop } from "@/components/missions/m4/M4StepPop";
import { MissionDebriefScreen } from "@/components/missions/shared/MissionDebriefScreen";
import { M4DetectionHeader } from "@/components/missions/m4/M4DetectionHeader";
import { DETECTION, FILES, HACK_LINES, HINT_COOLDOWN_SEC, STEPS, getDatasetCandidatesForStep, isStepSatisfied } from "@/lib/game/m4/data";
import { buildM4Debrief } from "@/lib/game/debriefBuilders";
import { m4ReportSnapshot } from "@/lib/finale/missionReportSnapshot";
import { useM4MissionAudio } from "@/lib/audio/useM4MissionAudio";
import { M4GameProvider, useM4Game } from "@/lib/game/m4/context";

const FINALIZE_STAGES = [
  "Validating eight-gate spine…",
  "Matching artifacts to department actions…",
  "Building custody chain for debrief…",
];

function M4GameInner() {
  const { state, dispatch } = useM4Game();
  useM4MissionAudio(state);
  const router = useRouter();
  const brokerRef = useRef<HTMLDivElement>(null);
  const [popHidden, setPopHidden] = useState(false);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [finalizeStage, setFinalizeStage] = useState(0);
  const linked = Object.keys(state.picks).length;
  const candidates = getDatasetCandidatesForStep(state.selectedStepId, state.picks);
  const stepLinked =
    !!state.selectedStepId && isStepSatisfied(state.selectedStepId, state.picks);
  const hintDisabled =
    state.gameOver ||
    state.submitted ||
    state.hintCooldown ||
    !state.selectedStepId ||
    stepLinked;

  const completeMission = useCallback(async () => {
    const snapshot = m4ReportSnapshot(state);
    await fetch("/api/progress", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        missionId: "m4",
        status: "completed",
        checkpoint: "completed",
        score: snapshot.score,
        stateJson: snapshot.stateJson,
      }),
    });
    router.push("/mission/m5");
    router.refresh();
  }, [router, state]);

  const debrief = useMemo(() => buildM4Debrief(state), [state]);

  const handleDebriefContinue = useCallback(() => {
    if (state.detection >= 100 || state.phase === "failed") {
      dispatch({ type: "RESET_MISSION" });
      return;
    }
    void completeMission();
  }, [completeMission, dispatch, state.detection, state.phase]);

  const selectStep = (stepId: string) => {
    setPopHidden(false);
    dispatch({ type: "SELECT_STEP", stepId });
  };

  useEffect(() => {
    const el = brokerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [state.messages]);

  useEffect(() => {
    if (!state.submitted || state.phase === "debrief") {
      setFinalizeStage(0);
      return;
    }
    setFinalizeStage(0);
    const id = window.setInterval(() => {
      setFinalizeStage((s) => (s + 1) % FINALIZE_STAGES.length);
    }, 1100);
    return () => window.clearInterval(id);
  }, [state.submitted, state.phase]);

  return (
    <div className="m4-game">
      <div id="m4-game" className={state.hackDone ? "active" : ""}>
        {state.hackDone && (
          <>
            <M4DetectionHeader />

            <div id="sort-banner">
              <strong>Case-flow reconstruction</strong> — MegaCorp&apos;s OMNI diagram is one regulated disclosure from open to
              close; your leak files are the <strong>payload each department receives</strong> at its handoff.
              {state.stepBanner !== "Case-flow reconstruction — link each leak file to the correct onboarding gate." && (
                <span className="m4-sort-banner-live"> · {state.stepBanner}</span>
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
                    picks={state.picks}
                    selectedStepId={state.selectedStepId}
                    submitted={state.submitted}
                    onSelectStep={selectStep}
                    onDropFile={(fileId, stepId) => dispatch({ type: "ASSIGN_FILE_TO_STEP", fileId, stepId })}
                  />
                  {!state.submitted && state.selectedStepId && (
                    <M4StepPop
                      selectedStepId={state.selectedStepId}
                      picks={state.picks}
                      hidden={popHidden}
                      onClose={() => setPopHidden(true)}
                    />
                  )}
                </div>
                <div className="flow-canvas-footer">
                  <span id="r4-routed-count">
                    Linked: {linked} / 8
                    {state.wrongAttempts > 0 ? ` · ${state.wrongAttempts} wrong` : ""}
                  </span>
                  <button type="button" id="btn-submit-sort" disabled={linked < 8 || state.submitted} onClick={() => dispatch({ type: "SUBMIT" })}>
                    {state.submitted ? "FINALIZING…" : "FINALIZE PROCESS MAP →"}
                  </button>
                </div>
              </div>

              <div id="right-rail">
                <div className="datasets-panel">
                  <div className="datasets-panel-hdr">
                    <i className="fas fa-database" aria-hidden /> Available datasets
                  </div>
                  <div className="datasets-panel-sub">
                    {state.submitted
                      ? "Map finalized — review linked gates on the flow."
                      : state.selectedStepId
                        ? "Drag the matching file onto its icon. The gate turns purple only while you're dragging over it."
                        : "After you click a gate, drag the matching file onto its icon. The gate turns purple only while you're dragging over it — drop when you see that purple dashed ring."}
                  </div>
                  {state.selectedStepId && !state.submitted && (() => {
                    const step = STEPS.find((s) => s.id === state.selectedStepId);
                    const linkedFile = step ? FILES.find((f) => state.picks[f.id] === step.id) : null;
                    if (!linkedFile) return null;
                    return (
                      <div className="m4-return-strip">
                        <span className="m4-return-label">Linked to this gate:</span>
                        <button
                          type="button"
                          className="m4-return-chip"
                          onClick={() => dispatch({ type: "UNASSIGN_FILE", fileId: linkedFile.id })}
                        >
                          {linkedFile.name}
                          <i className="fas fa-undo" aria-hidden />
                        </button>
                      </div>
                    );
                  })()}
                  <div id="r4-file-list" className="datasets-grid">
                    {state.submitted ? (
                      <div className="datasets-empty">Map finalized — review linked chips on the flow.</div>
                    ) : !state.selectedStepId ? (
                      <div className="datasets-empty">
                        Click a <strong>gate icon</strong> on the flow first. Up to <strong>four</strong> candidate files appear here.
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
                            className={`ds-card ${st?.deptCls ? `ds-${st.deptCls}` : ""}${state.selectedFileId === f.id ? " sel" : ""}`}
                            draggable={!state.submitted}
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/r4-file", f.id);
                              e.dataTransfer.effectAllowed = "move";
                            }}
                            onClick={() => dispatch({ type: "ASSIGN_FILE", fileId: f.id })}
                            onKeyDown={(e) => e.key === "Enter" && dispatch({ type: "ASSIGN_FILE", fileId: f.id })}
                          >
                            <div className="ds-card-top">
                              <span className="ds-ico" aria-hidden>📄</span>
                              <button
                                type="button"
                                className="ds-preview-btn"
                                title="Preview document"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewFileId(f.id);
                                }}
                              >
                                <i className="fas fa-search" aria-hidden />
                              </button>
                            </div>
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
                  <div id="broker-body" ref={brokerRef}>
                    <div className="bm-sep">
                      <div className="bm-sep-pill">Onboarding</div>
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
                        <button
                          type="button"
                          id="hint-btn"
                          disabled={hintDisabled}
                          onClick={() => dispatch({ type: "REQUEST_HINT" })}
                          title={state.submitted ? "Map finalizing" : "Ask Nova for a hint"}
                        >
                          <i className="fas fa-lightbulb" aria-hidden />
                        </button>
                        <div className="hint-tooltip">
                          {state.submitted
                            ? "Map locked — packaging debrief"
                            : `Hint · +${DETECTION.hint}% detection · ${state.hintCooldown ? "cooldown…" : `${HINT_COOLDOWN_SEC}s cooldown`}`}
                        </div>
                      </div>
                      <input
                        type="text"
                        id="broker-input"
                        placeholder={state.submitted ? "Finalizing map — listen only" : "Operation Channel — listen only"}
                        disabled
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {state.phase === "hack" && <M1HackOverlay lines={HACK_LINES} visibleCount={state.hackLine + 1} />}

      {previewFileId && (
        <M4FilePreview
          fileId={previewFileId}
          fileName={FILES.find((f) => f.id === previewFileId)?.name ?? previewFileId}
          onClose={() => setPreviewFileId(null)}
        />
      )}

      {state.submitted && state.phase !== "debrief" && (
        <div className="m4-finalize-overlay" role="status" aria-live="polite">
          <div className="m4-finalize-ring" aria-hidden />
          <div className="m4-finalize-msg">{FINALIZE_STAGES[finalizeStage]}</div>
          <div className="m4-finalize-sub">OMNI handoff map · preparing mission report</div>
        </div>
      )}

      {state.gameOver && (
        <div id="gameover-overlay" className="active">
          <div className="go-title">HANDOFF AUDIT FAILED</div>
          <div className="go-sub">MegaCorp flagged the custody story. Detection hit 100% — you&apos;re exposed.</div>
          <button type="button" className="db-cta btn-sweep" style={{ "--sweep-ms": "1200ms" } as React.CSSProperties} onClick={() => dispatch({ type: "RESET_MISSION" })}>
            RETRY MISSION
          </button>
        </div>
      )}

      {state.phase === "debrief" && <MissionDebriefScreen config={debrief} onContinue={handleDebriefContinue} />}
    </div>
  );
}

export function M4Game({ savedState }: { savedState?: Record<string, unknown> | null }) {
  return (
    <M4GameProvider savedState={savedState}>
      <M4GameInner />
    </M4GameProvider>
  );
}
