/**
 * Demo-only tutorial dispute — not used in real M2 gameplay.
 * UI/copy reference: reference/legacy-missions/Mission 2.html (not M2Game.tsx).
 */

export const TUT_CASE_ID = "TUT-GOV-0001";

export const TUT_DEMO_FILE = {
  key: "demo",
  name: "demo_governance.dat",
  claimedBy: "Finance / IT",
  records: 4200,
  source: "Enterprise Resource Planner (ERP)",
  steward: "Finance Dept — Corporate Accounting",
  lineage: ["ERP", "Finance Data Warehouse"],
  classification: "CONFIDENTIAL",
  cls: "badge-confidential",
  schema: ["record_id", "dept_code", "owner_id", "last_sync"],
  lastAccess: "15-Oct-2003 — fin_sync",
};

export const TUT_CLAIMANTS = {
  a: {
    dept: "Finance",
    rep: "CFO Office",
    arg: "We fund and steward this dataset through the Finance Data Warehouse. Ownership follows the budget authority.",
  },
  b: {
    dept: "IT",
    rep: "Infrastructure Lead",
    arg: "We operate the ERP source system and pipeline. Technical control means IT owns the feed.",
  },
} as const;

/** Correct ruling index: 0 = Finance */
export const TUT_CORRECT_RULING_IDX = 0;

export const TUT_VERIFY = {
  title: "SECURITY VERIFICATION",
  sub: "Answer the questions to extract the access token.",
  questions: [
    {
      label: "Who is the Data Steward for this dataset?",
      note: "★ settles ownership when verified",
      opts: ["IT Infrastructure Lead", "Finance Dept — Corporate Accounting", "Operations Scheduler"],
      correct: 1,
    },
    {
      label: "What is the classification level?",
      note: "",
      opts: ["PUBLIC", "CONFIDENTIAL", "INTERNAL ONLY"],
      correct: 1,
    },
  ],
} as const;

export type M2TutorialDemoApi = {
  applyBaseline: () => void;
  prepareForStep: (stepIndex: number) => void;
  isRegistrySelected: () => boolean;
  isRuledCorrect: () => boolean;
  isVerifyComplete: () => boolean;
  isTokenLocked: () => boolean;
  setStepBanner: (text: string) => void;
};
