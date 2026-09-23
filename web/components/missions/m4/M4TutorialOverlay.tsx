"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { runM4TutorialDemo, skipM4TutorialDemo, type M4TutorialDemoApi } from "@/lib/game/m4/tutorialDemo";
import { M4_TUTORIAL_STEPS } from "@/lib/game/m4/tutorialSteps";

type SpotlightRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type Props = {
  shellRoot: HTMLElement | null;
  getDemoApi: () => M4TutorialDemoApi;
  onStepChange?: (stepIndex: number) => void;
  onComplete: () => void;
  continueHref?: string;
};

function clampHole(domRect: DOMRect, pad: number): SpotlightRect | null {
  if (!Number.isFinite(domRect.left) || domRect.width < 8 || domRect.height < 8) return null;
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

export function M4TutorialOverlay({ shellRoot, getDemoApi, onStepChange, onComplete, continueHref }: Props) {
  const [stepIx, setStepIx] = useState(0);
  const [demoDone, setDemoDone] = useState(false);

  const tutorialRef = useRef<HTMLDivElement>(null);
  const stripTopRef = useRef<HTMLDivElement>(null);
  const stripBottomRef = useRef<HTMLDivElement>(null);
  const stripLeftRef = useRef<HTMLDivElement>(null);
  const stripRightRef = useRef<HTMLDivElement>(null);
  const fullRef = useRef<HTMLDivElement>(null);
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

  const step = M4_TUTORIAL_STEPS[stepIx];
  const isDemo = !!step?.demo;

  const hideShades = useCallback(() => {
    [stripTopRef, stripBottomRef, stripLeftRef, stripRightRef].forEach((r) => {
      r.current?.classList.remove("m4-tut-strip--show");
    });
    const hi = highlightRef.current;
    if (hi) {
      hi.classList.remove("show", "animate-pulse");
      hi.style.display = "none";
    }
    spotlightRef.current = null;
  }, []);

  const layoutStrips = useCallback((ax: SpotlightRect) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const top = stripTopRef.current;
    const left = stripLeftRef.current;
    const right = stripRightRef.current;
    const bottom = stripBottomRef.current;
    const full = fullRef.current;
    if (!top || !left || !right || !bottom) return;

    full?.classList.remove("show", "m4-tut-full--demo-reveal");

    top.style.top = "0";
    top.style.left = "0";
    top.style.width = "100vw";
    top.style.height = `${ax.top}px`;

    left.style.top = `${ax.top}px`;
    left.style.left = "0";
    left.style.width = `${ax.left}px`;
    left.style.height = `${ax.height}px`;

    right.style.top = `${ax.top}px`;
    right.style.left = `${ax.left + ax.width}px`;
    right.style.width = `${Math.max(0, vw - ax.left - ax.width)}px`;
    right.style.height = `${ax.height}px`;

    bottom.style.top = `${ax.top + ax.height}px`;
    bottom.style.left = "0";
    bottom.style.width = "100vw";
    bottom.style.height = `${Math.max(0, vh - ax.top - ax.height)}px`;

    [top, left, right, bottom].forEach((el) => el.classList.add("m4-tut-strip--show"));
  }, []);

  const showPostDemoGate = useCallback(() => {
    hideShades();
    const full = fullRef.current;
    const hi = highlightRef.current;
    if (full) {
      full.classList.add("show", "m4-tut-full--post-demo");
      full.classList.remove("m4-tut-full--demo-reveal");
    }
    if (hi) {
      hi.classList.remove("show", "animate-pulse");
      hi.style.display = "none";
    }
    getDemoApiRef.current().applyBaseline();
  }, [hideShades]);

  const applySpotlight = useCallback(
    (options?: { scroll?: boolean }) => {
      const currentStep = M4_TUTORIAL_STEPS[stepIxRef.current];
      if (!currentStep || currentStep.demo) {
        hideShades();
        const full = fullRef.current;
        if (full && currentStep?.demo) {
          if (demoDoneRef.current) {
            showPostDemoGate();
          } else {
            full.classList.add("show");
            full.classList.remove("m4-tut-full--post-demo");
            if (tutorialRef.current?.classList.contains("m4-tut-demo-playing")) {
              full.classList.add("m4-tut-full--demo-reveal");
            } else {
              full.classList.remove("m4-tut-full--demo-reveal");
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
          el.scrollIntoView({ block: "nearest", behavior: "smooth", inline: "nearest" });
        } catch {
          el.scrollIntoView(true);
        }
      }

      const hole = measureTarget(el, currentStep.pad);
      if (!hole) {
        hideShades();
        return;
      }

      spotlightRef.current = hole;
      const hi = highlightRef.current;
      if (hi) {
        hi.style.display = "block";
        hi.classList.add("show");
        if (!prefersReducedMotion) hi.classList.add("animate-pulse");
        else hi.classList.remove("animate-pulse");
        hi.style.left = `${hole.left}px`;
        hi.style.top = `${hole.top}px`;
        hi.style.width = `${hole.width}px`;
        hi.style.height = `${hole.height}px`;
      }
      layoutStrips(hole);
    },
    [hideShades, layoutStrips, shellRoot, showPostDemoGate]
  );

  const stopDemoPlayback = useCallback((options?: { keepOverlay?: boolean }) => {
    stopDemoRef.current?.();
    stopDemoRef.current = null;
    tutorialRef.current?.classList.remove("m4-tut-demo-playing");
    document.body.classList.remove("m4-tut-demo-playing");
    const full = fullRef.current;
    if (!full) return;
    full.classList.remove("m4-tut-full--demo-reveal");
    if (!options?.keepOverlay) {
      full.classList.remove("show", "m4-tut-full--post-demo");
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
      reflowRaf.current = requestAnimationFrame(() => applySpotlight(options));
    },
    [applySpotlight]
  );

  useEffect(() => {
    scrolledStepRef.current = -1;
    onStepChangeRef.current?.(stepIx);
    let cancelled = false;
    const cancelMeasure = scheduleAfterLayout(() => {
      if (!cancelled) applySpotlight({ scroll: true });
    });
    return () => {
      cancelled = true;
      cancelMeasure();
    };
  }, [applySpotlight, stepIx]);

  useEffect(() => {
    const onResize = () => scheduleReflow({ scroll: false });
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [scheduleReflow]);

  useEffect(() => {
    const demoStepIx = M4_TUTORIAL_STEPS.length - 1;
    if (stepIx !== demoStepIx || !shellRoot) return;

    let cancelled = false;
    const cancelStart = scheduleAfterLayout(() => {
      if (cancelled) return;
      const api = getDemoApiRef.current();
      hideShades();
      fullRef.current?.classList.add("show", "m4-tut-full--demo-reveal");
      tutorialRef.current?.classList.add("m4-tut-demo-playing");
      document.body.classList.add("m4-tut-demo-playing");

      void runM4TutorialDemo(shellRoot, api, {
        onComplete: () => {
          if (!cancelled) finalizeDemoStep();
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
    document.body.classList.remove("m4-tutorial-active");
    onComplete();
  }, [onComplete]);

  const skipDemo = useCallback(() => {
    if (shellRoot) {
      skipM4TutorialDemo(shellRoot, getDemoApiRef.current());
    }
    stopDemoPlayback({ keepOverlay: true });
    setDemoDone(true);
    requestAnimationFrame(() => showPostDemoGate());
  }, [shellRoot, showPostDemoGate, stopDemoPlayback]);

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
    if (next >= M4_TUTORIAL_STEPS.length) {
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
      stopDemoPlayback();
    };
  }, [finish, stopDemoPlayback]);

  const nextLabel =
    isDemo && !demoDone ? "Skip demo" : stepIx >= M4_TUTORIAL_STEPS.length - 1 ? "Start mission" : "Next";

  const phaseLabel = step?.phase === "demo" ? "DEMO" : step?.phase === "tour" ? "NEW IN M04" : "TOUR";

  const bodyHtml =
    isDemo && demoDone
      ? "<p><strong>Replay done.</strong> Click gate → read → <strong>×</strong> → drag file until the icon turns <strong>purple</strong>, then drop (two passes).</p><p>Tap <strong>Start mission</strong> for <strong>Mission 4</strong> gameplay.</p>"
      : (step?.html ?? "");

  return (
    <div ref={tutorialRef} id="m4-tutorial" className="active" role="dialog" aria-modal="true" aria-labelledby="m4-tut-title">
      <div ref={stripTopRef} id="m4-tut-strip-t" className="m4-tut-strip" aria-hidden />
      <div ref={stripBottomRef} id="m4-tut-strip-b" className="m4-tut-strip" aria-hidden />
      <div ref={stripLeftRef} id="m4-tut-strip-l" className="m4-tut-strip" aria-hidden />
      <div ref={stripRightRef} id="m4-tut-strip-r" className="m4-tut-strip" aria-hidden />
      <div ref={fullRef} id="m4-tut-full" className="m4-tut-full" aria-hidden />
      <div ref={highlightRef} id="m4-tut-highlight" className="animate-pulse" aria-hidden />

      <div
        id="m4-tut-footer"
        className={isDemo && demoDone ? "m4-tut-footer--spotlight" : undefined}
      >
        <div className="m4-tut-inner">
          <span className="m4-tut-kicker">Briefing overlay</span>
          <div className="m4-tut-meta">
            <span id="m4-tut-counter">
              Step {stepIx + 1} / {M4_TUTORIAL_STEPS.length}
            </span>
            <span id="m4-tut-phase">{phaseLabel}</span>
          </div>
          <h3 id="m4-tut-title">{step?.title}</h3>
          <div id="m4-tut-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          <div className="m4-tut-actions">
            {!demoDone &&
              (continueHref ? (
                <a href={continueHref} id="m4-tut-skip" style={{ textDecoration: "none" }}>
                  Skip tutorial
                </a>
              ) : (
                <button type="button" id="m4-tut-skip" onClick={finish}>
                  Skip tutorial
                </button>
              ))}
            <button
              type="button"
              id="m4-tut-next"
              className={isDemo && demoDone ? "m4-tut-next--cta" : undefined}
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
