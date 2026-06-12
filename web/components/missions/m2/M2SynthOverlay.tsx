"use client";

import { useEffect, useRef, useState } from "react";

const SVG_NS = "http://www.w3.org/2000/svg";

const NODES = [
  { lbl: "FINANCE", x: 90, y: 70 },
  { lbl: "IT", x: 390, y: 70 },
  { lbl: "OPERATIONS", x: 90, y: 270 },
  { lbl: "COMPLIANCE", x: 390, y: 270 },
];
const CX = 240;
const CY = 170;

/**
 * Master Key compile animation, ported 1:1 from round2_v14's startSynth():
 * four token nodes draw glowing lines into a centre circle, then the
 * MASTER KEY / COMPILED labels fade in and the done banner shows.
 */
export function M2SynthOverlay({ onDone }: { onDone: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [doneShown, setDoneShown] = useState(false);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let raf = 0;

    svg.innerHTML = `<defs><filter id="m2sg" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter></defs>`;

    const lines: SVGLineElement[] = [];
    NODES.forEach((n) => {
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", String(n.x));
      line.setAttribute("y1", String(n.y));
      line.setAttribute("x2", String(CX));
      line.setAttribute("y2", String(CY));
      line.setAttribute("stroke", "#00FF41");
      line.setAttribute("stroke-width", "2");
      line.setAttribute("filter", "url(#m2sg)");
      const len = Math.hypot(CX - n.x, CY - n.y);
      line.style.strokeDasharray = String(len);
      line.style.strokeDashoffset = String(len);
      svg.appendChild(line);
      lines.push(line);

      const c = document.createElementNS(SVG_NS, "circle");
      c.setAttribute("cx", String(n.x));
      c.setAttribute("cy", String(n.y));
      c.setAttribute("r", "32");
      c.setAttribute("fill", "none");
      c.setAttribute("stroke", "#00FF41");
      c.setAttribute("stroke-width", "1.5");
      c.setAttribute("filter", "url(#m2sg)");
      svg.appendChild(c);

      const t = document.createElementNS(SVG_NS, "text");
      t.setAttribute("x", String(n.x));
      t.setAttribute("y", String(n.y + 5));
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("fill", "#00FF41");
      t.setAttribute("font-size", "9");
      t.setAttribute("font-family", "Space Grotesk,sans-serif");
      t.textContent = n.lbl;
      svg.appendChild(t);
    });

    const oc = document.createElementNS(SVG_NS, "circle");
    oc.setAttribute("cx", String(CX));
    oc.setAttribute("cy", String(CY));
    oc.setAttribute("r", "0");
    oc.setAttribute("fill", "rgba(247,148,33,.10)");
    oc.setAttribute("stroke", "#f79421");
    oc.setAttribute("stroke-width", "2");
    oc.setAttribute("filter", "url(#m2sg)");
    svg.appendChild(oc);

    const ot1 = document.createElementNS(SVG_NS, "text");
    ot1.setAttribute("x", String(CX));
    ot1.setAttribute("y", String(CY - 4));
    ot1.setAttribute("text-anchor", "middle");
    ot1.setAttribute("fill", "#f79421");
    ot1.setAttribute("font-size", "16");
    ot1.setAttribute("font-family", "Space Grotesk,sans-serif");
    ot1.setAttribute("font-weight", "700");
    ot1.setAttribute("opacity", "0");
    ot1.textContent = "MASTER KEY";
    svg.appendChild(ot1);

    const ot2 = document.createElementNS(SVG_NS, "text");
    ot2.setAttribute("x", String(CX));
    ot2.setAttribute("y", String(CY + 16));
    ot2.setAttribute("text-anchor", "middle");
    ot2.setAttribute("fill", "#00FF41");
    ot2.setAttribute("font-size", "10");
    ot2.setAttribute("font-family", "Space Grotesk,sans-serif");
    ot2.setAttribute("opacity", "0");
    ot2.textContent = "COMPILED";
    svg.appendChild(ot2);

    lines.forEach((ln, i) =>
      timers.push(
        setTimeout(() => {
          ln.style.transition = "stroke-dashoffset 0.55s ease";
          ln.style.strokeDashoffset = "0";
        }, 420 + i * 380)
      )
    );

    timers.push(
      setTimeout(() => {
        let r = 0;
        const step = () => {
          r = Math.min(r + 2, 44);
          oc.setAttribute("r", String(r));
          if (r < 44) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        timers.push(
          setTimeout(() => {
            ot1.style.transition = "opacity 0.6s";
            ot1.setAttribute("opacity", "1");
            ot2.style.transition = "opacity 0.6s";
            ot2.setAttribute("opacity", "1");
          }, 600)
        );
      }, 420 + 4 * 380)
    );

    timers.push(setTimeout(() => setDoneShown(true), 420 + 4 * 380 + 1200));
    timers.push(setTimeout(onDone, 420 + 4 * 380 + 4000));

    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="synth-overlay" className="active">
      <svg ref={svgRef} id="synth-svg" viewBox="0 0 480 340" xmlns={SVG_NS} />
      <div className={`synth-done${doneShown ? " show" : ""}`} id="synth-done">
        ✓ MASTER KEY COMPILED — VAULT ACCESS GRANTED
      </div>
    </div>
  );
}
