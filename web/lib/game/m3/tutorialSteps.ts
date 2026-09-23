export type M3TutorialStep = {
  selector: string | null;
  pad: number;
  phase: "tour" | "demo";
  title: string;
  html: string;
  demo?: boolean;
};

export function getM3TutorialSteps(signoffMax: number): M3TutorialStep[] {
  return [
    {
      selector: ".r2-router",
      pad: 8,
      phase: "tour",
      title: "Staged files",
      html: "<p>After the vault opens, every leak lands here. <strong>Select a file</strong> to read harm and audience before you route.</p>",
    },
    {
      selector: ".r2-inspector",
      pad: 10,
      phase: "tour",
      title: "Inspector — read before you route",
      html: "<p>Open a file and <strong>read the inspector</strong> — harm profile and audience come first. Only then pick a release channel.</p>",
    },
    {
      selector: "#ch-bar",
      pad: 8,
      phase: "tour",
      title: "Three release channels",
      html: "<p><strong>Public wall</strong> = press-safe proof. <strong>Official filing</strong> = regulators/counsel. <strong>No release</strong> = stays sealed when harm outweighs headlines.</p>",
    },
    {
      selector: "#dist-panel",
      pad: 8,
      phase: "tour",
      title: "Distribution map & Nova",
      html: `<p>Routed files appear in the map. Wrong exposure raises <strong>detection</strong>. Nova signs only if detection stays ≤${signoffMax}% with no catastrophic public-wall dumps — at 100% the mirror drops. A withheld sign-off still lets you continue; it means the ethics map was not clean.</p>`,
    },
    {
      selector: null,
      pad: 0,
      phase: "demo",
      demo: true,
      title: "Watch it once",
      html: "<p>Full-screen walkthrough on the <strong>routing UI</strong> with <strong>redacted sample files</strong> — inspect, then choose channel.</p><p><strong>Skip demo</strong> jumps ahead. <strong>Start mission</strong> opens Marshall's desktop breach.</p>",
    },
  ];
}

/** Standard ceiling — prefer getM3TutorialSteps(signoffMax) in live UI. */
export const M3_TUTORIAL_STEPS = getM3TutorialSteps(55);
