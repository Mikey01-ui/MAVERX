"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { runM3TutorialDemo, type M3TutorialDemoApi } from "@/lib/game/m3/tutorialDemo";
import { getM3TutorialSteps } from "@/lib/game/m3/tutorialSteps";
import { useDifficulty } from "@/lib/game/DifficultyContext";

type SpotlightRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type M3TutorialOverlayProps = {
  shellRoot: HTMLElement | null;
  getDemoApi?: () => M3TutorialDemoApi | undefined;
  onStepChange?: (stepIndex: number) => void;
  onComplete: () => void;
};

function clampHole(domRect: DOMRect, pad: number): SpotlightRect | null {
  if (
    !Number.isFinite(domRect.left) ||
    !Number.isFinite(domRect.top) ||
    domRect.width < 8 ||
    domRect.height < 8
  ) {
    return null;
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const xl = Math.max(0, domRect.left - pad);
  const yt = Math.max(0, domRect.top - pad);
  const xr = Math.min(vw, domRect.right + pad);
  const yb = Math.min(vh, domRect.bottom + pad);
  return {
    left: Math.round(xl),
    top: Math.round(yt),
    width: Math.round(Math.max(32, xr - xl)),
    height: Math.round(Math.max(32, yb - yt)),
  };
}

function measureTarget(el: Element, pad: number): SpotlightRect | null {
  return clampHole(el.getBoundingClientRect(), pad);
}

function rectsEqual(a: SpotlightRect | null, b: SpotlightRect | null, epsilon = 2): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    Math.abs(a.left - b.left) <= epsilon &&
    Math.abs(a.top - b.top) <= epsilon &&
    Math.abs(a.width - b.width) <= epsilon &&
    Math.abs(a.height - b.height) <= epsilon
  );
}

function clipPathForHole(ax: SpotlightRect): string {
  const l = ax.left;
  const t = ax.top;
  const r = l + ax.width;
  const b = t + ax.height;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return `polygon(evenodd, 0px 0px, ${vw}px 0px, ${vw}px ${vh}px, 0px ${vh}px, 0px 0px, ${l}px ${t}px, ${r}px ${t}px, ${r}px ${b}px, ${l}px ${b}px, ${l}px ${t}px)`;
}

function scheduleAfterLayout(fn: () => void): () => void {
  let inner = 0;
  const outer = requestAnimationFrame(() => {
    inner = requestAnimationFrame(fn);
  });
  return () => {
    cancelAnimationFrame(outer);
    cancelAnimationFrame(inner);
  };
}

export function M3TutorialOverlay({ shellRoot, getDemoApi, onStepChange, onComplete }: M3TutorialOverlayProps) {
  const difficulty = useDifficulty();
  const steps = getM3TutorialSteps(difficulty.m3SignoffMax);
  const [stepIx, setStepIx] = useState(0);
  const [demoDone, setDemoDone] = useState(false);
  const [footerPos, setFooterPos] = useState<{ left: number; top: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const footerRef = useRef<HTMLDivElement>(null);
  const tutorialRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dimRef = useRef<HTMLDivElement>(null);
  const fullDimRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<SpotlightRect | null>(null);
  const reflowRaf = useRef(0);
  const scrolledStepRef = useRef(-1);
  const stopDemoRef = useRef<(() => void) | null>(null);
  const getDemoApiRef = useRef(getDemoApi);
  const onStepChangeRef = useRef(onStepChange);
  const stepIxRef = useRef(stepIx);
  const demoDoneRef = useRef(demoDone);

  getDemoApiRef.current = getDemoApi;

  onStepChangeRef.current = onStepChange;
  stepIxRef.current = stepIx;
  demoDoneRef.current = demoDone;

  const step = steps[stepIx];
  const isDemo = !!step?.demo;

  const hideShades = useCallback(() => {
    const dim = dimRef.current;
    const full = fullDimRef.current;
    const hi = highlightRef.current;
    if (dim) dim.style.display = "none";
    if (full) full.classList.remove("show", "m3-tut-full--post-demo");
    if (hi) {
      hi.classList.remove("show");
      hi.style.display = "none";
    }
    spotlightRef.current = null;
  }, []);

  const showPostDemoGate = useCallback(() => {
    hideShades();
    const full = fullDimRef.current;
    const hi = highlightRef.current;
    if (full) {
      full.classList.add("show", "m3-tut-full--post-demo");
      full.classList.remove("m3-tut-full--demo-reveal");
    }
    if (hi) {
      hi.classList.remove("show");
      hi.style.display = "none";
    }
    setFooterPos(null);
    getDemoApiRef.current?.()?.applyBaseline();
  }, [hideShades]);

  const layoutShades = useCallback((ax: SpotlightRect) => {
    const dim = dimRef.current;
    const full = fullDimRef.current;
    const hi = highlightRef.current;
    if (!dim || !full || !hi) return;

    full.classList.remove("show");
    dim.style.display = "block";
    dim.style.clipPath = clipPathForHole(ax);

    hi.style.display = "block";
    hi.classList.add("show");
    hi.style.left = `${ax.left}px`;
    hi.style.top = `${ax.top}px`;
    hi.style.width = `${ax.width}px`;
    hi.style.height = `${ax.height}px`;
  }, []);

  const applySpotlight = useCallback(
    (options?: { scroll?: boolean }) => {
      const currentStep = steps[stepIxRef.current];
      if (!currentStep || currentStep.demo) {
        hideShades();
        const full = fullDimRef.current;
        if (full && currentStep?.demo) {
          if (demoDoneRef.current) {
            showPostDemoGate();
          } else {
            full.classList.add("show");
            full.classList.remove("m3-tut-full--post-demo");
            if (tutorialRef.current?.classList.contains("m3-tut-demo-playing")) {
              full.classList.add("m3-tut-full--demo-reveal");
            } else {
              full.classList.remove("m3-tut-full--demo-reveal");
            }
          }
        }
        return;
      }

      if (!currentStep.selector || !shellRoot) {
        hideShades();
        return;
      }

      const el = shellRoot.querySelector(currentStep.selector);
      if (!el) {
        hideShades();
        return;
      }

      const prefersReducedMotion =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (
        options?.scroll &&
        !prefersReducedMotion &&
        el instanceof HTMLElement &&
        scrolledStepRef.current !== stepIxRef.current
      ) {
        scrolledStepRef.current = stepIxRef.current;
        try {
          el.scrollIntoView({ block: "nearest", behavior: "auto", inline: "nearest" });
        } catch {
          try {
            el.scrollIntoView(true);
          } catch {
            /* ignore */
          }
        }
      }

      const hole = measureTarget(el, currentStep.pad);
      if (!hole) {
        hideShades();
        return;
      }

      if (rectsEqual(hole, spotlightRef.current)) return;
      spotlightRef.current = hole;
      layoutShades(hole);
    },
    [hideShades, layoutShades, shellRoot, showPostDemoGate]
  );

  const stopDemoPlayback = useCallback((options?: { keepOverlay?: boolean }) => {
    stopDemoRef.current?.();
    stopDemoRef.current = null;
    const full = fullDimRef.current;
    const tutorialEl = tutorialRef.current;
    tutorialEl?.classList.remove("m3-tut-demo-playing");
    document.body.classList.remove("m3-tut-demo-playing");
    if (!full) return;
    full.classList.remove("m3-tut-full--demo-reveal");
    if (!options?.keepOverlay) {
      full.classList.remove("show", "m3-tut-full--post-demo");
    }
  }, []);

  const finalizeDemoStep = useCallback(() => {
    stopDemoPlayback({ keepOverlay: true });
    setDemoDone(true);
    requestAnimationFrame(() => showPostDemoGate());
  }, [showPostDemoGate, stopDemoPlayback]);

  const scheduleReflow = useCallback(
    (options?: { scroll?: boolean }) => {
      cancelAnimationFrame(reflowRaf.current);
      reflowRaf.current = requestAnimationFrame(() => {
        applySpotlight(options);
      });
    },
    [applySpotlight]
  );

  useEffect(() => {
    scrolledStepRef.current = -1;
    onStepChangeRef.current?.(stepIx);

    let cancelled = false;
    const cancelMeasure = scheduleAfterLayout(() => {
      if (cancelled) return;
      applySpotlight({ scroll: true });
      const currentStep = steps[stepIx];
      if (!currentStep?.selector || !shellRoot) return;
      const el = shellRoot.querySelector(currentStep.selector);
      if (!el || measureTarget(el, currentStep.pad)) return;
      requestAnimationFrame(() => {
        if (!cancelled) applySpotlight({ scroll: false });
      });
    });

    return () => {
      cancelled = true;
      cancelMeasure();
    };
  }, [applySpotlight, shellRoot, stepIx]);

  useEffect(() => {
    const onResize = () => scheduleReflow({ scroll: false });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [scheduleReflow]);

  useEffect(() => {
    const demoStepIx = steps.length - 1;
    if (stepIx !== demoStepIx || !shellRoot) return;

    let cancelled = false;
    const cancelStart = scheduleAfterLayout(() => {
      if (cancelled) return;
      const api = getDemoApiRef.current?.();
      if (!api) return;

      hideShades();
      const full = fullDimRef.current;
      const tutorialEl = tutorialRef.current;
      if (full) {
        full.classList.add("show", "m3-tut-full--demo-reveal");
      }
      tutorialEl?.classList.add("m3-tut-demo-playing");
      document.body.classList.add("m3-tut-demo-playing");

      void runM3TutorialDemo(shellRoot, api, {
        onComplete: () => {
          if (cancelled) return;
          finalizeDemoStep();
        },
      }).then((stop) => {
        if (cancelled) {
          stop();
          return;
        }
        stopDemoRef.current = stop;
      });
    });

    return () => {
      cancelled = true;
      cancelStart();
      stopDemoPlayback();
    };
  }, [finalizeDemoStep, hideShades, shellRoot, stepIx, stopDemoPlayback]);

  const finish = useCallback(() => {
    document.body.classList.remove("m3-tutorial-active", "r3-routing", "m3-tut-demo-playing");
    onComplete();
  }, [onComplete]);

  const skipDemo = useCallback(() => {
    stopDemoPlayback({ keepOverlay: true });
    setDemoDone(true);
    requestAnimationFrame(() => showPostDemoGate());
  }, [showPostDemoGate, stopDemoPlayback]);

  useEffect(() => {
    if (demoDone && isDemo) {
      showPostDemoGate();
    }
  }, [demoDone, isDemo, showPostDemoGate]);

  const handleNext = useCallback(() => {
    if (isDemo && !demoDone) {
      skipDemo();
      return;
    }
    const next = stepIx + 1;
    if (next >= steps.length) {
      finish();
      return;
    }
    setStepIx(next);
    setDemoDone(false);
  }, [demoDone, finish, isDemo, skipDemo, stepIx]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        finish();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      cancelAnimationFrame(reflowRaf.current);
    };
  }, [finish]);

  const onDragStart = (e: React.PointerEvent) => {
    const footer = footerRef.current;
    if (!footer) return;
    const rect = footer.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setDragging(true);
    footer.setPointerCapture(e.pointerId);
  };

  const onDragMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const footer = footerRef.current;
    if (!footer) return;
    const w = footer.offsetWidth;
    const h = footer.offsetHeight;
    const left = Math.max(8, Math.min(window.innerWidth - w - 8, e.clientX - dragOffset.current.x));
    const top = Math.max(8, Math.min(window.innerHeight - h - 8, e.clientY - dragOffset.current.y));
    setFooterPos({ left, top });
  };

  const onDragEnd = () => setDragging(false);

  const nextLabel = isDemo && !demoDone ? "Skip demo" : stepIx >= steps.length - 1 ? "Start mission" : "Next";

  const bodyHtml =
    isDemo && demoDone
      ? "<p><strong>Replay done.</strong> Select a file, read the inspector, then pick <strong>Public</strong>, <strong>Official</strong>, or <strong>No release</strong>.</p><p>Tap <strong>Start mission</strong> for <strong>Mission 3</strong> gameplay.</p>"
      : (step?.html ?? "");

  return (
    <div
      ref={tutorialRef}
      id="m3-tutorial"
      className="active"
      role="dialog"
      aria-modal="true"
      aria-labelledby="m3-tut-title"
    >
      <div ref={dimRef} id="m3-tut-dim" className="m3-tut-dim" aria-hidden />
      <div ref={fullDimRef} id="m3-tut-full" className="m3-tut-full" aria-hidden />
      <div ref={highlightRef} id="m3-tut-highlight" className="m3-tut-highlight" aria-hidden />

      <div
        id="m3-tut-footer"
        ref={footerRef}
        className={`${footerPos ? "m3-tut-footer--placed" : ""}${dragging ? " m3-tut-footer--dragging" : ""}${isDemo && demoDone ? " m3-tut-footer--spotlight" : ""}`}
        style={
          footerPos
            ? { left: footerPos.left, top: footerPos.top, bottom: "auto", transform: "none" }
            : undefined
        }
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
      >
        <div
          className="m3-tut-drag-handle"
          id="m3-tut-drag-handle"
          onPointerDown={onDragStart}
        >
          <span className="m3-tut-drag-grip" aria-hidden>
            <i className="fas fa-grip-lines" />
          </span>
          <div className="m3-tut-drag-handle-main">
            <span className="m3-tut-kicker">Briefing overlay</span>
            <div id="m3-tut-meta" className="m3-tut-meta">
              <span id="m3-tut-counter">
                Step {stepIx + 1} / {steps.length}
              </span>
              <span id="m3-tut-phase">
                {step?.phase === "demo" ? "DEMO" : step?.phase === "tour" ? "ROUTING" : "TOUR"}
              </span>
            </div>
            <h3 id="m3-tut-title">{step?.title}</h3>
          </div>
        </div>
        <div className="m3-tut-inner">
          <div id="m3-tut-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          <div className="m3-tut-actions">
            {!demoDone && (
              <button type="button" id="m3-tut-skip" onClick={finish}>
                Skip tutorial
              </button>
            )}
            <button
              type="button"
              id="m3-tut-next"
              className={isDemo && demoDone ? "m3-tut-next--cta" : undefined}
              onClick={handleNext}
            >
              {nextLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
