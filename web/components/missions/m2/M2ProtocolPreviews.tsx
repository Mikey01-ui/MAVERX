"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";

/**
 * The three animated card previews on the M2 protocol page, ported from
 * round2_v14's startCard01Anim / startCard02Anim / startCard03Anim.
 * Each runs an infinitely-repeating GSAP cursor demo while its card is active.
 */

function ProtoCursor({ idPrefix }: { idPrefix: string }) {
  return (
    <div className="proto-cursor" data-cursor={idPrefix}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <line x1="10" y1="2" x2="10" y2="18" stroke="#f79421" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="2" y1="10" x2="18" y2="10" stroke="#f79421" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="10" cy="10" r="3" stroke="#f79421" strokeWidth="1" fill="none" />
      </svg>
      <div className="proto-cur-ring" />
    </div>
  );
}

function useCardTimeline(active: boolean, build: (panel: HTMLDivElement) => gsap.core.Timeline | null) {
  const panelRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!active) {
      tlRef.current?.pause();
      return;
    }
    if (tlRef.current) {
      tlRef.current.play(0);
      return;
    }
    if (panelRef.current) tlRef.current = build(panelRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(
    () => () => {
      tlRef.current?.kill();
      tlRef.current = null;
    },
    []
  );

  return panelRef;
}

function getPos(panel: HTMLElement, el: HTMLElement) {
  const pr = panel.getBoundingClientRect();
  const er = el.getBoundingClientRect();
  return { x: er.left - pr.left + er.width * 0.5 - 7, y: er.top - pr.top + er.height * 0.5 - 9 };
}

/* ── CARD 01: Tribunal panel ── */
export function Card01Preview({ active }: { active: boolean }) {
  const panelRef = useCardTimeline(active, (panel) => {
    const cursor = panel.querySelector<HTMLElement>("[data-cursor]");
    const ring = cursor?.querySelector<HTMLElement>(".proto-cur-ring");
    const node = panel.querySelector<HTMLElement>("[data-p1-finance]");
    const nodeStatus = panel.querySelector<HTMLElement>("[data-p1-ns-finance]");
    if (!cursor || !ring || !node || !nodeStatus) return null;

    gsap.set(cursor, { opacity: 0, x: 20, y: 14 });
    gsap.set(ring, { opacity: 0, scale: 0.5 });
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2, defaults: { ease: "power2.out" } });
    const clickPulse = (t: number) => {
      tl.to(ring, { opacity: 0.6, scale: 1.5, duration: 0.15, ease: "power1.out" }, t).to(ring, { opacity: 0, scale: 0.5, duration: 0.25 }, t + 0.18);
    };
    tl.to(cursor, { opacity: 1, duration: 0.35 }, 0.3);
    tl.to(cursor, { x: () => getPos(panel, node).x, y: () => getPos(panel, node).y, duration: 1.0, ease: "power2.inOut" }, 0.5);
    clickPulse(1.6);
    tl.call(
      () => {
        node.classList.add("pn-active");
        nodeStatus.textContent = "ACTIVE";
      },
      undefined,
      1.78
    );
    tl.to(cursor, { opacity: 0, duration: 0.3 }, 3.2);
    tl.call(
      () => {
        node.classList.remove("pn-active");
        nodeStatus.textContent = "OPEN";
      },
      undefined,
      3.6
    );
    tl.set(cursor, { x: 20, y: 14 }, 3.65);
    return tl;
  });

  return (
    <div className="card-preview" ref={panelRef} aria-hidden>
      <div className="p1-board">
        <div className="p1-board-hdr">GOVERNANCE TRIBUNAL</div>
        <div className="p1-nodes">
          <div className="proto-node" data-p1-finance>
            <div className="pn-icon">
              <i className="fas fa-coins" />
            </div>
            <div className="pn-name">FINANCE</div>
            <div className="pn-status" data-p1-ns-finance>
              OPEN
            </div>
          </div>
          <div className="proto-node">
            <div className="pn-icon">
              <i className="fas fa-server" />
            </div>
            <div className="pn-name">IT</div>
            <div className="pn-status">PENDING</div>
          </div>
          <div className="proto-node">
            <div className="pn-icon">
              <i className="fas fa-cogs" />
            </div>
            <div className="pn-name">OPERATIONS</div>
            <div className="pn-status">PENDING</div>
          </div>
          <div className="proto-node">
            <div className="pn-icon">
              <i className="fas fa-shield-alt" />
            </div>
            <div className="pn-name">COMPLIANCE</div>
            <div className="pn-status">PENDING</div>
          </div>
        </div>
      </div>
      <ProtoCursor idPrefix="p1" />
    </div>
  );
}

/* ── CARD 02: Registry + Inspector ── */
export function Card02Preview({ active }: { active: boolean }) {
  const panelRef = useCardTimeline(active, (panel) => {
    const cursor = panel.querySelector<HTMLElement>("[data-cursor]");
    const ring = cursor?.querySelector<HTMLElement>(".proto-cur-ring");
    const folder = panel.querySelector<HTMLElement>("[data-p2-folder]");
    const win = panel.querySelector<HTMLElement>("[data-p2-win]");
    const fileWrong = panel.querySelector<HTMLElement>("[data-p2-file-wrong]");
    const fileCorrect = panel.querySelector<HTMLElement>("[data-p2-file-correct]");
    const chart = panel.querySelector<HTMLElement>("[data-p2-chart]");
    const penalty = panel.querySelector<HTMLElement>("[data-p2-penalty]");
    if (!cursor || !ring || !folder || !win || !fileWrong || !fileCorrect || !chart || !penalty) return null;

    gsap.set(cursor, { opacity: 0, x: 16, y: 12 });
    gsap.set(ring, { opacity: 0, scale: 0.5 });
    gsap.set(win, { display: "none" });
    gsap.set(chart, { display: "none" });
    gsap.set(penalty, { opacity: 0 });
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.0, defaults: { ease: "power2.out" } });
    const clickPulse = (t: number) => {
      tl.to(ring, { opacity: 0.6, scale: 1.5, duration: 0.15, ease: "power1.out" }, t).to(ring, { opacity: 0, scale: 0.5, duration: 0.25 }, t + 0.18);
    };
    tl.to(cursor, { opacity: 1, duration: 0.3 }, 0.3);
    tl.to(cursor, { x: () => getPos(panel, folder).x, y: () => getPos(panel, folder).y, duration: 0.9, ease: "power2.inOut" }, 0.5);
    clickPulse(1.5);
    tl.call(
      () => {
        gsap.set(win, { display: "flex", opacity: 0 });
        folder.classList.add("di-sel");
      },
      undefined,
      1.65
    );
    tl.to(win, { opacity: 1, duration: 0.25 }, 1.68);
    tl.to(cursor, { x: () => getPos(panel, fileWrong).x, y: () => getPos(panel, fileWrong).y, duration: 0.75, ease: "power2.inOut" }, 2.15);
    clickPulse(2.95);
    tl.call(
      () => {
        fileWrong.classList.add("pf-wrong");
        const pr = panel.getBoundingClientRect();
        const er = fileWrong.getBoundingClientRect();
        gsap.set(penalty, { x: er.left - pr.left + er.width + 4, y: er.top - pr.top });
      },
      undefined,
      3.1
    );
    tl.to(penalty, { opacity: 1, duration: 0.18 }, 3.12);
    tl.to(penalty, { opacity: 0, duration: 0.2 }, 3.65);
    tl.call(() => fileWrong.classList.remove("pf-wrong"), undefined, 3.9);
    tl.to(cursor, { x: () => getPos(panel, fileCorrect).x, y: () => getPos(panel, fileCorrect).y, duration: 0.7, ease: "power2.inOut" }, 4.05);
    clickPulse(4.8);
    tl.call(() => fileCorrect.classList.add("pf-sel"), undefined, 4.95);
    tl.to(win, { opacity: 0, duration: 0.25 }, 5.05);
    tl.call(
      () => {
        gsap.set(win, { display: "none" });
        folder.classList.remove("di-sel");
        fileCorrect.classList.remove("pf-sel");
        gsap.set(chart, { display: "flex", opacity: 0 });
      },
      undefined,
      5.35
    );
    tl.to(chart, { opacity: 1, duration: 0.3 }, 5.37);
    tl.to(cursor, { opacity: 0, duration: 0.3 }, 7.2);
    tl.call(() => gsap.set(chart, { display: "none" }), undefined, 7.6);
    tl.set(cursor, { x: 16, y: 12 }, 7.65);
    return tl;
  });

  return (
    <div className="card-preview" ref={panelRef} aria-hidden>
      <div className="proto-xp-desktop">
        <div className="proto-xp-wallpaper" />
        <div className="proto-di" data-p2-folder style={{ top: 28, left: 28 }}>
          <div className="proto-di-icon">
            <i className="fas fa-folder" />
          </div>
          <div className="proto-di-label">Data_Registry</div>
        </div>
        <div className="proto-xp-win" data-p2-win style={{ display: "none" }}>
          <div className="proto-xp-tb">
            <i className="fas fa-folder" style={{ color: "#f0c538", fontSize: 8 }} />
            <span>Data_Governance_Registry</span>
            <div className="proto-xp-btns">
              <div className="proto-xp-btn">─</div>
              <div className="proto-xp-btn">□</div>
              <div className="proto-xp-cls proto-xp-btn">✕</div>
            </div>
          </div>
          <div className="proto-xp-body">
            <div className="proto-xp-files">
              <div className="proto-xp-file" data-p2-file-wrong>
                <div className="proto-xp-ficon">
                  <i className="fas fa-file" style={{ color: "#888" }} />
                </div>
                <div className="proto-xp-flabel">payroll_raw.dat</div>
              </div>
              <div className="proto-xp-file" data-p2-file-correct>
                <div className="proto-xp-ficon">
                  <i className="fas fa-file-alt" style={{ color: "#5400ad" }} />
                </div>
                <div className="proto-xp-flabel">GOV-2003-0041.dat</div>
              </div>
            </div>
          </div>
        </div>
        <div className="proto-xp-win" data-p2-chart style={{ display: "none" }}>
          <div className="proto-xp-tb">
            <i className="fas fa-magnifying-glass" style={{ color: "#90caf9", fontSize: 8 }} />
            <span>File_Inspector — Metadata</span>
            <div className="proto-xp-btns">
              <div className="proto-xp-btn">─</div>
              <div className="proto-xp-btn">□</div>
              <div className="proto-xp-cls proto-xp-btn">✕</div>
            </div>
          </div>
          <div className="proto-xp-body" style={{ flexDirection: "column", padding: "5px 7px 3px" }}>
            <div style={{ fontFamily: "'Tahoma',sans-serif", fontSize: 7.5, fontWeight: 700, color: "#333", marginBottom: 3 }}>GOV-2003-0041.dat</div>
            <div style={{ fontFamily: "'Tahoma',sans-serif", fontSize: 6.5, color: "#666", lineHeight: 1.6 }}>
              Data Steward: <span style={{ color: "#5400ad", fontWeight: 700 }}>Finance Dept</span>
              <br />
              Owner: Finance
              <br />
              Lineage: HR → Finance
              <br />
              Records: 14,200
            </div>
          </div>
        </div>
        <div className="p2-penalty" data-p2-penalty>
          WRONG FILE
        </div>
        <div className="proto-xp-taskbar">
          <div className="proto-xp-start">
            <i className="fas fa-windows" /> start
          </div>
          <div className="proto-xp-clock">09:14</div>
        </div>
      </div>
      <ProtoCursor idPrefix="p2" />
    </div>
  );
}

/* ── CARD 03: Verify & Extract ── */
export function Card03Preview({ active }: { active: boolean }) {
  const panelRef = useCardTimeline(active, (panel) => {
    const cursor = panel.querySelector<HTMLElement>("[data-cursor]");
    const ring = cursor?.querySelector<HTMLElement>(".proto-cur-ring");
    const optA = panel.querySelector<HTMLElement>("[data-p3-opt-a]");
    const optB = panel.querySelector<HTMLElement>("[data-p3-opt-b]");
    const confirm = panel.querySelector<HTMLElement>("[data-p3-confirm]");
    const node = panel.querySelector<HTMLElement>("[data-p3-node]");
    const status = panel.querySelector<HTMLElement>("[data-p3-node-status]");
    if (!cursor || !ring || !optA || !optB || !confirm || !node || !status) return null;

    gsap.set(cursor, { opacity: 0, x: 20, y: 20 });
    gsap.set(ring, { opacity: 0, scale: 0.5 });
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.0, defaults: { ease: "power2.out" } });
    const clickPulse = (t: number) => {
      tl.to(ring, { opacity: 0.6, scale: 1.5, duration: 0.15, ease: "power1.out" }, t).to(ring, { opacity: 0, scale: 0.5, duration: 0.25 }, t + 0.18);
    };
    tl.to(cursor, { opacity: 1, duration: 0.3 }, 0.3);
    tl.to(cursor, { x: () => getPos(panel, optA).x, y: () => getPos(panel, optA).y, duration: 0.9, ease: "power2.inOut" }, 0.5);
    clickPulse(1.5);
    tl.call(
      () => {
        optA.classList.add("chip-sel");
        confirm.classList.add("confirm-active");
      },
      undefined,
      1.65
    );
    tl.to(cursor, { x: () => getPos(panel, confirm).x, y: () => getPos(panel, confirm).y, duration: 0.7, ease: "power2.inOut" }, 2.0);
    clickPulse(2.8);
    tl.call(
      () => {
        optA.classList.remove("chip-sel");
        optA.classList.add("chip-wrong");
        confirm.classList.remove("confirm-active");
      },
      undefined,
      2.95
    );
    tl.to(cursor, { x: () => getPos(panel, optB).x, y: () => getPos(panel, optB).y, duration: 0.8, ease: "power2.inOut" }, 3.5);
    clickPulse(4.4);
    tl.call(
      () => {
        optA.classList.remove("chip-wrong");
        optB.classList.add("chip-sel");
        confirm.classList.add("confirm-active");
      },
      undefined,
      4.55
    );
    tl.to(cursor, { x: () => getPos(panel, confirm).x, y: () => getPos(panel, confirm).y, duration: 0.6, ease: "power2.inOut" }, 5.0);
    clickPulse(5.7);
    tl.call(
      () => {
        optB.classList.remove("chip-sel");
        optB.classList.add("chip-correct");
        node.classList.add("pn-locked");
        status.textContent = "LOCKED";
      },
      undefined,
      5.85
    );
    tl.to(cursor, { opacity: 0, duration: 0.3 }, 6.6);
    tl.call(
      () => {
        optB.classList.remove("chip-correct");
        confirm.classList.remove("confirm-active");
        node.classList.remove("pn-locked");
        status.textContent = "DEMO";
      },
      undefined,
      7.0
    );
    tl.set(cursor, { x: 20, y: 20 }, 7.05);
    return tl;
  });

  return (
    <div className="card-preview" ref={panelRef} aria-hidden>
      <div className="p3-verify">
        <div className="p3-node-strip">
          <div className="proto-node" data-p3-node>
            <div className="pn-icon">
              <i className="fas fa-magnifying-glass" />
            </div>
            <div className="pn-name">SAMPLE</div>
            <div className="pn-status" data-p3-node-status>
              DEMO
            </div>
          </div>
        </div>
        <div className="p3-verify-body">
          <div className="p3-lead-label">SAMPLE — HOW IT WORKS</div>
          <div className="p3-question">Which field in the Inspector settles an ownership dispute?</div>
          <div className="p3-chips">
            <div className="p3-chip" data-p3-opt-a>
              The folder it&apos;s stored in
            </div>
            <div className="p3-chip" data-p3-opt-b>
              The evidence (steward · lineage · class)
            </div>
            <div className="p3-chip">Whoever uses it most</div>
          </div>
        </div>
        <div className="p3-foot">
          <button className="p3-confirm" data-p3-confirm type="button">
            EXTRACT TOKEN
          </button>
        </div>
      </div>
      <ProtoCursor idPrefix="p3" />
    </div>
  );
}
