import { prisma } from "@/lib/db";

const SETTINGS_ID = "default";

export type OrgSettingsRow = {
  notifyEmail: string | null;
  updatedAt: Date;
};

export async function getOrgSettings(): Promise<OrgSettingsRow> {
  const row = await prisma.orgSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, notifyEmail: null },
    update: {},
  });
  return { notifyEmail: row.notifyEmail, updatedAt: row.updatedAt };
}

export async function updateOrgSettings(patch: { notifyEmail?: string | null }): Promise<OrgSettingsRow> {
  const notifyEmail =
    patch.notifyEmail === undefined
      ? undefined
      : patch.notifyEmail?.trim()
        ? patch.notifyEmail.trim().toLowerCase()
        : null;

  const row = await prisma.orgSettings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      notifyEmail: notifyEmail ?? null,
    },
    update: {
      ...(notifyEmail !== undefined ? { notifyEmail } : {}),
    },
  });
  return { notifyEmail: row.notifyEmail, updatedAt: row.updatedAt };
}
