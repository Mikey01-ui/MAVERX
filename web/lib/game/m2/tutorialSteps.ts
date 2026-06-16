/**
 * M2 tutorial step copy — derived from reference/legacy-missions/Mission 2.html
 * (protocol cards prev-01–03 and page-3 objectives). Not tied to M2Game backend.
 */
export type TutorialPad =
  | number
  | {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };

export type M2TutorialInteraction =
  | "click-registry-row"
  | "click-tribunal-ruling"
  | "click-verify-complete";

export type M2TutorialStep = {
  selector: string | null;
  pad: TutorialPad;
  phase: "tour" | "demo";
  title: string;
  html: string;
  demo?: boolean;
  interaction?: M2TutorialInteraction;
};

export const M2_TUTORIAL_STEPS: M2TutorialStep[] = [
  {
    selector: "#eboard",
    pad: 10,
    phase: "tour",
    title: "Four disputes. One key.",
    html: "<p>Extract <strong>four department tokens</strong> — Finance, IT, Operations, and Compliance — from Marshall's governance disputes.</p><p>Each token unlocks after a <strong>correct ruling</strong> and passing <strong>two verification questions</strong>. When the Key Forge is full, hit <strong>COMPILE MASTER KEY</strong>.</p>",
  },
  {
    selector: "#win-tribunal",
    pad: 8,
    phase: "tour",
    title: "Read the dispute",
    html: "<p>Open the <strong>Governance Tribunal</strong>. Two departments claim the same dataset.</p><p>Read <strong>both arguments</strong> before you rule — the evidence file is named in the case header.</p>",
  },
  {
    selector: "#desktop-panel",
    pad: 10,
    phase: "tour",
    title: "Inspect the evidence",
    html: "<p>Double-click the disputed file in the <strong>Data Registry</strong>. The <strong>File Inspector</strong> shows the Data Steward, lineage chain, and classification.</p><p>Usually the steward settles it — but check it's <strong>verified</strong> first.</p>",
  },
  {
    selector: "#verify-panel",
    pad: 8,
    phase: "tour",
    title: "Rule & verify",
    html: "<p>Pick the correct owner in the Tribunal. Then answer <strong>two evidence questions</strong> in the verify panel — all answers are in the Inspector.</p><p>Correct answers extract the token.</p>",
  },
  {
    selector: "#m2-tut-forge-footer",
    pad: 10,
    phase: "tour",
    title: "Compile the Master Key",
    html: "<p>Repeat for all <strong>four disputes</strong>. Each verified dispute fills one segment on the Key Forge.</p><p>When all four tokens are extracted, <strong>COMPILE MASTER KEY</strong> unlocks vault access.</p>",
  },
  {
    selector: "#m2-tut-reg-row",
    pad: 4,
    phase: "demo",
    demo: true,
    interaction: "click-registry-row",
    title: "Try it — inspect the file",
    html: "<p>Click the highlighted row in the <strong>Data Registry</strong>.</p><p>The File Inspector will populate with demo metadata — the real mission uses different dispute files.</p>",
  },
  {
    selector: null,
    pad: 0,
    phase: "demo",
    demo: true,
    interaction: "click-tribunal-ruling",
    title: "Rule on ownership",
    html: "<p>Read both claimants in the Tribunal, then <strong>rule for the correct owner</strong>.</p><p>Use the Inspector: the <strong>Data Steward ★</strong> field points to Finance in this demo.</p>",
  },
  {
    selector: null,
    pad: 0,
    phase: "demo",
    demo: true,
    interaction: "click-verify-complete",
    title: "Verify with evidence",
    html: "<p>The verify panel is open. Select the correct chip for <strong>each question</strong>, then click <strong>▶ EXTRACT TOKEN</strong>.</p><p><em>Wrong answers let you retry — no penalty in the tutorial.</em></p>",
  },
  {
    selector: "#lead-finance",
    pad: 12,
    phase: "tour",
    title: "Token extracted",
    html: "<p>The <strong>Finance token</strong> is locked on the Key Forge. In the real mission you'll repeat this for IT, Operations, and Compliance.</p><p>Click <strong>Next</strong> when ready.</p>",
  },
  {
    selector: null,
    pad: 0,
    phase: "tour",
    title: "You're ready",
    html: "<p>Each dispute follows the same loop:</p><p><strong>Inspect → Rule → Verify → Token</strong> — four times, then <strong>Compile</strong>.</p><ul><li><strong>Marshall_Personal</strong> is a decoy — ignore it</li><li>Atlas guides you via the step banner</li><li>Wrong rulings and failed verifies raise detection — you already know the meter from M1</li></ul><p>Good luck, Mastermind.</p>",
  },
];
