import { prisma } from "@/lib/db";
import { assertLocaleAssignable, ensureLocalePacksSeeded, normalizeLocaleCode } from "@/lib/locale";
import { isAdminRole } from "@/lib/roles";

export type GroupLocaleSettings = {
  id: string;
  name: string;
  slug: string;
  locale: string;
  availableLocales: string[];
  inviteCode: string | null;
  memberCount: number;
};

export async function getGroupForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      groupRole: true,
      group: {
        select: {
          id: true,
          name: true,
          slug: true,
          locale: true,
          availableLocales: true,
          inviteCode: true,
          _count: { select: { members: true } },
        },
      },
    },
  });
  if (!user?.group) return null;
  return {
    group: {
      id: user.group.id,
      name: user.group.name,
      slug: user.group.slug,
      locale: user.group.locale,
      availableLocales: user.group.availableLocales,
      inviteCode: user.group.inviteCode,
      memberCount: user.group._count.members,
    } satisfies GroupLocaleSettings,
    groupRole: user.groupRole,
    canManage: isAdminRole(user.role) || user.groupRole === "owner",
  };
}

export async function canManageGroup(userId: string, groupId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, groupId: true, groupRole: true },
  });
  if (!user) return false;
  if (isAdminRole(user.role)) return true;
  return user.groupId === groupId && user.groupRole === "owner";
}

export async function updateGroupLocale(params: {
  groupId: string;
  locale?: string;
  availableLocales?: string[];
}) {
  await ensureLocalePacksSeeded();
  const group = await prisma.group.findUnique({ where: { id: params.groupId } });
  if (!group) throw new Error("Group not found.");

  const availableLocales = params.availableLocales ?? group.availableLocales;
  if (availableLocales.length === 0) {
    throw new Error("At least one available locale is required.");
  }

  for (const code of availableLocales) {
    const pack = await prisma.localePack.findUnique({ where: { code } });
    if (!pack?.enabled) {
      throw new Error(`Locale "${code}" is not enabled.`);
    }
  }

  const locale = params.locale ?? group.locale;
  await assertLocaleAssignable(locale, availableLocales);

  return prisma.group.update({
    where: { id: params.groupId },
    data: { locale, availableLocales },
    select: {
      id: true,
      name: true,
      slug: true,
      locale: true,
      availableLocales: true,
      inviteCode: true,
      _count: { select: { members: true } },
    },
  });
}

export async function addLocalePack(codeRaw: string, labelRaw: string) {
  const code = normalizeLocaleCode(codeRaw);
  if (!code) throw new Error("Invalid locale code (use e.g. en, nl, de, fr).");
  const label = labelRaw.trim();
  if (!label) throw new Error("Label is required.");

  return prisma.localePack.upsert({
    where: { code },
    create: { code, label, enabled: true },
    update: { label, enabled: true },
  });
}

export async function ensureDemoGroup() {
  await ensureLocalePacksSeeded();
  return prisma.group.upsert({
    where: { slug: "demo-cohort" },
    create: {
      name: "Demo Cohort",
      slug: "demo-cohort",
      locale: "en",
      availableLocales: ["en", "nl"],
      inviteCode: "OMNI-DEMO",
    },
    update: {},
  });
}
