import { prisma } from "@/lib/db";

export const DEFAULT_LOCALE = "en";

export type LocaleInfo = {
  code: string;
  label: string;
  enabled: boolean;
};

/** Built-in packs — also seeded into LocalePack. */
export const BUILTIN_LOCALES: LocaleInfo[] = [
  { code: "en", label: "English", enabled: true },
  { code: "nl", label: "Nederlands", enabled: true },
];

const LOCALE_CODE_RE = /^[a-z]{2}(-[a-z]{2})?$/;

export function normalizeLocaleCode(raw: string): string | null {
  const code = raw.trim().toLowerCase();
  if (!LOCALE_CODE_RE.test(code)) return null;
  return code;
}

export function isBuiltinLocale(code: string): boolean {
  return BUILTIN_LOCALES.some((l) => l.code === code);
}

/**
 * Mission language resolution:
 * 1. Group.locale when the user belongs to a group
 * 2. Else User.preferredLocale
 * 3. Else DEFAULT_LOCALE
 */
export async function resolveLocaleForUser(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      preferredLocale: true,
      group: { select: { locale: true } },
    },
  });
  if (!user) return DEFAULT_LOCALE;
  if (user.group?.locale) return user.group.locale;
  return user.preferredLocale || DEFAULT_LOCALE;
}

export async function listEnabledLocales(): Promise<LocaleInfo[]> {
  const rows = await prisma.localePack.findMany({
    where: { enabled: true },
    orderBy: { code: "asc" },
  });
  if (rows.length === 0) return BUILTIN_LOCALES.filter((l) => l.enabled);
  return rows.map((r) => ({ code: r.code, label: r.label, enabled: r.enabled }));
}

export async function ensureLocalePacksSeeded() {
  for (const loc of BUILTIN_LOCALES) {
    await prisma.localePack.upsert({
      where: { code: loc.code },
      create: { code: loc.code, label: loc.label, enabled: loc.enabled },
      update: { label: loc.label },
    });
  }
}

export async function assertLocaleAssignable(code: string, availableLocales: string[]) {
  const pack = await prisma.localePack.findUnique({ where: { code } });
  if (!pack || !pack.enabled) {
    throw new Error(`Locale "${code}" is not enabled.`);
  }
  if (!availableLocales.includes(code)) {
    throw new Error(`Locale "${code}" is not available for this group.`);
  }
}
