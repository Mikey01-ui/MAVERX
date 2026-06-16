export type TutorialPad =
  | number
  | {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };

export type M1TutorialStep = {
  selector: string | null;
  pad: TutorialPad;
  phase: "tour" | "demo";
  title: string;
  html: string;
  demo?: boolean;
  interaction?: "click-lead" | "click-anomaly" | "click-verify";
};

export const M1_TUTORIAL_STEPS: M1TutorialStep[] = [
  {
    selector: "#det-cluster",
    pad: { top: 4, right: 8, bottom: -2, left: 6 },
    phase: "tour",
    title: "Detection meter — your fail condition",
    html: "<p>This meter tracks how close MegaCorp is to detecting your intrusion. <strong>At 100%, the operation fails</strong> and you lose the feed.</p><p>Detection rises when you open wrong files, fail verifications, or request hints. It also creeps up passively over time. <strong>This meter appears in every mission</strong> — keep it low.</p><p>Hover the <strong>ⓘ</strong> icon anytime for a reminder of what your current level means.</p>",
  },
  {
    selector: "#mission-chrome",
    pad: 8,
    phase: "tour",
    title: "Mission chrome",
    html: "<p>The header shows <strong>mission progress</strong>, the live <strong>timer</strong>, and your current detection state.</p><p>The <strong>LIVE</strong> indicator means the mirrored feed is active — you're inside Marshall's desktop in real time.</p>",
  },
  {
    selector: "#eboard",
    pad: 10,
    phase: "tour",
    title: "Evidence board — three leads to lock",
    html: "<p>Your objective: investigate three leads — <strong>Compute</strong>, <strong>Funding</strong>, and <strong>Personnel</strong>.</p><p>Click a lead to start investigating. Each lead points you to specific folders on the desktop. Find the anomaly hidden in the data, then <strong>verify it</strong> to lock the lead.</p>",
  },
  {
    selector: "#desktop-panel",
    pad: 8,
    phase: "tour",
    title: "Desktop — browse files carefully",
    html: "<p>This is Marshall's desktop. Double-click <strong>folder icons</strong> to open windows and browse files.</p><p>⚠️ <strong>Opening the wrong files raises detection.</strong> Stick to files relevant to your active lead — the evidence board hints at which folders to check.</p>",
  },
  {
    selector: "#voss-wrap",
    pad: 8,
    phase: "tour",
    title: "Mission Channel — your handlers",
    html: "<p><strong>Voss</strong> and <strong>Zex</strong> communicate with you here. They'll provide context, react to your progress, and guide you through the operation.</p><p>Watch for their messages — they often hint at what to look for next.</p>",
  },
  {
    selector: ".hint-wrap",
    pad: 12,
    phase: "tour",
    title: "Hint button — use sparingly",
    html: "<p>Stuck? Click the <strong>lightbulb</strong> to request a hint from your handlers.</p><p>⚠️ <strong>Each hint costs +8% detection.</strong> Use only when truly stuck — too many hints can fail the mission.</p><p>There's also a cooldown between hints.</p>",
  },
  {
    selector: null,
    pad: 0,
    phase: "demo",
    demo: true,
    interaction: "click-lead",
    title: "Try it — select a lead",
    html: "<p>Click on the <strong>Compute</strong> lead on the evidence board.</p><p>That selects your investigation target — a demo window will open on the desktop in the next step.</p>",
  },
  {
    selector: null,
    pad: 0,
    phase: "demo",
    demo: true,
    interaction: "click-anomaly",
    title: "Find the anomaly",
    html: "<p>The demo window is open on the desktop. Switch to <strong>Tab B (Anomaly)</strong> if needed.</p><p>Find the bar that stands out from the rest and <strong>click on it</strong> to flag the anomaly.</p><p><em>This is demo data — the real mission has different charts to explore.</em></p>",
  },
  {
    selector: null,
    pad: 0,
    phase: "demo",
    demo: true,
    interaction: "click-verify",
    title: "Verify your finding",
    html: "<p>The anomaly panel appeared. Now <strong>click the verify button</strong> to confirm your finding.</p><p>In the real mission, you'll explore actual files and select correct values from evidence before confirming.</p>",
  },
  {
    selector: null,
    pad: 0,
    phase: "tour",
    title: "You're ready",
    html: "<p>Lock all three leads to confirm OMNI's footprint. Remember:</p><ul><li><strong>Detection mistakes add up</strong> — work carefully</li><li><strong>Hints cost +8% detection</strong> — use sparingly</li><li><strong>Wrong verifications hurt more</strong> — read the data first</li></ul><p>Good luck, Mastermind.</p>",
  },
];
