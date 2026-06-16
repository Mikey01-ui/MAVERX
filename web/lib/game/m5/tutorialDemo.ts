import { ECHO_FRAME, ECHO_VIZ } from "@/lib/game/m5/data";
import type { CrewId, FrameKey } from "@/lib/game/m5/types";

export type M5TutorialDemoApi = {
  applyBaseline: () => void;
  selectFrame: (cardId: number, frame: FrameKey) => void;
  selectViz: (cardId: number, viz: string) => void;
  fillRemainingCardsCorrect: () => void;
  confirmFraming: () => void;
  selectCrewOpt: (crewId: CrewId, idx: number) => void;
  submitCrewAnswer: (crewId: CrewId, idx?: number) => void;
  setBanner: (text: string) => void;
};

/** Scale demo timings — lower = snappier walkthrough */
const PACE = 0.62;

const d = (seconds: number) => seconds * PACE;

function xy(el: Element | null, fx = 0.5, fy = 0.45) {
  if (!el) return { x: window.innerWidth * 0.35, y: 120 };
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width * fx, y: r.top + r.height * fy };
}

function ensureCursor(): HTMLElement {
  let cur = document.getElementById("m5-tut-demo-cursor");
  if (!cur) {
    cur = document.createElement("div");
    cur.id = "m5-tut-demo-cursor";
    cur.className = "m5-tut-demo-cursor";
    cur.innerHTML = '<span class="m5-tut-demo-cursor__ico"><i class="fas fa-mouse-pointer"></i></span>';
    document.body.appendChild(cur);
  } else if (cur.parentElement !== document.body) {
    document.body.appendChild(cur);
  }
  cur.style.display = "block";
  cur.style.zIndex = "2147483646";
  return cur;
}

function removeCursor(gsap: typeof import("gsap").default) {
  const cur = document.getElementById("m5-tut-demo-cursor");
  if (cur) {
    gsap.killTweensOf(cur);
    cur.remove();
  }
}

export function skipM5TutorialDemo(_root: HTMLElement, api: M5TutorialDemoApi) {
  api.applyBaseline();
  api.selectFrame(1, "opportunity");
  api.selectViz(1, "node");
  api.fillRemainingCardsCorrect();
  api.confirmFraming();
  api.selectCrewOpt("zex", 0);
  api.submitCrewAnswer("zex", 0);
}

export async function runM5TutorialDemo(
  root: HTMLElement,
  api: M5TutorialDemoApi,
  callbacks: { onComplete: () => void }
): Promise<() => void> {
  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    skipM5TutorialDemo(root, api);
    callbacks.onComplete();
    return () => {};
  }

  const gsap = (await import("gsap")).default;
  api.applyBaseline();

  const oppBtn = root.querySelector<HTMLElement>('#frame-btns-1 .choice-btn[data-key="opportunity"]');
  const nodeBtn = root.querySelector<HTMLElement>('#viz-btns-1 .choice-btn[data-viz="node"]');
  const zexOpt = root.querySelector<HTMLElement>('#opts-zex .crew-opt[data-idx="0"]');

  const curEl = ensureCursor();
  gsap.set(curEl, { opacity: 0, x: window.innerWidth * 0.35, y: 120 });

  let killed = false;
  const tl = gsap.timeline({
    defaults: { ease: "power2.out" },
    onComplete: () => {
      if (!killed) callbacks.onComplete();
    },
  });

  tl.to(curEl, { opacity: 1, duration: d(0.3) });
  tl.to(curEl, {
    x: () => xy(oppBtn).x,
    y: () => xy(oppBtn).y,
    duration: d(0.7),
    ease: "power2.inOut",
  });
  tl.call(() => api.selectFrame(1, "opportunity"));
  tl.to({}, { duration: d(0.5) });
  tl.to(curEl, {
    x: () => xy(nodeBtn).x,
    y: () => xy(nodeBtn).y,
    duration: d(0.65),
    ease: "power2.inOut",
  });
  tl.call(() => api.selectViz(1, "node"));
  tl.to({}, { duration: d(0.6) });
  tl.call(() => {
    api.fillRemainingCardsCorrect();
    api.confirmFraming();
  });
  tl.to({}, { duration: d(0.8) });
  tl.to(curEl, {
    x: () => xy(zexOpt ?? root.querySelector("#crew-zex")).x,
    y: () => xy(zexOpt ?? root.querySelector("#crew-zex")).y,
    duration: d(0.75),
    ease: "power2.inOut",
  });
  tl.call(() => {
    api.selectCrewOpt("zex", 0);
    api.submitCrewAnswer("zex", 0);
  });
  tl.to({}, { duration: d(0.5) });
  tl.to(curEl, { opacity: 0, duration: d(0.35) });

  tl.play(0);

  return () => {
    killed = true;
    tl.kill();
    removeCursor(gsap);
  };
}
