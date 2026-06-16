"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";

/**
 * Viewport-clamped floating tooltip for glossary terms, ported from the
 * legacy missions' `.gloss` / `.gloss-tip` implementation. Render <Gloss>
 * inside a mission wrapper that carries the mission scope class so the
 * `.gloss` styling applies; the tip itself is attached to document.body.
 */
let tipEl: HTMLDivElement | null = null;
let tipScope = "";

function ensureTip(scopeClass: string) {
  if (!tipEl) {
    tipEl = document.createElement("div");
    document.body.appendChild(tipEl);
  }
  if (tipScope !== scopeClass) {
    // Scope class makes the mission CSS (`.m2-mission .gloss-tip`) apply.
    tipEl.className = `${scopeClass} gloss-tip`;
    tipScope = scopeClass;
  }
  return tipEl;
}

export function Gloss({ scopeClass, text, children }: { scopeClass: string; text: string; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);

  const show = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const t = ensureTip(scopeClass);
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
  }, [scopeClass, text]);

  const hide = useCallback(() => {
    tipEl?.classList.remove("show");
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
