export type DifficultyId = "easy" | "standard" | "hard";

function difficultyNormalize(raw: string | null | undefined): string {
  const d = (raw ?? "standard").trim().toLowerCase();
  if (d === "easy" || d === "standard" || d === "hard") return d;
  return "standard";
}

export type DifficultyProfile = {
  id: DifficultyId;
  label: string;
  /** Multiplier for wrong-answer / decoy detection hits. */
  penaltyScale: number;
  /** Multiplier for passive detection bleed. */
  passiveScale: number;
  /** Multiplier for hint detection cost. */
  hintScale: number;
  /** Hint cooldown multiplier (Easy shorter). */
  hintCooldownScale: number;
  /** M1: how many full meter resets before hard fail (Standard = 1). */
  m1MaxReconnects: number;
  /** M3: Nova sign-off detection ceiling. */
  m3SignoffMax: number;
  /** Extra scale on M3 vault→public catastrophic hit. */
  m3CatastrophicScale: number;
  /** M5: commits needed to ship. */
  m5RequiredCommits: number;
  /** M5: retries allowed per crew member after a wrong answer. */
  m5CrewMaxRetries: number;
  /** M5: scale on framing/viz confirm detection. */
  m5FramingPenaltyScale: number;
};

/** Standard ≡ current shipped constants. Easy / Hard are deltas. */
export const DIFFICULTY_PROFILES: Record<DifficultyId, DifficultyProfile> = {
  easy: {
    id: "easy",
    label: "Easy",
    penaltyScale: 0.55,
    passiveScale: 0.45,
    hintScale: 0.4,
    hintCooldownScale: 0.6,
    m1MaxReconnects: 2,
    m3SignoffMax: 78,
    m3CatastrophicScale: 0.5,
    m5RequiredCommits: 4,
    m5CrewMaxRetries: 2,
    m5FramingPenaltyScale: 0.5,
  },
  standard: {
    id: "standard",
    label: "Standard",
    penaltyScale: 1,
    passiveScale: 1,
    hintScale: 1,
    hintCooldownScale: 1,
    m1MaxReconnects: 1,
    m3SignoffMax: 55,
    m3CatastrophicScale: 1,
    m5RequiredCommits: 4,
    m5CrewMaxRetries: 1,
    m5FramingPenaltyScale: 1,
  },
  hard: {
    id: "hard",
    label: "Hard",
    penaltyScale: 1.45,
    /** Deliberation-friendly vs 1.65 — Hard should tax mistakes, not reading time. */
    passiveScale: 1.4,
    hintScale: 1.5,
    hintCooldownScale: 1.5,
    m1MaxReconnects: 0,
    m3SignoffMax: 38,
    /** 1.0 = spike via penaltyScale alone (~61%); avoid double-stack ≈82% run-kills. */
    m3CatastrophicScale: 1.0,
    m5RequiredCommits: 4,
    /** One retry unstacks finale cliff; M1 stays at 0 reconnects as Hard identity. */
    m5CrewMaxRetries: 1,
    m5FramingPenaltyScale: 1.4,
  },
};

export function parseDifficulty(raw: string | null | undefined): DifficultyId {
  const n = difficultyNormalize(raw);
  if (n === "easy" || n === "hard" || n === "standard") return n;
  return "standard";
}

export function getDifficultyProfile(raw: string | null | undefined): DifficultyProfile {
  return DIFFICULTY_PROFILES[parseDifficulty(raw)];
}

function scaleHit(base: number, scale: number): number {
  if (base <= 0) return 0;
  return Math.max(1, Math.round(base * scale));
}

export type M1DetBalance = {
  difficultyId: DifficultyId;
  passivePerSec: number;
  decoy: number;
  decoyClick: number;
  wrongClick: number;
  verifyFail: number;
  hint: number;
  hintCooldownMs: number;
  maxReconnects: number;
};

export function getM1DetBalance(profile: DifficultyProfile): M1DetBalance {
  const basePassive = 100 / 1500;
  return {
    difficultyId: profile.id,
    passivePerSec: basePassive * profile.passiveScale,
    decoy: scaleHit(6, profile.penaltyScale),
    decoyClick: scaleHit(3, profile.penaltyScale),
    wrongClick: scaleHit(8, profile.penaltyScale),
    verifyFail: scaleHit(10, profile.penaltyScale),
    hint: scaleHit(8, profile.hintScale),
    hintCooldownMs: Math.round(30000 * profile.hintCooldownScale),
    maxReconnects: profile.m1MaxReconnects,
  };
}

export type M2DetBalance = {
  difficultyId: DifficultyId;
  passivePerTick: number;
  passiveIntervalMs: number;
  wrongRuling: number;
  verifyFailPer: number;
  hint: number;
  hintCooldownMs: number;
};

export function getM2DetBalance(profile: DifficultyProfile): M2DetBalance {
  return {
    difficultyId: profile.id,
    passivePerTick: 0.35 * profile.passiveScale,
    passiveIntervalMs: 4000,
    wrongRuling: scaleHit(18, profile.penaltyScale),
    verifyFailPer: scaleHit(10, profile.penaltyScale),
    hint: scaleHit(8, profile.hintScale),
    hintCooldownMs: Math.round(30000 * profile.hintCooldownScale),
  };
}

export type M3DetBalance = {
  difficultyId: DifficultyId;
  passivePerSec: number;
  wrongRoute: number;
  catastrophicRoute: number;
  hint: number;
  hintCooldownSec: number;
  signoffMax: number;
  officialPublic: number;
  vaultOfficial: number;
  publicVault: number;
  publicOfficial: number;
  officialVault: number;
};

export function getM3DetBalance(profile: DifficultyProfile): M3DetBalance {
  return {
    difficultyId: profile.id,
    passivePerSec: (100 / 1500) * profile.passiveScale,
    wrongRoute: scaleHit(10, profile.penaltyScale),
    catastrophicRoute: scaleHit(42, profile.penaltyScale * profile.m3CatastrophicScale),
    hint: scaleHit(8, profile.hintScale),
    hintCooldownSec: Math.max(8, Math.round(25 * profile.hintCooldownScale)),
    signoffMax: profile.m3SignoffMax,
    officialPublic: scaleHit(30, profile.penaltyScale),
    vaultOfficial: scaleHit(18, profile.penaltyScale),
    publicVault: scaleHit(12, profile.penaltyScale),
    publicOfficial: scaleHit(10, profile.penaltyScale),
    officialVault: scaleHit(10, profile.penaltyScale),
  };
}

export type M4DetBalance = {
  difficultyId: DifficultyId;
  passivePerSec: number;
  hint: number;
  hintCooldownSec: number;
  wrongDrop: number;
  wrongDropSensitive: number;
};

export function getM4DetBalance(profile: DifficultyProfile): M4DetBalance {
  return {
    difficultyId: profile.id,
    passivePerSec: (100 / 1500) * profile.passiveScale,
    hint: scaleHit(8, profile.hintScale),
    hintCooldownSec: Math.max(8, Math.round(25 * profile.hintCooldownScale)),
    wrongDrop: scaleHit(10, profile.penaltyScale),
    wrongDropSensitive: scaleHit(14, profile.penaltyScale),
  };
}

export type M5DetBalance = {
  difficultyId: DifficultyId;
  requiredCommits: number;
  crewMaxRetries: number;
  framingWrongFrame: number;
  framingWrongViz: number;
  crewMiss: number;
};

export function getM5DetBalance(profile: DifficultyProfile): M5DetBalance {
  return {
    difficultyId: profile.id,
    requiredCommits: profile.m5RequiredCommits,
    crewMaxRetries: profile.m5CrewMaxRetries,
    framingWrongFrame: scaleHit(8, profile.m5FramingPenaltyScale),
    framingWrongViz: scaleHit(5, profile.m5FramingPenaltyScale),
    crewMiss: scaleHit(10, profile.penaltyScale),
  };
}
