export type M1TutorialDemoApi = {
  applyBaseline: () => void;
  selectLead: (id: "compute" | "funding" | "personnel") => void;
  openWindow: (id: string) => void;
  setActiveTab: (winId: string, tabIdx: number) => void;
  showAnomaly: () => void;
  triggerVerify: () => void;
  setStepBanner: (text: string) => void;
  getDetection: () => number;
  setDetection: (value: number) => void;
};

export async function runM1TutorialDemo(
  root: HTMLElement,
  api: M1TutorialDemoApi,
  callbacks: { onComplete: () => void }
): Promise<() => void> {
  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    callbacks.onComplete();
    return () => {};
  }

  const gsap = (await import("gsap")).default;
  api.applyBaseline();

  const lead = root.querySelector<HTMLElement>('.lead[data-lead="compute"]');
  if (!lead) {
    callbacks.onComplete();
    return () => {};
  }

  const curEl = ensureCursor();

  gsap.set(curEl, { opacity: 0, x: window.innerWidth * 0.7, y: window.innerHeight * 0.3 });

  const tl = gsap.timeline({
    paused: true,
    defaults: { ease: "power2.out" },
    onComplete: callbacks.onComplete,
  });

  tl.call(() => api.setStepBanner("Watch: Select a lead to begin investigation"), undefined, 0);
  tl.to(curEl, { opacity: 1, duration: 0.35 }, 0.2);
  
  tl.to(curEl, {
    x: () => {
      const rect = lead.getBoundingClientRect();
      return rect.left + rect.width / 2;
    },
    y: () => {
      const rect = lead.getBoundingClientRect();
      return rect.top + rect.height / 2;
    },
    duration: 1.0,
    ease: "power2.inOut",
  }, 0.4);

  tl.call(() => {
    api.selectLead("compute");
    api.setStepBanner("Compute lead selected — now open the highlighted folder");
  }, undefined, 1.5);

  tl.call(() => {
    api.openWindow("win-server");
    api.setActiveTab("win-server", 1);
    api.setStepBanner("Server Load chart open — look for the anomaly spike");
  }, undefined, 2.5);

  tl.to(curEl, { opacity: 0, duration: 0.3 }, 3.5);

  tl.call(() => {
    api.setStepBanner("Demo complete — now you try it in the tutorial");
  }, undefined, 4.0);

  tl.play(0);

  return () => {
    tl.kill();
    removeCursor(gsap);
  };
}

function ensureCursor(): HTMLElement {
  let cur = document.getElementById("m1-tut-demo-cursor");
  if (!cur) {
    cur = document.createElement("div");
    cur.id = "m1-tut-demo-cursor";
    cur.className = "m1-tut-demo-cursor";
    cur.innerHTML = '<span class="m1-tut-demo-cursor__ico"><i class="fas fa-mouse-pointer"></i></span>';
    document.body.appendChild(cur);
  } else if (cur.parentElement !== document.body) {
    document.body.appendChild(cur);
  }
  cur.style.display = "block";
  cur.style.zIndex = "2147483646";
  return cur;
}

function removeCursor(gsap: typeof import("gsap").default) {
  const cur = document.getElementById("m1-tut-demo-cursor");
  if (cur) {
    gsap.killTweensOf(cur);
    cur.remove();
  }
}
