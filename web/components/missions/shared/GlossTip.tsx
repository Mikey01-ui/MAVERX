"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import "./gloss-tip.css";

/**
 * Viewport-clamped floating glossary tip. Portaled to document.body —
 * chrome lives in gloss-tip.css (`.gloss-tip`), not under the mission root.
 */
let tipEl: HTMLDivElement | null = null;

function ensureTip() {
  if (!tipEl || !tipEl.isConnected) {
    tipEl = document.createElement("div");
    tipEl.className = "gloss-tip";
    document.body.appendChild(tipEl);
  }
  return tipEl;
}

export function Gloss({
  scopeClass: _scopeClass,
  text,
  children,
}: {
  /** Kept for call-site compatibility; tip chrome is global `.gloss-tip`. */
  scopeClass: string;
  text: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  const show = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const t = ensureTip();
    t.textContent = text;
    t.classList.add("show");
    const r = el.getBoundingClientRect();
    const tw = t.offsetWidth;
    const th = t.offsetHeight;
    const margin = 8;
    let left = r.left + r.width / 2 - tw / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - tw - margin));
    let top = r.top - th - 10;
    if (top < margin) top = r.bottom + 10;
    t.style.left = `${left}px`;
    t.style.top = `${top}px`;
  }, [text]);

  const hide = useCallback(() => {
    if (!tipEl) return;
    tipEl.classList.remove("show");
    tipEl.textContent = "";
  }, []);

  useEffect(() => {
    const onScroll = () => hide();
    window.addEventListener("scroll", onScroll, true);
    document.addEventListener("click", hide);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("click", hide);
      hide();
    };
  }, [hide]);

  return (
    <span
      ref={ref}
      className="gloss"
      tabIndex={0}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={(e) => {
        e.stopPropagation();
        if (tipEl?.classList.contains("show")) hide();
        else show();
      }}
    >
      {children}
    </span>
  );
}
