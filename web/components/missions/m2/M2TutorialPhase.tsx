"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { M2TutorialOverlay } from "@/components/missions/m2/M2TutorialOverlay";
import { M2TutorialShell, type M2TutorialShellHandle } from "@/components/missions/m2/M2TutorialShell";

type M2TutorialPhaseProps = {
  onComplete: () => void;
  enterFromBrief?: boolean;
};

export function M2TutorialPhase({ onComplete, enterFromBrief }: M2TutorialPhaseProps) {
  const shellRef = useRef<M2TutorialShellHandle>(null);
  const [shellRoot, setShellRoot] = useState<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    document.body.classList.add("m2-tutorial-active");
    if (enterFromBrief) {
      document.documentElement.classList.add("m2-enter-from-brief");
      const t = window.setTimeout(() => {
        document.documentElement.classList.remove("m2-enter-from-brief");
      }, 60);
      return () => {
        window.clearTimeout(t);
        document.documentElement.classList.remove("m2-enter-from-brief");
        document.body.classList.remove("m2-tutorial-active");
      };
    }
    return () => {
      document.body.classList.remove("m2-tutorial-active");
    };
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
      <M2TutorialShell ref={shellRef} />
      {ready && shellRoot && (
        <M2TutorialOverlay
          shellRoot={shellRoot}
          getDemoApi={() => shellRef.current?.getDemoApi()}
          onStepChange={handleStepChange}
          onComplete={onComplete}
        />
      )}
    </>,
    document.body
  );
}
