"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { M5TutorialOverlay } from "@/components/missions/m5/M5TutorialOverlay";
import { M5TutorialShell, type M5TutorialShellHandle } from "@/components/missions/m5/M5TutorialShell";

type M5TutorialPhaseProps = {
  onComplete: () => void;
  enterFromBrief?: boolean;
};

export function M5TutorialPhase({ onComplete, enterFromBrief }: M5TutorialPhaseProps) {
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

  if (!portalReady) return null;

  return createPortal(
    <>
      <M5TutorialShell ref={shellRef} />
      {ready && shellRoot && (
        <M5TutorialOverlay
          shellRoot={shellRoot}
          getDemoApi={() => shellRef.current!.getDemoApi()}
          onStepChange={handleStepChange}
          onComplete={onComplete}
        />
      )}
    </>,
    document.body
  );
}
