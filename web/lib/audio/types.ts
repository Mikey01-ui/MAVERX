export type SfxMap = Partial<Record<string, string>>;

export type AmbientConfig = {
  type: "audio";
  src: string;
  volume?: number;
};

export type MissionAudioConfig = {
  missionId: string;
  ambient?: AmbientConfig;
  sfx?: SfxMap;
};

export const M3_SFX_KEYS = [
  "correct",
  "wrong",
  "detectionWarn",
  "gameOver",
  "missionPass",
  "signoffOk",
  "signoffDeny",
  "vaultWrong",
  "vaultClick",
  "vaultBolt",
  "vaultOpen",
  "vaultReveal",
] as const;

export const M4_SFX_KEYS = ["correct", "wrong", "detectionWarn", "gameOver", "missionPass"] as const;

export const M1_SFX_KEYS = ["correct", "wrong", "detectionWarn", "gameOver", "missionPass"] as const;

export const M2_SFX_KEYS = ["correct", "wrong", "detectionWarn", "gameOver", "missionPass"] as const;

export const M5_SFX_KEYS = ["correct", "wrong", "detectionWarn", "missionPass"] as const;

export type M3SfxKey = (typeof M3_SFX_KEYS)[number];
export type M4SfxKey = (typeof M4_SFX_KEYS)[number];
export type M1SfxKey = (typeof M1_SFX_KEYS)[number];
export type M2SfxKey = (typeof M2_SFX_KEYS)[number];
export type M5SfxKey = (typeof M5_SFX_KEYS)[number];
