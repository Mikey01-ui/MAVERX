"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { M5TutorialOverlay } from "@/components/missions/m5/M5TutorialOverlay";
import { M5TutorialShell, type M5TutorialShellHandle } from "@/components/missions/m5/M5TutorialShell";

type M5TutorialPhaseProps = {
  onComplete: () => void;
  enterFromBrief?: boolean;
  continueHref?: string;
};

export function M5TutorialPhase({ onComplete, enterFromBrief, continueHref }: M5TutorialPhaseProps) {
  const shellRef = useRef<M5TutorialShellHandle>(null);
  const [shellRoot, setShellRoot] = useState<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    document.body.classList.add("m5-tutorial-active");
    if (enterFromBrief) {
      document.documentElement.classList.add("m5-enter-from-brief");
      const t = window.setTimeout(() => {
        document.documentElement.classList.remove("m5-enter-from-brief");
      }, 500);
      return () => {
        window.clearTimeout(t);
        document.documentElement.classList.remove("m5-enter-from-brief");
        document.body.classList.remove("m5-tutorial-active");
      };
    }
    return () => document.body.classList.remove("m5-tutorial-active");
  }, [enterFromBrief]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!portalReady) return;
    const id = requestAnimationFrame(() => {
      shellRef.current?.reset();
      setShellRoot(shellRef.current?.root ?? null);
      setReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, [portalReady]);

  const handleStepChange = useCallback((ix: number) => {
    shellRef.current?.prepareForStep(ix);
  }, []);

  if (!portalReady) {
    if (!continueHref) return null;
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
          fontFamily: "var(--font-display, monospace)",
          color: "var(--text, #e8e4dc)",
          background: "var(--bg, #0a0c10)",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <p style={{ opacity: 0.7, marginBottom: "1.25rem" }}>Mission tutorial</p>
          <a
            href={continueHref}
            className="btn-primary btn-sweep"
            style={{ textDecoration: "none", display: "inline-flex" }}
          >
            Start mission →
          </a>
          <p style={{ marginTop: "1rem", fontSize: "0.85rem", opacity: 0.55 }}>
            <a href={continueHref} style={{ color: "inherit" }}>
              Skip tutorial
            </a>
          </p>
        </div>
      </main>
    );
  }

  return createPortal(
    <>
      <M5TutorialShell ref={shellRef} />
      {ready && shellRoot && (
        <M5TutorialOverlay
          shellRoot={shellRoot}
          getDemoApi={() => shellRef.current!.getDemoApi()}
          onStepChange={handleStepChange}
          onComplete={onComplete}
          continueHref={continueHref}
        />
      )}
    </>,
    document.body
  );
}
