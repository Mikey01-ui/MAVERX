import type { Channel, Dataset } from "@/lib/game/m3/types";

export const CHANNEL_LABELS: Record<Channel, string> = {
  public: "PUBLIC WALL",
  official: "OFFICIAL FILING",
  vault: "NO RELEASE",
};

export const HINT_COOLDOWN_SEC = 25;
/** Nova signs off only if routing detection stays below this ceiling. */
export const SIGNOFF_DETECTION_MAX = 55;

export const DETECTION = {
  passivePerSec: 100 / 1500,
  wrongRoute: 10,
  catastrophicRoute: 42,
  hint: 8,
} as const;

export const HACK_LINES = [
  { text: "OPERATION OMNI — MISSION 03 OF 05", className: "ht-g" },
  { text: "BREACH VECTOR — MARSHALL.DESKTOP", className: "ht-g" },
  { text: "Session: RDP_MIRROR_ACTIVE", className: "ht-a" },
  { text: "Vault: LOCKED · 4-LETTER COMBO REQUIRED", className: "ht-o" },
  { text: "Queue: ENCRYPTED · 10 FILES STAGED", className: "ht-a" },
  { text: "Bypass: COMPLETE", className: "ht-g" },
];

export const INTRO_CHAT = [
  { delay: 400, sender: "Voss" as const, text: "Ten files. Three channels — public wall, official filing, or no release. Read harm profile before you route.", tone: "bm-d" as const },
  { delay: 2200, sender: "Zex" as const, text: "Hardest part isn't getting the data. It's acting like we have standards after we broke in. Route.", tone: "bm-d" as const },
];

export const DATASETS: Dataset[] = [
  { id: "omni_exec", file: "Q4_Performance_Review.pdf", correct: "public", classification: "Internal — Management", identifiers: "None — aggregates only", harmIfPublic: "Low — no personal records", note: "Board-level ROI; safe for public narrative.", wrongRationale: { official: "It is aggregate ROI with no personal records — the public can hold the company accountable without a sealed regulator filing.", vault: "Nothing in this file justifies hiding it from the public — safe business metrics belong in open disclosure." } },
  { id: "risk_full", file: "Personnel_Assessment_Export.xlsx", correct: "vault", classification: "HR — named employees & model scores", identifiers: "Names, employee IDs, model scores", harmIfPublic: "Severe — re-identification & stigma", note: "Never appropriate for press; vault only.", wrongRationale: { public: "Named employees and model scores would harm real people if the press got this — no external release.", official: "Raw HR intelligence on named staff is not for regulators or counsel through this channel — keep it locked down." } },
  { id: "pipeline", file: "System_Architecture.json", correct: "public", classification: "Internal — Technical", identifiers: "System IDs only", harmIfPublic: "Low — infrastructure evidence", note: "Helps public understand OMNI without PII.", wrongRationale: { official: "This is a technical map with no people in it — the public can absorb it without a sealed filing.", vault: "No personal data here — suppressing it from the public would hide evidence the press is entitled to see." } },
  { id: "health", file: "Health_Screening_Results.dat", correct: "vault", classification: "Restricted — Health", identifiers: "Employee IDs + vitals", harmIfPublic: "Severe — HIPAA-class harm", note: "Regulatory path if ever needed — not mass disclosure.", wrongRationale: { public: "Health results tied to employee IDs would devastate privacy if the press got them — no external audience.", official: "A raw health dump is not what regulators receive through this pipeline — it stays in controlled storage." } },
  { id: "web_logs", file: "Session_Traffic_Log.dat", correct: "official", classification: "Security ops — sessions & partial IPs", identifiers: "Sessions, partial IPs", harmIfPublic: "High if dumped — regulator context OK", note: "Official channels can evaluate; not front page.", wrongRationale: { public: "Session logs can fingerprint people — the press is not supposed to see them.", vault: "Regulators or counsel may need this under process — burying it in the vault blocks accountable review." } },
  { id: "cust_dump", file: "User_Database_Backup.csv", correct: "vault", classification: "Full customer PII", identifiers: "Names, addresses, accounts", harmIfPublic: "Severe — civilian harm", note: "Does not belong in public or opportunistic leaks.", wrongRationale: { public: "A full customer table would doxx civilians — the public must never receive this.", official: "A wholesale customer backup is not for regulators through this channel — no external release." } },
  { id: "memo_847", file: "Internal_Policy_Review.md", correct: "public", classification: "Internal", identifiers: "None in body", harmIfPublic: "Low — organizational admission", note: "Supports narrative without doxxing individuals.", wrongRationale: { official: "The company's own policy admission belongs in open accountability — not a sealed regulator packet.", vault: "Hiding the company's own words from the public would shield accountability, not protect people." } },
  { id: "payroll", file: "Compensation_Review_Report.csv", correct: "official", classification: "Comp review — masked rows", identifiers: "Masked IDs; flagged pay bands", harmIfPublic: "Medium–high — official process for equity", note: "Redacted for filing; not a public spreadsheet drop.", wrongRationale: { public: "Pay equity investigation material is not for a public spreadsheet drop — regulators or counsel review it under process.", vault: "Withholding this entirely blocks the accountable oversight regulators are entitled to." } },
  { id: "schools", file: "Community_Program_Roster.csv", correct: "vault", classification: "Restricted — Minors", identifiers: "Students, guardians", harmIfPublic: "Unacceptable — children", note: "Vault. Full stop.", wrongRationale: { public: "Minors and their guardians must never be exposed to the press — no external release.", official: "Children's data does not flow to regulators through this pipeline — it stays locked down." } },
  { id: "api_abuse", file: "Security_Alert_Log.txt", correct: "public", classification: "Internal — Security", identifiers: "None — sanitized log", harmIfPublic: "Low — technical evidence", note: "Pre-redacted; OK for public wall.", wrongRationale: { official: "This is a sanitized alert trail — the public can see the technical evidence without a sealed filing.", vault: "Suppressing a clean security log would hide proof the public is entitled to — publish it." } },
];

export const DEBRIEF = {
  title: "THE HUMAN SHIELD",
  eyebrow: "// Mission 03",
  cta: "CONTINUE TO MISSION 4 — THE ONBOARDING →",
};

export function routeDetectionPenalty(
  correct: Channel,
  choice: Channel,
): { amount: number; catastrophic: boolean } {
  if (choice === correct) return { amount: 0, catastrophic: false };
  if (correct === "vault" && choice === "public") return { amount: DETECTION.catastrophicRoute, catastrophic: true };
  if (correct === "official" && choice === "public") return { amount: 30, catastrophic: false };
  if (correct === "vault" && choice === "official") return { amount: 18, catastrophic: false };
  if (correct === "public" && choice === "vault") return { amount: 12, catastrophic: false };
  if (correct === "public" && choice === "official") return { amount: 10, catastrophic: false };
  if (correct === "official" && choice === "vault") return { amount: 10, catastrophic: false };
  return { amount: DETECTION.wrongRoute, catastrophic: false };
}

export function wrongExplain(ds: Dataset, choice: Channel): string {
  if (ds.wrongRationale[choice]) return `Not the right channel. ${ds.wrongRationale[choice]}`;
  return "Not the right channel. Re-read identifiers and harm if public, then try again.";
}

/** Rule-based hint — teaches the channel logic without naming this file's answer. */
export function hintForDataset(ds: Dataset): string {
  if (ds.correct === "public") {
    return "Low identifier risk + OK for open narrative → usually PUBLIC WALL.";
  }
  if (ds.correct === "vault") {
    return "High harm, minors, health, or raw PII → NO RELEASE.";
  }
  return "Sensitive but needed for accountable bodies — not the tabloids → OFFICIAL FILING.";
}

export const M3_CHANNEL_LEARNING: Record<
  Channel,
  { who: string; teach: string; example: string }
> = {
  public: {
    who: "PUBLIC WALL",
    teach: "Low harm, no personal identifiers — evidence the public can absorb without doxxing anyone.",
    example: "Q4_Performance_Review.pdf — aggregates only, safe for open narrative.",
  },
  official: {
    who: "OFFICIAL FILING",
    teach: "Sensitive operational material for regulators, counsel, or accountable bodies — not front-page dumps.",
    example: "Session_Traffic_Log.dat — session fingerprints belong in official process, not the press wall.",
  },
  vault: {
    who: "NO RELEASE",
    teach: "Minors, health data, raw PII, or severe re-identification risk — vault default, full stop.",
    example: "Community_Program_Roster.csv — children and guardians never ship through this pipeline.",
  },
};
