import { FILES as M4_FILES, STEPS as M4_STEPS } from "@/lib/game/m4/data";
import {
  DATASETS as M3_DATASETS,
  DETECTION,
  SIGNOFF_DETECTION_MAX,
} from "@/lib/game/m3/data";
import { getDetectionClass } from "@/lib/game/m3/detectionMeter";
import { ECHO_FRAME, ECHO_VIZ, CREW_ORDER } from "@/lib/game/m5/data";
import type { M2GameState } from "@/lib/game/m2/types";
import type { Channel, M3GameState, M3WrongAttempt } from "@/lib/game/m3/types";
import type { M4GameState, M4WrongAttempt } from "@/lib/game/m4/types";
import type { M5GameState } from "@/lib/game/m5/types";
import type { DebriefLearningRow, DebriefRow, MissionDebriefConfig } from "@/components/missions/shared/MissionDebriefScreen";

function formatTimer(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

function trustClass(trust: number) {
  if (trust >= 70) return "det-green";
  if (trust >= 40) return "det-amber";
  return "det-red";
}

export function buildM2Debrief(state: M2GameState): MissionDebriefConfig {
  const acc = Math.max(0, Math.round(((8 - (state.wrongRulings + state.verifyErrors)) / 8) * 100));
  let score = state.score;
  if (state.wrongRulings === 0 && state.verifyErrors === 0) score += 300;
  if (state.hintsUsed === 0) score += 150;

  const feedback: string[] = [];
  if (state.wrongRulings === 0) {
    feedback.push("FLAWLESS RULINGS — All four ownership disputes resolved correctly on first attempt.");
  } else {
    feedback.push(`RULING ERRORS: ${state.wrongRulings} incorrect ruling(s). The deciding factor is the verified steward and lineage.`);
  }
  if (state.verifyErrors === 0) {
    feedback.push("PERFECT VERIFICATION — All evidence questions answered correctly.");
  } else {
    feedback.push(`VERIFICATION ERRORS: ${state.verifyErrors} incorrect answer(s). Every answer is in the Inspector metadata.`);
  }
  if (state.hintsUsed > 0) {
    feedback.push(`HINTS USED: ${state.hintsUsed}. Open the Inspector before requesting a hint.`);
  } else {
    feedback.push("NO HINTS — All decisions made directly from evidence.");
  }

  return {
    eyebrow: "// Mission 02 — Complete",
    title: "Master Key Compiled — Vault Access Granted",
    metrics: [
      { value: formatTimer(state.timerSec), label: "TIME" },
      { value: `${acc}%`, label: "ACCURACY" },
      { value: String(state.hintsUsed), label: "HINTS USED" },
      { value: String(score), label: "SCORE" },
    ],
    breakdownTitle: "TRIBUNAL SUMMARY",
    breakdownRows: [
      { label: "Wrong rulings", value: String(state.wrongRulings) },
      { label: "Verify errors", value: String(state.verifyErrors) },
      { label: "Hints used", value: String(state.hintsUsed) },
      { label: "Tokens forged", value: "4 / 4", total: true },
    ],
    rating: state.wrongRulings === 0 && state.verifyErrors === 0 ? "FLAWLESS — Governance map is clean." : "COMPLETE — Review errors before Mission 3.",
    tradecraft: [
      { html: feedback.map((f) => f).join("<br><br>") },
      { html: "<span class=\"tc-subhead\">Real-world translation</span> You ruled on four data ownership conflicts using stewardship records, lineage, and classification. Ownership follows the <strong>verified Data Steward</strong> — not origin, usage, or unverified fields." },
      { html: "<strong>1. Origin is not ownership.</strong> <strong>2. Usage is not ownership.</strong> <strong>3. A pipe is not an owner.</strong> <strong>4. Unverified fields can't settle disputes.</strong> <strong>5. Regulation overrides everything.</strong>" },
    ],
    cta: "CONTINUE TO MISSION 3 — THE HUMAN SHIELD →",
  };
}

function m3AccuracyClass(acc: number) {
  if (acc === 100) return "det-green";
  if (acc >= 80) return "det-amber";
  return "det-red";
}

function m3BreakdownRows(state: M3GameState, correctN: number, detection: number, detCls: string): DebriefRow[] {
  const rows: DebriefRow[] = [
    { label: "Time on mission", value: formatTimer(state.timerSec) },
    { label: "Correct assignments", value: `${correctN} / 10` },
    { label: "Wrong route attempts", value: String(state.wrongRoutes) },
    { label: "Hints used", value: String(state.hintsUsed) },
  ];
  if (state.hintsUsed > 0) {
    rows.push({ label: "Detection from hints", value: `+${state.hintsUsed * DETECTION.hint}%` });
  }
  if (state.catastrophic > 0) {
    rows.push({ label: "Public-wall breaches", value: String(state.catastrophic), valueClass: "det-red" });
  }
  rows.push({ label: "Final detection", value: `${detection}%`, valueClass: detCls, total: true });
  return rows;
}

const M3_AUDIENCE: Record<Channel, { picked: string; entitled: string }> = {
  public: {
    picked: "the press and general public",
    entitled: "The press and general public",
  },
  official: {
    picked: "regulators, counsel, or official bodies",
    entitled: "Regulators, counsel, or official bodies",
  },
  vault: {
    picked: "no one — you marked it no release",
    entitled: "No external audience",
  },
};

function m3MistakeExplanation(w: M3WrongAttempt): string {
  const wrong = M3_AUDIENCE[w.choice];
  const right = M3_AUDIENCE[w.correct];

  if (w.choice === "vault" && w.correct !== "vault") {
    return (
      `<strong>${w.file}</strong> — You withheld this entirely, but ` +
      `<strong>${right.picked}</strong> are entitled to it under proper process. ${w.reason}`
    );
  }

  if (w.correct === "vault") {
    return (
      `<strong>${w.file}</strong> — You sent this to <strong>${wrong.picked}</strong>. ` +
      `<strong>They are not supposed to access this data</strong> — the harm profile and identifiers in the file rule out that audience. ${w.reason}`
    );
  }

  return (
    `<strong>${w.file}</strong> — You routed this to <strong>${wrong.picked}</strong>. ` +
    `<strong>They are not supposed to have this</strong> — <strong>${right.entitled}</strong> should, based on what's in the file. ${w.reason}`
  );
}

function m3Tradecraft(state: M3GameState) {
  const blocks: { html: string }[] = [
    {
      html:
        '<span class="tc-subhead">What this mission trains</span>' +
        "This round is about deciding <strong>who is allowed to see each file</strong> — from what's inside it, not because you have access. " +
        "In the real world, <strong>the press</strong>, <strong>regulators</strong>, and <strong>people named in the data</strong> do not get the same access. " +
        "Read <strong>identifiers</strong> and <strong>harm if public</strong>, then release only to the audience that is entitled to it.",
    },
  ];

  const attempts = state.wrongAttemptLog ?? [];
  if (attempts.length > 0) {
    const mistakes = attempts.map((w) => `<p class="tc-mistake">${m3MistakeExplanation(w)}</p>`).join("");
    blocks.push({
      html:
        '<span class="tc-subhead">Where you misjudged access</span>' +
        '<p class="tc-mistake-intro">You had to decide who is allowed to see each file. These are the cases where the wrong audience would have received data they should not access:</p>' +
        mistakes,
    });
  } else {
    blocks.push({
      html:
        '<span class="tc-subhead">Your routing</span> ' +
        "You matched every file to the right audience on the first try — you read the content before deciding who gets access.",
    });
  }

  return blocks;
}

export function buildM3Debrief(state: M3GameState): MissionDebriefConfig {
  const correctN = M3_DATASETS.filter((d) => state.assigned[d.id] === d.correct).length;
  const acc = Math.round((correctN / 10) * 100);
  const accCls = m3AccuracyClass(acc);
  const detection = Math.round(state.detection);
  const detCls = getDetectionClass(detection);
  const detectionMaxed = detection >= 100 || state.phase === "failed";
  const success = !detectionMaxed && correctN === 10 && state.catastrophic === 0 && detection <= SIGNOFF_DETECTION_MAX;
  const breakdownRows = m3BreakdownRows(state, correctN, detection, detCls);

  if (detectionMaxed) {
    return {
      eyebrow: "// Mission 03 — Mirror compromised",
      title: "DETECTION THRESHOLD EXCEEDED",
      metrics: [
        { value: formatTimer(state.timerSec), label: "TIME" },
        { value: `${acc}%`, label: "ACCURACY", valueClass: accCls },
        { value: String(state.wrongRoutes), label: "WRONG ROUTES" },
        { value: "100%", label: "DETECTION", valueClass: "det-red" },
      ],
      breakdownTitle: "ROUTING SUMMARY",
      breakdownRows: breakdownRows.map((r) => (r.label === "Final detection" ? { ...r, value: "100%", valueClass: "det-red" } : r)),
      rating: "FEED DROPPED — MegaCorp closed the mirror before sign-off.",
      tradecraft: m3Tradecraft(state),
      cta: "RETRY MISSION →",
    };
  }

  if (!success) {
    return {
      eyebrow: "// Mission 03 — Sign-off denied",
      title: state.catastrophic > 0 ? "PUBLIC CHANNEL BREACH" : "ROUTING DETECTION TOO HIGH",
      metrics: [
        { value: formatTimer(state.timerSec), label: "TIME" },
        { value: `${acc}%`, label: "ACCURACY", valueClass: accCls },
        { value: String(state.hintsUsed), label: "HINTS USED" },
        { value: `${detection}%`, label: "DETECTION", valueClass: detCls },
      ],
      breakdownTitle: "ROUTING SUMMARY",
      breakdownRows,
      rating: state.catastrophic > 0 ? "ETHICS BREAK — Vault material surfaced on the wrong audience." : "MAP REJECTED — Distribution posture not defensible.",
      tradecraft: m3Tradecraft(state),
      cta: "REVIEW & CONTINUE TO MISSION 4 →",
    };
  }

  const rating =
    detection <= 15
      ? "SIGNED — Distribution map matches minimum necessary disclosure."
      : detection <= 35
        ? "SIGNED — Acceptable, with friction on the detection line."
        : "SIGNED — Borderline; review misroutes before release.";

  return {
    eyebrow: "// Mission 03 — Complete",
    title: "THE HUMAN SHIELD — SIGNED",
    metrics: [
      { value: formatTimer(state.timerSec), label: "TIME" },
      { value: `${acc}%`, label: "ACCURACY", valueClass: accCls },
      { value: String(state.hintsUsed), label: "HINTS USED" },
      { value: `${detection}%`, label: "DETECTION", valueClass: detCls },
    ],
    breakdownTitle: "ROUTING SUMMARY",
    breakdownRows,
    rating,
    tradecraft: m3Tradecraft(state),
    cta: "CONTINUE TO MISSION 4 — THE ONBOARDING →",
  };
}

function m4GateBreakdownRows(picks: Record<string, string>): DebriefRow[] {
  return M4_STEPS.map((step, i) => {
    const entry = Object.entries(picks).find(([, stepId]) => stepId === step.id);
    const file = entry ? M4_FILES.find((f) => f.id === entry[0]) : null;
    const matched = file?.id === step.okFile;
    const lane = step.lane.split("—")[0].trim();
    const gate = step.title.length > 26 ? `${step.title.slice(0, 24)}…` : step.title;
    const artifact = file ? (file.name.length > 28 ? `${file.name.slice(0, 26)}…` : file.name) : "—";
    return {
      label: `${i + 1} · ${gate} · ${lane}`,
      value: file ? `${artifact}${matched ? " ✓" : " ✕"}` : "Unlinked",
      valueClass: matched ? "det-green" : "det-red",
    };
  });
}

function m4MistakeExplanation(w: M4WrongAttempt): string {
  return (
    `<strong>${w.file}</strong> — You linked this to <strong>${w.wrongGateTitle}</strong>. ` +
    `<strong>That step is not supposed to consume this data</strong> — ` +
    `<strong>${w.correctGateTitle}</strong> is, based on the table headers in the file. ${w.reason}`
  );
}

function m4Tradecraft(state: M4GameState) {
  const blocks: { html: string }[] = [
    {
      html:
        '<span class="tc-subhead">What this mission trains</span>' +
        "Mission 03 was about <strong>who may receive data</strong>. This round is about <strong>which team needs each file to do its job</strong> — Legal reviewing the offer, IT verifying identity, HR running compliance, Payroll setting up tax, and so on. " +
        "In the real world, <strong>Security cannot trace a login without session logs</strong> and <strong>Payroll cannot run without tax rows</strong>. Match the file to the process step that actually consumes it.",
    },
  ];

  const attempts = state.wrongAttemptLog ?? [];
  if (attempts.length > 0) {
    const mistakes = attempts.map((w) => `<p class="tc-mistake">${m4MistakeExplanation(w)}</p>`).join("");
    blocks.push({
      html:
        '<span class="tc-subhead">Where you misjudged handoffs</span>' +
        '<p class="tc-mistake-intro">You had to place each leak on the gate whose team actually needs that data. These are the cases where the wrong department would have received it:</p>' +
        mistakes,
    });
  } else {
    blocks.push({
      html:
        '<span class="tc-subhead">Your handoffs</span> ' +
        "Every file landed on the right gate on the first try — you matched table headers to the team doing that job.",
    });
  }

  return blocks;
}

export function buildM4Debrief(state: M4GameState): MissionDebriefConfig {
  const correct = Object.entries(state.picks).filter(([fileId, stepId]) => M4_STEPS.find((s) => s.id === stepId)?.okFile === fileId).length;
  const detection = Math.round(state.detection);
  const detCls = getDetectionClass(detection);
  const wa = state.wrongAttempts;
  const detectionMaxed = detection >= 100 || state.phase === "failed";
  const solidBar = Math.max(1, Math.ceil(M4_FILES.length * 0.75));
  const tier = correct === M4_FILES.length ? "CLEAN STRUCTURE" : correct >= solidBar ? "SOLID" : "NEEDS REWORK";
  const gateRows = m4GateBreakdownRows(state.picks);

  if (detectionMaxed) {
    return {
      eyebrow: "// Mission 04 — Audit compromised",
      title: "DETECTION THRESHOLD EXCEEDED",
      metrics: [
        { value: formatTimer(state.timerSec), label: "TIME" },
        { value: `${correct}/${M4_FILES.length}`, label: "HANDOFFS CORRECT" },
        { value: String(wa), label: "WRONG DROPS" },
        { value: "100%", label: "DETECTION", valueClass: "det-red" },
      ],
      breakdownTitle: "HANDOFF MAP — ARTIFACT TO GATE",
      breakdownRows: [
        ...gateRows,
        { label: "Wrong drop attempts", value: String(wa) },
        { label: "Final detection", value: "100%", valueClass: "det-red", total: true },
      ],
      rating: "EXPOSED — MegaCorp flagged the handoff audit before you could finalize the map.",
      tradecraft: m4Tradecraft(state),
      cta: "RETRY MISSION →",
    };
  }

  const rating =
    correct === M4_FILES.length && wa === 0 && detection < 15
      ? "SPINE COMPLETE — Every handoff matches the published case-flow."
      : correct === M4_FILES.length
        ? "SPINE COMPLETE — Map holds; review detection hits before release."
        : correct >= solidBar
          ? "USABLE — Adjust the red nodes before you brief externally."
          : "REWORK — Too many mis-links for a credible narrative.";

  return {
    eyebrow: "// Mission 04 — Map finalized",
    title: `THE ONBOARDING — ${tier}`,
    metrics: [
      { value: formatTimer(state.timerSec), label: "TIME" },
      { value: `${correct}/${M4_FILES.length}`, label: "HANDOFFS CORRECT" },
      { value: `${detection}%`, label: "DETECTION", valueClass: detCls },
      { value: String(wa), label: "WRONG DROPS" },
      { value: String(state.hintsUsed), label: "HINTS USED" },
    ],
    breakdownTitle: "HANDOFF MAP — ARTIFACT TO GATE",
    breakdownRows: [
      ...gateRows,
      { label: "Handoffs correct", value: `${correct} / ${M4_FILES.length}`, valueClass: correct === M4_FILES.length ? "det-green" : "det-amber" },
      { label: "Wrong drop attempts", value: String(wa) },
      { label: "Hints used", value: String(state.hintsUsed) },
      { label: "Final detection", value: `${detection}%`, valueClass: detCls },
      { label: "Outcome band", value: tier, total: true },
    ],
    rating,
    tradecraft: m4Tradecraft(state),
    cta: "CONTINUE TO MISSION 05 — THE FINAL BRIEF →",
  };
}

export function buildM5Debrief(state: M5GameState): MissionDebriefConfig {
  const ships = state.ships ?? state.commits >= 3;
  let wrongF = 0;
  let wrongV = 0;
  for (let i = 1; i <= 4; i++) {
    const c = state.frameChoices[i];
    if (c?.frame && c.frame !== ECHO_FRAME[i].correct) wrongF++;
    if (c?.viz && c.viz !== ECHO_VIZ[i].correct) wrongV++;
  }
  const det = Math.round(state.detection);
  const detCls = det < 35 ? "det-green" : det < 70 ? "det-amber" : "det-red";

  const LEARNING: Record<string, { who: string; text: string }> = {
    zex: { who: "ZEX · Data Analysis", text: "A node map proves things are <strong>connected</strong> — not that they are switched on." },
    atlas: { who: "ATLAS · Governance", text: "Governance follows <strong>verified, formal accountability</strong> — not the creator or heaviest user." },
    nova: { who: "NOVA · Ethics", text: "When the <strong>purpose of collection is harmful</strong>, a dataset must be dropped — not just anonymised." },
    kade: { who: "KADE · Data Flows", text: "A bottleneck is a <strong>convergence point</strong> — if it fails, everything downstream stalls." },
  };

  return {
    eyebrow: ships ? "// Mission 5 — Operation Shipped" : "// Mission 5 — Operation Aborted",
    title: ships ? "OMNI Exposed · Debrief" : "Operation Aborted · Debrief",
    metrics: [
      { value: formatTimer(state.timerSec), label: "TIME" },
      { value: `${state.commits}/4`, label: "COMMITS" },
      { value: String(state.score), label: "SCORE" },
      { value: `${det}%`, label: "DETECTION", valueClass: detCls },
    ],
    breakdownTitle: "PERFORMANCE BREAKDOWN",
    breakdownRows: [
      { label: "Framing accuracy", value: wrongF === 0 ? "PERFECT" : `${wrongF} wrong`, valueClass: wrongF === 0 ? "det-green" : "det-red" },
      { label: "Visualisation accuracy", value: wrongV === 0 ? "PERFECT" : `${wrongV} wrong`, valueClass: wrongV === 0 ? "det-green" : "det-red" },
      ...CREW_ORDER.map((c) => ({
        label: LEARNING[c].who.split(" · ")[0],
        value: state.crewState[c].status === "committed" ? "COMMITTED" : "SCEPTICAL",
        valueClass: state.crewState[c].status === "committed" ? "det-green" : "det-red",
      })),
      { label: "Crew commits", value: `${state.commits} / 4`, valueClass: detCls, total: true },
    ],
    rating: ships ? "Operation shipped. The room committed. That is the only metric that matters." : "Operation aborted. Review which framing and crew answers cost you the vote.",
    tradecraft: [
      { html: ships ? "Four operations. Four objections answered. The crew committed and the hack ships." : "The dossier was real — the room did not commit. Review framing and crew challenges." },
    ],
    learningRows: CREW_ORDER.map((c) => ({
      who: LEARNING[c].who,
      text: LEARNING[c].text,
      ok: state.crewState[c].status === "committed",
    })),
    cta: "OPERATION COMPLETE — RETURN TO HUB →",
  };
}
