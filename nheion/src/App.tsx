import React, { useEffect, useState, useRef } from "react";
import { MaverxDashboard } from "./pages/MaverxDashboard";

export function App() {
  const [isBlackoutActive, setIsBlackoutActive] = useState(false);
  const blackoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerBlackout = (durationMs = 2500) => {
    setIsBlackoutActive(true);
    if (blackoutTimeoutRef.current) {
      clearTimeout(blackoutTimeoutRef.current);
    }
    blackoutTimeoutRef.current = setTimeout(() => {
      setIsBlackoutActive(false);
    }, durationMs);
  };

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      const key = e.key.toLowerCase();

      // Screenshot combinations
      const isScreenshotAttempt =
        e.key === 'PrintScreen' ||
        (cmdOrCtrl && e.shiftKey && (key === '3' || key === '4' || key === '5' || key === '6' || key === 's'));

      if (isScreenshotAttempt) {
        triggerBlackout(2500);
      }

      if (
        e.key === 'F12' ||
        (cmdOrCtrl && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) ||
        (isMac && e.metaKey && e.altKey && (key === 'i' || key === 'j' || key === 'c')) ||
        (cmdOrCtrl && (key === 'u' || key === 's' || key === 'p'))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('dragstart', handleDragStart);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('dragstart', handleDragStart);
      if (blackoutTimeoutRef.current) {
        clearTimeout(blackoutTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {isBlackoutActive && (
        <div
          className="fixed inset-0 z-[99999999] bg-black"
          style={{ backgroundColor: '#000000' }}
          onClick={() => setIsBlackoutActive(false)}
        />
      )}
      <MaverxDashboard />
    </>
  );
}
