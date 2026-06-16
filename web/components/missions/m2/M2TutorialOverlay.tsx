"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { M2_TUTORIAL_STEPS, type TutorialPad } from "@/lib/game/m2/tutorialSteps";
import type { M2TutorialDemoApi } from "@/lib/game/m2/tutorialDemo";

type SpotlightRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type M2TutorialOverlayProps = {
  shellRoot: HTMLElement | null;
  getDemoApi?: () => M2TutorialDemoApi | undefined;
  onStepChange?: (stepIndex: number) => void;
  onComplete: () => void;
};

function normalizePad(pad: TutorialPad) {
  if (typeof pad === "number") {
    return { top: pad, right: pad, bottom: pad, left: pad };
  }
  return {
    top: pad.top ?? 8,
    right: pad.right ?? 8,
    bottom: pad.bottom ?? 8,
    left: pad.left ?? 8,
  };
}

function clampHole(domRect: DOMRect, pad: TutorialPad): SpotlightRect | null {
  if (
    !Number.isFinite(domRect.left) ||
    !Number.isFinite(domRect.top) ||
    domRect.width < 8 ||
    domRect.height < 8
  ) {
    return null;
  }
  const p = normalizePad(pad);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const xl = Math.max(0, domRect.left - p.left);
  const yt = Math.max(0, domRect.top - p.top);
  const xr = Math.min(vw, domRect.right + p.right);
  const yb = Math.min(vh, domRect.bottom + p.bottom);
  const rawW = xr - xl;
  const rawH = yb - yt;
  const minH = Math.min(32, Math.max(20, domRect.height + p.top + Math.max(0, p.bottom)));
  return {
    left: Math.round(xl),
    top: Math.round(yt),
    width: Math.round(Math.max(32, rawW)),
    height: Math.round(Math.max(minH, rawH)),
  };
}

function measureTarget(el: Element, pad: TutorialPad): SpotlightRect | null {
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

export function M2TutorialOverlay({ shellRoot, getDemoApi, onStepChange, onComplete }: M2TutorialOverlayProps) {
  const [stepIx, setStepIx] = useState(0);
  const [interactionComplete, setInteractionComplete] = useState(false);
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
  const onStepChangeRef = useRef(onStepChange);
  const stepIxRef = useRef(stepIx);

  onStepChangeRef.current = onStepChange;
  stepIxRef.current = stepIx;

  const step = M2_TUTORIAL_STEPS[stepIx];
  const isDemo = !!step?.demo;
  const requiresInteraction = !!step?.interaction;

  useEffect(() => {
    const tutEl = tutorialRef.current;
    if (!tutEl) return;
    if (requiresInteraction && !interactionComplete) {
      tutEl.classList.add("m2-tut-interactive");
    } else {
      tutEl.classList.remove("m2-tut-interactive");
    }
  }, [requiresInteraction, interactionComplete]);

  const hideShades = useCallback(() => {
    const dim = dimRef.current;
    const full = fullDimRef.current;
    const hi = highlightRef.current;
    if (dim) dim.style.display = "none";
    if (full) full.classList.remove("show");
    if (hi) {
      hi.classList.remove("show");
      hi.style.display = "none";
    }
    spotlightRef.current = null;
  }, []);

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
      const currentStep = M2_TUTORIAL_STEPS[stepIxRef.current];

      if (!currentStep || (currentStep.demo && currentStep.interaction && !currentStep.selector)) {
        hideShades();
        const full = fullDimRef.current;
        if (full && currentStep?.demo && currentStep.interaction) {
          full.classList.remove("show");
        }
        return;
      }

      if (currentStep.demo && currentStep.interaction && currentStep.selector) {
        const dim = dimRef.current;
        if (dim) dim.style.display = "none";
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
    [hideShades, layoutShades, shellRoot]
  );

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
    setInteractionComplete(false);
    onStepChangeRef.current?.(stepIx);

    let cancelled = false;
    const cancelMeasure = scheduleAfterLayout(() => {
      if (cancelled) return;
      applySpotlight({ scroll: true });
      const currentStep = M2_TUTORIAL_STEPS[stepIx];
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
    if (!shellRoot) return;

    let cancelled = false;
    const reflow = () => {
      if (!cancelled) scheduleReflow({ scroll: false });
    };

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== shellRoot || event.propertyName !== "opacity") return;
      reflow();
    };

    shellRoot.addEventListener("transitionend", onTransitionEnd);
    const t = window.setTimeout(reflow, 650);

    return () => {
      cancelled = true;
      shellRoot.removeEventListener("transitionend", onTransitionEnd);
      window.clearTimeout(t);
    };
  }, [scheduleReflow, shellRoot]);

  useEffect(() => {
    if (interactionComplete) {
      hideShades();
    }
  }, [hideShades, interactionComplete]);

  useEffect(() => {
    if (!requiresInteraction || !shellRoot) return;

    const currentStep = M2_TUTORIAL_STEPS[stepIx];
    if (!currentStep?.interaction) return;

    const handleInteraction = (e: Event) => {
      const target = e.target as HTMLElement;

      if (currentStep.interaction === "click-registry-row") {
        if (target.closest("#m2-tut-reg-row")) {
          setInteractionComplete(true);
        }
        return;
      }

      if (currentStep.interaction === "click-tribunal-ruling") {
        if (target.closest(".m2-tut-rule-btn")) {
          requestAnimationFrame(() => {
            if (getDemoApi?.()?.isRuledCorrect()) {
              setInteractionComplete(true);
            }
          });
        }
        return;
      }

      if (currentStep.interaction === "click-verify-complete") {
        if (target.closest(".m2-tut-verify-btn")) {
          requestAnimationFrame(() => {
            if (getDemoApi?.()?.isVerifyComplete()) {
              setInteractionComplete(true);
            }
          });
        }
      }
    };

    shellRoot.addEventListener("click", handleInteraction);
    return () => shellRoot.removeEventListener("click", handleInteraction);
  }, [getDemoApi, requiresInteraction, shellRoot, stepIx]);

  const finish = useCallback(() => {
    document.body.classList.remove("m2-tutorial-active");
    onComplete();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (requiresInteraction && !interactionComplete) return;
    const next = stepIx + 1;
    if (next >= M2_TUTORIAL_STEPS.length) {
      finish();
      return;
    }
    setStepIx(next);
    setInteractionComplete(false);
  }, [finish, interactionComplete, requiresInteraction, stepIx]);

  useEffect(() => {
    if (interactionComplete && requiresInteraction) {
      const timer = setTimeout(handleNext, 800);
      return () => clearTimeout(timer);
    }
  }, [handleNext, interactionComplete, requiresInteraction]);

  const handleBack = useCallback(() => {
    if (stepIx > 0) {
      setStepIx(stepIx - 1);
      setInteractionComplete(false);
    }
  }, [stepIx]);

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

  const isLastStep = stepIx >= M2_TUTORIAL_STEPS.length - 1;
  const nextLabel = isLastStep ? "Start mission" : requiresInteraction && !interactionComplete ? "Complete action above" : "Next";
  const nextDisabled = requiresInteraction && !interactionComplete;

  return (
    <div
      ref={tutorialRef}
      id="m2-tutorial"
      className="active"
      role="dialog"
      aria-modal="true"
      aria-labelledby="m2-tut-title"
    >
      <div ref={dimRef} id="m2-tut-dim" className="m2-tut-dim" aria-hidden />
      <div ref={fullDimRef} id="m2-tut-full" className="m2-tut-full" aria-hidden />
      <div ref={highlightRef} id="m2-tut-highlight" className="m2-tut-highlight" aria-hidden />

      <div
        id="m2-tut-footer"
        ref={footerRef}
        className={`${footerPos ? "m2-tut-footer--placed" : ""}${dragging ? " m2-tut-footer--dragging" : ""}`}
        style={
          footerPos
            ? { left: footerPos.left, top: footerPos.top, bottom: "auto", transform: "none" }
            : undefined
        }
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
      >
        <div className="m2-tut-drag-handle" id="m2-tut-drag-handle" onPointerDown={onDragStart}>
          <span className="m2-tut-drag-grip" aria-hidden>
            <i className="fas fa-grip-lines" />
          </span>
          <div className="m2-tut-drag-handle-main">
            <span className="m2-tut-kicker">Tutorial</span>
            <div id="m2-tut-meta" className="m2-tut-meta">
              <span id="m2-tut-counter">
                Step {stepIx + 1} / {M2_TUTORIAL_STEPS.length}
              </span>
              <span id="m2-tut-phase">{step?.phase === "demo" ? "HANDS-ON" : "TOUR"}</span>
            </div>
            <h3 id="m2-tut-title">{step?.title}</h3>
          </div>
        </div>
        <div className="m2-tut-inner">
          <div id="m2-tut-body" dangerouslySetInnerHTML={{ __html: step?.html ?? "" }} />
          {interactionComplete && requiresInteraction && (
            <div className="m2-tut-success">
              <i className="fas fa-check-circle" aria-hidden /> Great! Moving to next step...
            </div>
          )}
          <div className="m2-tut-actions">
            <button type="button" id="m2-tut-skip" onClick={finish}>
              Skip tutorial
            </button>
            {stepIx > 0 && !isDemo && (
              <button type="button" id="m2-tut-back" onClick={handleBack}>
                Back
              </button>
            )}
            <button
              type="button"
              id="m2-tut-next"
              className={isLastStep ? "m2-tut-next--cta" : undefined}
              onClick={handleNext}
              disabled={nextDisabled}
            >
              {nextLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
