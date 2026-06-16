export type M5TutorialStep = {
  selector: string | null;
  pad: number;
  phase: "tour" | "demo";
  title: string;
  html: string;
  demo?: boolean;
};

export const M5_TUTORIAL_STEPS: M5TutorialStep[] = [
  {
    selector: "#phase-framing",
    pad: 8,
    phase: "tour",
    title: "Frame each card with ECHO",
    html:
      "<p>Four evidence cards from Ops 1–4. For each one, pick a <strong>framing type</strong> (risk / opportunity / neutral) and a <strong>visualisation</strong>.</p>" +
      "<p>Read the <strong>ECHO</strong> line under the card — it tells you what each crew member needs to hear.</p>",
  },
  {
    selector: "#echo-1",
    pad: 6,
    phase: "tour",
    title: "ECHO feedback is your hint",
    html:
      "<p>After each choice, ECHO reacts in one line — that wording is your hint for framing and visualisation.</p>" +
      "<p>Read it before you lock all four cards.</p>",
  },
  {
    selector: "#framing-confirm",
    pad: 14,
    phase: "tour",
    title: "Enter the briefing room",
    html:
      "<p>When all four cards have framing + visualisation, press <strong>ENTER THE BRIEFING ROOM</strong> (bottom of the dossier panel) to present to the crew.</p>",
  },
  {
    selector: "#crew-zex",
    pad: 10,
    phase: "tour",
    title: "Crew challenges",
    html:
      "<p>Each specialist asks one multiple-choice question. Pick an answer, then <strong>SUBMIT</strong>.</p>" +
      "<p>One retry per person costs +10% detection. You need <strong>3 of 4 commits</strong> to ship.</p>",
  },
  {
    selector: "#vote-overlay",
    pad: 12,
    phase: "tour",
    title: "Win condition — 3 of 4",
    html:
      "<p>After all four crew challenges, specialists vote. <strong>Three commits</strong> ships the operation — you do not need all four.</p>" +
      "<p>VOSS closes the session; the debrief shows who stayed sceptical.</p>",
  },
  {
    selector: null,
    pad: 0,
    phase: "demo",
    demo: true,
    title: "Watch it once",
    html:
      "<p>Watch: pick framing + viz on card 1 → read ECHO → answer <strong>ZEX</strong>'s challenge.</p>" +
      "<p><strong>Skip demo</strong> jumps ahead. <strong>Start mission</strong> opens the full briefing.</p>",
  },
];
