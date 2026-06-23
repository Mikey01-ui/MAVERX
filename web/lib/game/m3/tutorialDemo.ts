import { m3TutDrillFileName, m3TutGetDocumentPreview } from "@/lib/game/m3/tutorialDrill";

export type M3TutorialDemoApi = {
  applyBaseline: () => void;
  selectDataset: (id: string, opts?: { silentBanner?: boolean }) => void;
  routeFile: (id: string, choice: "public" | "official" | "vault") => void;
  setBanner: (text: string) => void;
  getInspectorBodyEl: () => HTMLElement | null;
};

/** Scale demo timings — lower = snappier walkthrough */
const PACE = 0.62;

const d = (seconds: number) => seconds * PACE;

function viewportPos(el: Element, kind: "file" | "btn") {
  const er = el.getBoundingClientRect();
  if (kind === "btn") {
    return { x: er.left + er.width * 0.5, y: er.top + er.height * 0.42 };
  }
  return { x: er.left + 16, y: er.top + er.height * 0.5 };
}

function ensureCursor(): HTMLElement {
  let cur = document.getElementById("m3-tut-demo-cursor");
  if (!cur) {
    cur = document.createElement("div");
    cur.id = "m3-tut-demo-cursor";
    cur.className = "m3-tut-demo-cursor";
    cur.innerHTML = '<span class="m3-tut-demo-cursor__ico"><i class="fas fa-mouse-pointer"></i></span>';
    document.body.appendChild(cur);
  } else if (cur.parentElement !== document.body) {
    document.body.appendChild(cur);
  }
  cur.style.display = "block";
  cur.style.zIndex = "2147483646";
  return cur;
}

function removeCursor(gsap: typeof import("gsap").default) {
  const cur = document.getElementById("m3-tut-demo-cursor");
  if (cur) {
    gsap.killTweensOf(cur);
    cur.remove();
  }
}

function routeFileDemo(
  tl: import("gsap").gsap.core.Timeline,
  curEl: HTMLElement,
  btn: HTMLElement,
  choice: "public" | "official" | "vault",
  fileId: string,
  api: M3TutorialDemoApi
) {
  const cu = d(1.05);
  const afterH3 = d(0.18);

  tl.call(() => api.setBanner("3 — Choose PUBLIC WALL, OFFICIAL FILING, or NO RELEASE."));
  tl.to({}, { duration: afterH3 });
  tl.to(curEl, {
    x: () => viewportPos(btn, "btn").x,
    y: () => viewportPos(btn, "btn").y,
    duration: cu,
    ease: "power2.inOut",
  });
  tl.call(() => btn.classList.add("clicked"));
  tl.to({}, { duration: d(0.25) });
  tl.call(() => {
    btn.classList.remove("clicked");
    api.routeFile(fileId, choice);
  });
  tl.to(curEl, { opacity: 0, duration: d(0.28) });
}

export async function runM3TutorialDemo(
  root: HTMLElement,
  api: M3TutorialDemoApi,
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

  const file1 = root.querySelector<HTMLElement>('.r2-file[data-id="payroll"]');
  const file2 = root.querySelector<HTMLElement>('.r2-file[data-id="omni_exec"]');
  const ibody = api.getInspectorBodyEl();
  const chOff = root.querySelector<HTMLElement>("#ch-official");
  const chPub = root.querySelector<HTMLElement>("#ch-public");
  if (!file1 || !file2 || !ibody || !chOff || !chPub) {
    callbacks.onComplete();
    return () => {};
  }

  const curEl = ensureCursor();
  const H1 = "1 — Click a file to open the inspector.";
  const H2 = "2 — Read harm profile and audience — who gets hurt if this spreads?";
  const HGap = " ";
  const readHold = d(2.4);

  gsap.set(curEl, { opacity: 0, x: window.innerWidth * 0.35, y: 120 });

  const sceneTl = gsap.timeline({
    paused: true,
    defaults: { ease: "power2.out" },
    onComplete: callbacks.onComplete,
  });

  const openFile = (fileEl: HTMLElement, fileId: string) => {
    sceneTl.call(() => api.setBanner(H1));
    sceneTl.to({}, { duration: d(0.2) });
    sceneTl.to(curEl, { opacity: 1, duration: d(0.35) });
    sceneTl.to(
      curEl,
      {
        x: () => viewportPos(fileEl, "file").x,
        y: () => viewportPos(fileEl, "file").y,
        duration: d(1.0),
        ease: "power2.inOut",
      },
      `<${d(0.1)}`
    );
    sceneTl.call(() => {
      api.selectDataset(fileId, { silentBanner: true });
      api.setBanner(HGap);
    });
    sceneTl.to(ibody, { opacity: 0, duration: d(0.12) });
    sceneTl.call(() => {
      ibody.innerHTML = m3TutGetDocumentPreview(fileId);
    });
    sceneTl.to(ibody, { opacity: 1, duration: d(0.45) });
    sceneTl.call(() => api.setBanner(H2));
    sceneTl.to({}, { duration: readHold });
  };

  // --- File 1: payroll → official ---
  openFile(file1, "payroll");
  routeFileDemo(sceneTl, curEl, chOff, "official", "payroll", api);
  sceneTl.call(() => api.setBanner("Next file…"), undefined, `+=${d(0.12)}`);
  sceneTl.to(ibody, { opacity: 0, duration: d(0.22) });
  sceneTl.to({}, { duration: d(0.75) });

  // --- File 2: omni_exec → public ---
  openFile(file2, "omni_exec");
  routeFileDemo(sceneTl, curEl, chPub, "public", "omni_exec", api);
  sceneTl.call(
    () => api.setBanner("Demo complete — tap Start mission when ready."),
    undefined,
    `+=${d(0.12)}`
  );

  sceneTl.play(0);

  return () => {
    sceneTl.kill();
    removeCursor(gsap);
    gsap.killTweensOf(ibody);
    ibody.style.opacity = "1";
  };
}
