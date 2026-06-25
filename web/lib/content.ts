import { readFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import videointroJson from "../content/videointro.json";

const contentRoot = path.join(process.cwd(), "content");

const loginSchema = z.object({
  statusLeft: z.array(z.string()),
  statusRight: z.array(z.string()),
  opLabel: z.string(),
  title: z.string(),
  intro: z.string(),
  emailLabel: z.string(),
  emailPlaceholder: z.string(),
  emailHelper: z.string(),
  emailError: z.string(),
  passwordLabel: z.string(),
  passwordPlaceholder: z.string(),
  passwordError: z.string(),
  submitLogin: z.string(),
  submitRegister: z.string(),
  aboutButton: z.string(),
  switchToRegister: z.string(),
  switchToLogin: z.string(),
  about: z.object({
    eyebrow: z.string(),
    title: z.string(),
    paragraphs: z.array(z.string()),
    close: z.string(),
  }),
  register: z.object({
    title: z.string(),
    confirmLabel: z.string(),
    confirmError: z.string(),
    successRedirect: z.string(),
  }),
});

const hubSchema = z.object({
  statusLeft: z.array(z.string()),
  statusRight: z.array(z.string()),
  eyebrow: z.string(),
  title: z.string(),
  subtitle: z.string(),
  continueLabel: z.string(),
  continueSuffix: z.string(),
  restartLabel: z.string(),
  restartHint: z.string(),
  checkpointLabel: z.string(),
  rosterLabel: z.string(),
  playLabel: z.string(),
  replayLabel: z.string(),
  lockedLabel: z.string(),
  lockedHint: z.string(),
  signOut: z.string(),
  reportLabel: z.string(),
  reportHint: z.string(),
  footer: z.string(),
});

const missionMetaSchema = z.object({
  id: z.string(),
  order: z.number(),
  label: z.string(),
  name: z.string(),
  description: z.string(),
  renderer: z.enum(["react", "legacy"]).default("react"),
  legacyHtmlPath: z.string(),
  requiresMissionId: z.string().nullable(),
  progressBridge: z.boolean().optional(),
});

const missionIntroSchema = z.object({
  missionId: z.string(),
  statusLeft: z.array(z.string()),
  statusRight: z.array(z.string()),
  tutorialStatusRight: z.array(z.string()).optional(),
  brief: z.object({
    eyebrow: z.string(),
    title: z.string(),
    params: z.array(z.object({ label: z.string(), value: z.string() })),
    briefParagraphs: z.array(z.string()),
    pullquote: z.string(),
    dossier: z.array(z.object({ label: z.string(), name: z.string(), role: z.string() })),
    encryptedChannel: z.string().optional(),
    ghostContinue: z.boolean().optional(),
    useHtml: z.boolean().optional(),
    continueLabel: z.string(),
    continueDelayMs: z.number(),
    ackGateLabel: z.string().optional(),
  }),
  protocol: z.object({
    eyebrow: z.string(),
    title: z.string(),
    sectionLabel: z.string(),
    steps: z.array(
      z.object({
        number: z.string(),
        title: z.string(),
        description: z.string(),
      })
    ),
    atlasNote: z.string().optional(),
    detection: z
      .object({
        title: z.string(),
        tag: z.string(),
        description: z.string().optional(),
        paragraphs: z.array(z.string()).optional(),
        pills: z.union([
          z.array(z.string()),
          z.array(z.object({ text: z.string(), variant: z.enum(["low", "mid", "high", "hint"]) })),
        ]),
        hint: z.string(),
        hintPills: z.array(z.string()).optional(),
      })
      .nullable(),
    breachLabel: z.string(),
    breachReadyLabel: z.string(),
  }),
  game: z.object({
    placeholderTitle: z.string(),
    placeholderBody: z.string(),
  }),
});

const mediaAssetSchema = z.object({
  type: z.enum(["video", "audio"]),
  src: z.string(),
  poster: z.string().optional(),
  captions: z.string().optional(),
});

const videoIntroSchema = z.object({
  statusLeft: z.array(z.string()),
  statusRight: z.array(z.string()),
  eyebrow: z.string(),
  title: z.string(),
  video: z.object({
    filename: z.string(),
    aspectLabel: z.string(),
    placeholderText: z.string(),
    src: z.string().nullable(),
    poster: z.string().nullable(),
  }),
  readIntroButton: z.string(),
  startLabel: z.string(),
  startButton: z.string(),
  modal: z.object({
    eyebrow: z.string(),
    title: z.string(),
    paragraphs: z.array(z.string()),
    footer: z.string(),
    close: z.string(),
  }),
});

const ambientSchema = z.object({
  type: z.literal("audio"),
  src: z.string(),
  volume: z.number().min(0).max(1).optional(),
});

const missionMediaSchema = z.object({
  missionId: z.string(),
  intro: mediaAssetSchema.optional(),
  echoCue: mediaAssetSchema.optional(),
  ambient: ambientSchema.optional(),
  sfx: z.record(z.string(), z.string()).optional(),
});

const finaleSchema = z.object({
  statusLeft: z.array(z.string()),
  statusRight: z.array(z.string()),
  eyebrow: z.string(),
  title: z.string(),
  totalScoreLabel: z.string(),
  paragraphs: z.array(z.string()),
  pullquote: z.string(),
  scoresLabel: z.string(),
  emailOptInLabel: z.string(),
  emailOptInHint: z.string(),
  emailFieldLabel: z.string(),
  continueLabel: z.string(),
  footer: z.string(),
});

async function readJson<T>(filePath: string, schema: z.ZodType<T>): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return schema.parse(JSON.parse(raw));
}

export type LoginContent = z.infer<typeof loginSchema>;
export type HubContent = z.infer<typeof hubSchema>;
export type VideoIntroContent = z.infer<typeof videoIntroSchema>;
export type MissionMeta = z.infer<typeof missionMetaSchema>;
export type MissionIntro = z.infer<typeof missionIntroSchema>;
export type MissionMedia = z.infer<typeof missionMediaSchema>;
export type FinaleContent = z.infer<typeof finaleSchema>;

export async function getLoginContent(): Promise<LoginContent> {
  return readJson(path.join(contentRoot, "login.json"), loginSchema);
}

export async function getHubContent(): Promise<HubContent> {
  return readJson(path.join(contentRoot, "hub.json"), hubSchema);
}

export async function getVideoIntroContent(): Promise<VideoIntroContent> {
  return videoIntroSchema.parse(videointroJson);
}

export async function getMissionCatalog(): Promise<MissionMeta[]> {
  const ids = ["m1", "m2", "m3", "m4", "m5"];
  const missions = await Promise.all(
    ids.map((id) =>
      readJson(path.join(contentRoot, "missions", id, "meta.json"), missionMetaSchema)
    )
  );
  return missions.sort((a, b) => a.order - b.order);
}

export async function getMissionMeta(missionId: string): Promise<MissionMeta | null> {
  const catalog = await getMissionCatalog();
  return catalog.find((m) => m.id === missionId) ?? null;
}

export async function getMissionMedia(missionId: string): Promise<MissionMedia | null> {
  const file = path.join(contentRoot, "missions", missionId, "media.json");
  try {
    return await readJson(file, missionMediaSchema);
  } catch {
    return null;
  }
}

export async function getMissionIntro(missionId: string): Promise<MissionIntro> {
  return readJson(
    path.join(contentRoot, "missions", missionId, "intro.json"),
    missionIntroSchema
  );
}

export async function getFinaleContent(): Promise<FinaleContent> {
  return readJson(path.join(contentRoot, "finale.json"), finaleSchema);
}
