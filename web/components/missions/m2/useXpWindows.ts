"use client";

import { useCallback, useRef, useState } from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";

export type XpWindowGeom = {
  top: number;
  left: number;
  width: number;
  /** explicit .xp-body height once the user resizes; otherwise the default from markup */
  bodyHeight: number | null;
  z: number;
  minimized: boolean;
  maximized: boolean;
  /** saved geometry to restore when un-maximizing */
  saved: { top: number; left: number; width: number } | null;
};

export type XpWindowsConfig = Record<string, { top: number; left: number; width: number; z: number; bodyHeight?: number }>;

/**
 * Windows-XP style window manager ported from round2_v14's
 * dragWin/resizeWin/minWin/maxWin/toggleWin/bringToFront.
 * Geometry is presentational state; which windows exist/are open
 * stays in the mission reducer.
 */
export function useXpWindows(config: XpWindowsConfig, desktopRef: React.RefObject<HTMLElement | null>) {
  const [geoms, setGeoms] = useState<Record<string, XpWindowGeom>>(() => {
    const out: Record<string, XpWindowGeom> = {};
    for (const [id, c] of Object.entries(config)) {
      out[id] = { top: c.top, left: c.left, width: c.width, bodyHeight: c.bodyHeight ?? null, z: c.z, minimized: false, maximized: false, saved: null };
    }
    return out;
  });
  const zTop = useRef(112);

  const bringToFront = useCallback((id: string) => {
    zTop.current += 1;
    const z = zTop.current;
    setGeoms((g) => ({ ...g, [id]: { ...g[id], z } }));
  }, []);

  const restore = useCallback(
    (id: string) => {
      setGeoms((g) => ({ ...g, [id]: { ...g[id], minimized: false } }));
      bringToFront(id);
    },
    [bringToFront]
  );

  const minimize = useCallback((id: string) => {
    setGeoms((g) => ({ ...g, [id]: { ...g[id], minimized: true } }));
  }, []);

  const toggleMaximize = useCallback(
    (id: string) => {
      setGeoms((g) => {
        const w = g[id];
        if (w.maximized) {
          const s = w.saved;
          return { ...g, [id]: { ...w, maximized: false, saved: null, ...(s ?? {}) } };
        }
        return { ...g, [id]: { ...w, maximized: true, minimized: false, saved: { top: w.top, left: w.left, width: w.width } } };
      });
      bringToFront(id);
    },
    [bringToFront]
  );

  /** XP taskbar button behaviour: restore / minimize-if-focused / focus. */
  const taskbarToggle = useCallback(
    (id: string, isOpen: boolean, openWindow: (id: string) => void) => {
      const w = geoms[id];
      if (!isOpen || w.minimized) {
        openWindow(id);
        restore(id);
        return;
      }
      const isTop = w.z === zTop.current;
      if (isTop) minimize(id);
      else bringToFront(id);
    },
    [geoms, restore, minimize, bringToFront]
  );

  const startDrag = useCallback(
    (e: ReactMouseEvent, id: string) => {
      const w = geoms[id];
      if (w.maximized) return;
      bringToFront(id);
      const ox = e.clientX - w.left;
      const oy = e.clientY - w.top;
      const panel = desktopRef.current;
      const winEl = (e.currentTarget as HTMLElement).closest(".xp-win") as HTMLElement | null;
      const mv = (ev: MouseEvent) => {
        if (!panel || !winEl) return;
        const p = panel.getBoundingClientRect();
        let nx = ev.clientX - ox;
        let ny = ev.clientY - oy;
        nx = Math.max(0, Math.min(nx, p.width - winEl.offsetWidth));
        ny = Math.max(0, Math.min(ny, p.height - winEl.offsetHeight));
        setGeoms((g) => ({ ...g, [id]: { ...g[id], left: nx, top: ny } }));
      };
      const up = () => {
        document.removeEventListener("mousemove", mv);
        document.removeEventListener("mouseup", up);
      };
      document.addEventListener("mousemove", mv);
      document.addEventListener("mouseup", up);
      e.preventDefault();
    },
    [geoms, bringToFront, desktopRef]
  );

  const startResize = useCallback(
    (e: ReactMouseEvent, id: string) => {
      const w = geoms[id];
      if (w.maximized) return;
      bringToFront(id);
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = w.width;
      const winEl = (e.currentTarget as HTMLElement).closest(".xp-win") as HTMLElement | null;
      const bodyEl = winEl?.querySelector(".xp-body") as HTMLElement | null;
      const startBH = bodyEl ? bodyEl.offsetHeight : 0;
      const mv = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const nw = Math.max(220, startW + dx);
        const nbh = Math.max(40, startBH + dy);
        setGeoms((g) => ({ ...g, [id]: { ...g[id], width: nw, bodyHeight: nbh } }));
      };
      const up = () => {
        document.removeEventListener("mousemove", mv);
        document.removeEventListener("mouseup", up);
      };
      document.addEventListener("mousemove", mv);
      document.addEventListener("mouseup", up);
      e.preventDefault();
    },
    [geoms, bringToFront]
  );

  const setLeft = useCallback((id: string, left: number) => {
    setGeoms((g) => ({ ...g, [id]: { ...g[id], left } }));
  }, []);

  const styleFor = useCallback(
    (id: string): CSSProperties => {
      const w = geoms[id];
      if (w.maximized) return { top: 0, left: 0, width: "100%", height: "calc(100% - 30px)", zIndex: w.z };
      return { top: w.top, left: w.left, width: w.width, zIndex: w.z };
    },
    [geoms]
  );

  return { geoms, bringToFront, restore, minimize, toggleMaximize, taskbarToggle, startDrag, startResize, styleFor, setLeft };
}
