import type { ProgressRecord } from "@/lib/progress";
import type { OperationReportMission } from "@/lib/finale/reportData";
import { normalizeMissionScore } from "@/lib/game/operationScore";

export type MissionReportSection = {
  missionId: string;
  label: string;
  name: string;
  score: number | null;
  status: string;
  teaches: string;
  skills: string[];
  strengths: string[];
  improvements: string[];
  mistakes: string[];
  workplace: string[];
};

type MissionTemplate = Omit<MissionReportSection, "score" | "status" | "strengths" | "improvements" | "mistakes">;

const TEMPLATES: Record<string, MissionTemplate> = {
  m1: {
    missionId: "m1",
    label: "Mission 01",
    name: "Identifying the Footprint",
    teaches:
      "This mission is about not taking a dashboard at face value. You looked at ordinary business data and asked: what changed, what does not fit, and do the odd pieces point to the same story?",
    skills: [
      "Read the boring-looking numbers before deciding nothing is happening.",
      "Ignore random noise and keep the clues that point in the same direction.",
      "Turn separate findings into one explanation someone else can follow.",
    ],
    workplace: [
      "A manager says, 'The monthly report looks fine.' You still check the one month where costs jump, logins spike, or headcount moves strangely. The skill is knowing that the interesting part of a report is often the line nobody mentions.",
      "A budget has a vague line like 'special project' or 'unallocated spend.' Instead of accepting it, you ask who owns it, who approved it, and what other data confirms it. That is exactly what you did when one finance clue was not enough on its own.",
      "HR shows overtime rising in one team while access logs show unusual activity from the same area. On their own, each fact can be explained away. Together, they become a pattern worth escalating.",
      "When someone asks, 'Can you prove this?' you do not send one screenshot. You send a short chain: metric changed, funding changed, people changed, access changed. That is how analysis becomes evidence.",
    ],
  },
  m2: {
    missionId: "m2",
    label: "Mission 02",
    name: "Forging the Master Key",
    teaches:
      "This mission is about deciding who is responsible for data when everyone has an opinion. You learned to rely on verified ownership, not whoever shouts loudest or uses the file most often.",
    skills: [
      "Separate 'who made it' from 'who is accountable for it now.'",
      "Do not treat frequent use as ownership.",
      "Use the official steward, lineage, and classification before granting authority.",
    ],
    workplace: [
      "Sales says they own a customer file because they use it every day. Finance says they own it because it affects billing. Before approving anything, you check the data catalogue or steward record. The person accountable on paper matters more than the loudest team.",
      "A spreadsheet was created by an intern in Operations, but it now contains payroll data. You do not leave ownership with Operations just because they made the first version. The responsible owner is the team accountable for the data inside it.",
      "Someone requests access right before an audit and says, 'I just need it quickly.' Mission 2 is the habit of slowing down: check classification, steward, and lineage first so the access decision can be defended later.",
      "If a regulator asks, 'Who approved this dataset being used?' a vague answer is dangerous. A clear answer names the steward, the rule used, and the evidence behind the decision.",
    ],
  },
  m3: {
    missionId: "m3",
    label: "Mission 03",
    name: "The Human Shield",
    teaches:
      "This mission is about deciding who should see information. Not every true file should be public, and not every sensitive file should disappear. You learned to match the audience to the risk.",
    skills: [
      "Read the file before choosing the audience.",
      "Spot personal or harmful details before sharing.",
      "Know when to publish, when to send to officials, and when to hold back.",
    ],
    workplace: [
      "A comms team wants to publish a report about an incident. You can share totals, timelines, and lessons learned, but not a spreadsheet with employee names or customer IDs. The skill is knowing what can be public without exposing people.",
      "Legal asks for the evidence pack for a regulator. That pack can include sensitive detail because it goes through an official process. The same pack should not be forwarded to a general mailing list or uploaded to a public page.",
      "A colleague says, 'Just send me the raw file, I need it for a slide.' You check whether the slide needs raw data or just a summary. Most business questions need the answer, not the entire sensitive dataset.",
      "Redaction becomes easier when you think in audiences: customers get the clean summary, regulators get the controlled evidence, and internal-only files stay locked. That is the same public / official / vault choice from the mission.",
    ],
  },
  m4: {
    missionId: "m4",
    label: "Mission 04",
    name: "The Onboarding",
    teaches:
      "This mission is about how work really moves through a company. You learned to ask which team needs which file, at which step, and what breaks when the wrong team receives it.",
    skills: [
      "Match a document to the team that actually uses it.",
      "Use column names and file contents to understand the business process.",
      "See how one bad handoff can slow down the whole workflow.",
    ],
    workplace: [
      "A customer onboarding case is stuck for three days. Instead of asking 'Who is delaying this?' you ask, 'Which file is missing, and which team needs it next?' That turns blame into a fixable workflow problem.",
      "Payroll cannot process someone without tax details. Security cannot create access without identity proof. Legal cannot approve without the contract. Mission 4 teaches you to connect the file to the team that can actually act on it.",
      "After a leak, leadership asks, 'What was this file used for?' A useful answer is not 'it was in SharePoint.' A useful answer is 'this file fed the Payroll tax setup step and should only have been seen by Payroll.'",
      "When improving a messy process, write down the handoff: input, owner, output. If one team receives the wrong input, the next team waits. That is how small data mistakes become missed deadlines.",
    ],
  },
  m5: {
    missionId: "m5",
    label: "Mission 05",
    name: "The Final Brief",
    teaches:
      "This mission is about explaining evidence well enough that people are willing to act. The hard part is not having data; it is answering the doubts of people who can block the decision.",
    skills: [
      "Choose the chart that answers the question, not the chart that looks impressive.",
      "Adapt the explanation to the person in front of you.",
      "Earn commitment by being clear about evidence, limits, and risk.",
    ],
    workplace: [
      "You are asking leadership to fund a data project. A vague pitch says, 'This will transform the business.' A useful pitch says, 'Here is the problem, here is the evidence, here is the risk, and here is what each team must approve.'",
      "A chart can make weak evidence look confident. Mission 5 teaches the opposite: use the visual that honestly supports the claim. If the chart only proves connection, do not pretend it proves causation.",
      "Security, Legal, Product, and Finance may all care about the same decision for different reasons. A strong brief answers each group in their language instead of giving everyone the same generic slide.",
      "When someone senior asks, 'What could go wrong?' the best answer is not defensive. It names the risk, shows what evidence reduces it, and explains what still needs monitoring after launch.",
    ],
  },
};

const M3_AUDIENCE: Record<string, { picked: string; entitled: string }> = {
  public: { picked: "the press and general public", entitled: "The press and general public" },
  official: { picked: "regulators, counsel, or official bodies", entitled: "Regulators, counsel, or official bodies" },
  vault: { picked: "no one — you marked it no release", entitled: "No external audience" },
};

function num(state: Record<string, unknown>, key: string): number {
  const v = state[key];
  return typeof v === "number" ? v : 0;
}

function m3MistakeText(w: {
  file: string;
  choice: string;
  correct: string;
  reason: string;
}): string {
  const wrong = M3_AUDIENCE[w.choice] ?? { picked: w.choice, entitled: w.choice };
  const right = M3_AUDIENCE[w.correct] ?? { picked: w.correct, entitled: w.correct };

  if (w.choice === "vault" && w.correct !== "vault") {
    return `${w.file}: You withheld this entirely, but ${right.picked} are entitled under proper process. ${w.reason}`;
  }
  if (w.correct === "vault") {
    return `${w.file}: You sent this to ${wrong.picked}. They are not supposed to access this data — ${w.reason}`;
  }
  return `${w.file}: You routed to ${wrong.picked}; ${right.entitled} should receive it. ${w.reason}`;
}

function m4MistakeText(w: {
  file: string;
  wrongGateTitle: string;
  correctGateTitle: string;
  reason: string;
}): string {
  return `${w.file}: Linked to ${w.wrongGateTitle}, but ${w.correctGateTitle} is the step that consumes this data. ${w.reason}`;
}

function insightsM1(state: Record<string, unknown> | null): Pick<MissionReportSection, "strengths" | "improvements" | "mistakes"> {
  const errors = state ? num(state, "errors") : 0;
  const hints = state ? num(state, "hintsUsed") : 0;
  const detection = state ? num(state, "detection") : 0;
  const strengths: string[] = [];
  const improvements: string[] = [];
  const mistakes: string[] = [];

  if (!state) {
    return {
      strengths: ["Mission completed — footprint dossier assembled across four leads."],
      improvements: [],
      mistakes: [],
    };
  }

  if (errors === 0) {
    strengths.push("Flawless verification — every evidence question answered correctly on first pass.");
  } else {
    mistakes.push(`${errors} verification or file interaction error(s) — answers live in the evidence metadata; re-open files before guessing.`);
    improvements.push("Slow down on verify chips: each answer is visible in the Inspector and source files.");
  }

  if (hints === 0) {
    strengths.push("No hints requested — conclusions drawn directly from the desktop evidence.");
  } else {
    improvements.push(`${hints} hint(s) used — practice tracing anomalies without channel support first.`);
  }

  if (detection <= 15) {
    strengths.push(`Low detection footprint (${detection}%) — you stayed quiet while the sweep ran.`);
  } else if (detection <= 35) {
    improvements.push(`Detection at ${detection}% — decoy files and wrong clicks raised the alert meter.`);
  } else {
    mistakes.push(`High detection (${detection}%) — hostile clicks and failed verifications nearly exposed the mirror.`);
  }

  if (strengths.length === 0) {
    strengths.push("All four leads confirmed — compute, funding, personnel, and payload bound into the dossier.");
  }

  return { strengths, improvements, mistakes };
}

function insightsM2(state: Record<string, unknown> | null): Pick<MissionReportSection, "strengths" | "improvements" | "mistakes"> {
  const wrongRulings = state ? num(state, "wrongRulings") : 0;
  const verifyErrors = state ? num(state, "verifyErrors") : 0;
  const hints = state ? num(state, "hintsUsed") : 0;
  const strengths: string[] = [];
  const improvements: string[] = [];
  const mistakes: string[] = [];

  if (!state) {
    return { strengths: ["Master Key compiled — four ownership disputes resolved."], improvements: [], mistakes: [] };
  }

  if (wrongRulings === 0) {
    strengths.push("Perfect tribunal rulings — every dispute resolved using verified stewards and lineage.");
  } else {
    mistakes.push(`${wrongRulings} incorrect ruling(s) — ownership follows the verified Data Steward, not origin or usage claims.`);
  }

  if (verifyErrors === 0) {
    strengths.push("Clean Inspector verification — all metadata questions matched the evidence.");
  } else {
    mistakes.push(`${verifyErrors} verification error(s) — re-read steward fields in the Inspector before submitting.`);
  }

  if (hints === 0) {
    strengths.push("No hints — governance calls made from primary sources.");
  } else {
    improvements.push(`${hints} hint(s) — open Registry + Inspector before requesting guidance.`);
  }

  return { strengths, improvements, mistakes };
}

function insightsM3(state: Record<string, unknown> | null): Pick<MissionReportSection, "strengths" | "improvements" | "mistakes"> {
  const wrongRoutes = state ? num(state, "wrongRoutes") : 0;
  const catastrophic = state ? num(state, "catastrophic") : 0;
  const hints = state ? num(state, "hintsUsed") : 0;
  const detection = state ? num(state, "detection") : 0;
  const strengths: string[] = [];
  const improvements: string[] = [];
  const mistakes: string[] = [];

  const log = state && Array.isArray(state.wrongAttemptLog) ? state.wrongAttemptLog : [];

  if (log.length > 0) {
    for (const entry of log) {
      if (entry && typeof entry === "object" && "file" in entry) {
        mistakes.push(m3MistakeText(entry as Parameters<typeof m3MistakeText>[0]));
      }
    }
  } else if (wrongRoutes > 0) {
    mistakes.push(`${wrongRoutes} mis-route(s) — read identifiers and harm columns before choosing public, official, or vault.`);
  }

  if (catastrophic > 0) {
    mistakes.push(`${catastrophic} public-channel breach(es) — vault-grade material must never surface on the public wall.`);
  }

  if (wrongRoutes === 0 && catastrophic === 0 && state) {
    strengths.push("Every file matched the correct audience on first attempt.");
  }

  if (detection <= 15 && state) {
    strengths.push(`Signed with low detection (${detection}%) — minimum necessary disclosure held.`);
  } else if (detection > 0 && state) {
    improvements.push(`Detection ended at ${detection}% — each wrong route adds to MegaCorp's alert meter.`);
  }

  if (hints === 0 && state) {
    strengths.push("Routing decisions made without hints.");
  } else if (hints > 0) {
    improvements.push(`${hints} hint(s) — classification and harm fields contain the answer.`);
  }

  if (!state) {
    strengths.push("Distribution map completed.");
  }

  return { strengths, improvements, mistakes };
}

function insightsM4(state: Record<string, unknown> | null): Pick<MissionReportSection, "strengths" | "improvements" | "mistakes"> {
  const wrongAttempts = state ? num(state, "wrongAttempts") : 0;
  const hints = state ? num(state, "hintsUsed") : 0;
  const detection = state ? num(state, "detection") : 0;
  const linked = state ? num(state, "linked") : 0;
  const strengths: string[] = [];
  const improvements: string[] = [];
  const mistakes: string[] = [];

  const log = state && Array.isArray(state.wrongAttemptLog) ? state.wrongAttemptLog : [];

  if (log.length > 0) {
    for (const entry of log) {
      if (entry && typeof entry === "object" && "file" in entry) {
        mistakes.push(m4MistakeText(entry as Parameters<typeof m4MistakeText>[0]));
      }
    }
  } else if (wrongAttempts > 0) {
    mistakes.push(`${wrongAttempts} wrong handoff(s) — match file column headers to the gate whose team consumes them.`);
  }

  if (wrongAttempts === 0 && state) {
    strengths.push("Clean handoff map — every artifact linked to the correct onboarding gate.");
  }

  if (linked >= 8 && state) {
    strengths.push(`${linked} files placed on the flow — onboarding spine documented end-to-end.`);
  }

  if (detection <= 15 && state) {
    strengths.push(`Audit finished at ${detection}% detection.`);
  } else if (detection > 0 && state) {
    improvements.push(`Detection ${detection}% — wrong drops increase exposure during the handoff audit.`);
  }

  if (hints > 0) {
    improvements.push(`${hints} hint(s) — read each gate's required inputs before linking files.`);
  }

  if (!state) {
    strengths.push("Onboarding flow mapped.");
  }

  return { strengths, improvements, mistakes };
}

function insightsM5(state: Record<string, unknown> | null): Pick<MissionReportSection, "strengths" | "improvements" | "mistakes"> {
  const commits = state ? num(state, "commits") : 0;
  const ships = state ? state.ships === true : commits >= 4;
  const detection = state ? num(state, "detection") : 0;
  const strengths: string[] = [];
  const improvements: string[] = [];
  const mistakes: string[] = [];

  if (ships) {
    strengths.push("Operation shipped — all four specialists committed after the final brief.");
  } else {
    mistakes.push("Operation aborted — the room did not commit; review framing and crew-specific answers.");
  }

  if (commits === 4) {
    strengths.push("Unanimous crew commitment — all four specialists signed on.");
  } else if (commits > 0) {
    improvements.push(`${commits}/4 commits — sceptical crew members needed stronger answers to their challenge.`);
  }

  const wrongFraming = state ? num(state, "wrongFraming") : 0;
  const wrongViz = state ? num(state, "wrongViz") : 0;
  if (wrongFraming > 0) {
    mistakes.push(`${wrongFraming} framing error(s) — ECHO frames must answer the objection, not exaggerate the story.`);
  }
  if (wrongViz > 0) {
    mistakes.push(`${wrongViz} visualisation error(s) — pick the chart that honestly supports the claim.`);
  }

  if (detection < 35 && state) {
    strengths.push(`Brief delivered at ${detection}% detection — room stayed focused, not alarmed.`);
  }

  if (!state) {
    strengths.push("Final brief delivered to the crew channel.");
  }

  return { strengths, improvements, mistakes };
}

const INSIGHT_BUILDERS: Record<
  string,
  (state: Record<string, unknown> | null) => Pick<MissionReportSection, "strengths" | "improvements" | "mistakes">
> = {
  m1: insightsM1,
  m2: insightsM2,
  m3: insightsM3,
  m4: insightsM4,
  m5: insightsM5,
};

export function buildMissionReportSections(
  missions: OperationReportMission[],
  progress: ProgressRecord[]
): MissionReportSection[] {
  const progressMap = new Map(progress.map((p) => [p.missionId, p]));

  return missions.map((m) => {
    const template = TEMPLATES[m.missionId];
    const row = progressMap.get(m.missionId);
    const state = (row?.stateJson as Record<string, unknown> | null) ?? null;
    const score = normalizeMissionScore(m.missionId, row?.score ?? m.score, state);
    const insights = INSIGHT_BUILDERS[m.missionId]?.(state) ?? {
      strengths: m.status === "completed" ? ["Mission completed."] : [],
      improvements: [],
      mistakes: [],
    };

    if (template) {
      return {
        ...template,
        score,
        status: m.status,
        ...insights,
      };
    }

    return {
      missionId: m.missionId,
      label: m.label,
      name: m.name,
      score,
      status: m.status,
      teaches: "",
      skills: [],
      workplace: [],
      ...insights,
    };
  });
}

export function buildSampleReportSections(): MissionReportSection[] {
  return buildMissionReportSections(
    [
      { missionId: "m1", label: "Mission 01", name: "Identifying the Footprint", score: 85, status: "completed" },
      { missionId: "m2", label: "Mission 02", name: "Forging the Master Key", score: 76, status: "completed" },
      { missionId: "m3", label: "Mission 03", name: "The Human Shield", score: 33, status: "completed" },
      { missionId: "m4", label: "Mission 04", name: "The Onboarding", score: 14, status: "completed" },
      { missionId: "m5", label: "Mission 05", name: "The Final Brief", score: 82, status: "completed" },
    ],
    [
      {
        missionId: "m1",
        status: "completed",
        checkpoint: "completed",
        score: 85,
        stateJson: { errors: 1, hintsUsed: 0, detection: 15 },
        updatedAt: new Date(),
      },
      {
        missionId: "m2",
        status: "completed",
        checkpoint: "completed",
        score: 76,
        stateJson: { wrongRulings: 1, verifyErrors: 0, hintsUsed: 1 },
        updatedAt: new Date(),
      },
      {
        missionId: "m3",
        status: "completed",
        checkpoint: "completed",
        score: 33,
        stateJson: {
          wrongRoutes: 4,
          catastrophic: 1,
          detection: 67,
          hintsUsed: 2,
          wrongAttemptLog: [
            {
              file: "employee_records_Q3.csv",
              choice: "public",
              correct: "vault",
              reason: "Contains direct employee identifiers — public release would cause harm.",
            },
          ],
        },
        updatedAt: new Date(),
      },
      {
        missionId: "m4",
        status: "completed",
        checkpoint: "completed",
        score: 14,
        stateJson: {
          wrongAttempts: 5,
          detection: 86,
          linked: 4,
          wrongAttemptLog: [
            {
              file: "payroll_tax_W4_batch.csv",
              wrongGateTitle: "Legal — Offer Review",
              correctGateTitle: "Payroll — Tax Setup",
              reason: "Tax ID columns are consumed by Payroll, not Legal.",
            },
          ],
        },
        updatedAt: new Date(),
      },
      {
        missionId: "m5",
        status: "completed",
        checkpoint: "completed",
        score: 82,
        stateJson: { commits: 3, ships: true, detection: 22, wrongFraming: 1, wrongViz: 0 },
        updatedAt: new Date(),
      },
    ]
  );
}
