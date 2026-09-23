import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { ensureLocalePacksSeeded, normalizeLocaleCode } from "@/lib/locale";

/** Dashboard display labels → locale codes (and passthrough for codes). */
const LANG_ALIASES: Record<string, string> = {
  english: "en",
  en: "en",
  nederlands: "nl",
  dutch: "nl",
  nl: "nl",
  estonian: "et",
  et: "et",
  finnish: "fi",
  fi: "fi",
  german: "de",
  deutsch: "de",
  de: "de",
};

export function localeFromDashboardLang(raw: string | null | undefined): string {
  if (!raw) return "en";
  const key = raw.trim().toLowerCase();
  if (LANG_ALIASES[key]) return LANG_ALIASES[key];
  return normalizeLocaleCode(key) ?? "en";
}

export function difficultyNormalize(raw: string | null | undefined): string {
  const d = (raw ?? "standard").trim().toLowerCase();
  if (d === "easy" || d === "standard" || d === "hard") return d;
  return "standard";
}

function makeToken(prefix: "gx" | "px"): string {
  return `${prefix}_${randomBytes(6).toString("hex")}`;
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || `cohort-${Date.now().toString(36)}`
  );
}

export type CreateInviteInput = {
  type: "individual" | "group";
  locale?: string;
  lang?: string;
  difficulty?: string;
  company?: string;
  cohort?: string;
  seats?: number;
  email?: string;
  expiresInDays?: number;
};

export async function createInvite(input: CreateInviteInput) {
  await ensureLocalePacksSeeded();
  const locale = localeFromDashboardLang(input.locale ?? input.lang);
  const difficulty = difficultyNormalize(input.difficulty);
  const company = input.company?.trim() || null;
  const expiresInDays = input.expiresInDays ?? 7;
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  // Ensure pack exists for any lang the dashboard sends (et/fi/de/nl/…)
  const label =
    locale === "nl"
      ? "Nederlands"
      : locale === "et"
        ? "Estonian"
        : locale === "fi"
          ? "Finnish"
          : locale === "de"
            ? "German"
            : locale === "en"
              ? "English"
              : locale.toUpperCase();
  await prisma.localePack.upsert({
    where: { code: locale },
    create: { code: locale, label, enabled: true },
    update: { enabled: true },
  });

  if (input.type === "group") {
    const cohortLabel = (input.cohort?.trim() || company || "Cohort").slice(0, 80);
    const token = makeToken("gx");
    let slug = slugify(cohortLabel);
    const existing = await prisma.group.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${token.slice(-4)}`;

    const group = await prisma.group.create({
      data: {
        name: cohortLabel,
        slug,
        locale,
        availableLocales: ["en", "nl", locale].filter((v, i, a) => a.indexOf(v) === i),
        inviteCode: token,
        company,
        difficulty,
      },
    });

    const invite = await prisma.invite.create({
      data: {
        token,
        type: "group",
        groupId: group.id,
        locale,
        difficulty,
        company,
        cohortLabel,
        seats: input.seats ?? null,
        expiresAt,
        status: "active",
      },
    });

    return { invite, group };
  }

  const token = makeToken("px");
  const invite = await prisma.invite.create({
    data: {
      token,
      type: "individual",
      email: input.email?.trim().toLowerCase() || null,
      locale,
      difficulty,
      company,
      expiresAt,
      status: "active",
    },
  });
  return { invite, group: null };
}

export async function listInvites() {
  return prisma.invite.findMany({
    orderBy: { createdAt: "desc" },
    include: { group: { select: { id: true, name: true, slug: true, locale: true } } },
  });
}

export async function revokeInvite(tokenOrId: string) {
  const invite = await prisma.invite.findFirst({
    where: { OR: [{ id: tokenOrId }, { token: tokenOrId }] },
  });
  if (!invite) throw new Error("Invite not found.");
  if (invite.status === "revoked") return invite;
  return prisma.invite.update({
    where: { id: invite.id },
    data: { status: "revoked" },
  });
}

export type RedeemResult = {
  groupId: string | null;
  locale: string;
  difficulty: string;
  company: string | null;
  inviteId: string | null;
};

/** Resolve invite/group query for registration. Marks individual invites used after success separately. */
export async function resolveInviteForRegister(params: {
  invite?: string | null;
  group?: string | null;
  lang?: string | null;
}): Promise<RedeemResult> {
  const now = new Date();
  const fallbackLocale = localeFromDashboardLang(params.lang);

  const token = (params.invite || params.group || "").trim();
  if (!token) {
    return { groupId: null, locale: fallbackLocale, difficulty: "standard", company: null, inviteId: null };
  }

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { group: true },
  });

  if (!invite) {
    // Legacy: Group.inviteCode without Invite row
    const group = await prisma.group.findFirst({
      where: { OR: [{ inviteCode: token }, { slug: token }] },
    });
    if (!group) throw new Error("Invite link is invalid.");
    return {
      groupId: group.id,
      locale: group.locale || fallbackLocale,
      difficulty: group.difficulty || "standard",
      company: group.company,
      inviteId: null,
    };
  }

  if (invite.status === "revoked") throw new Error("Invite has been revoked.");
  if (invite.status === "expired" || (invite.expiresAt && invite.expiresAt < now)) {
    if (invite.status !== "expired") {
      await prisma.invite.update({ where: { id: invite.id }, data: { status: "expired" } });
    }
    throw new Error("Invite has expired.");
  }
  if (invite.type === "individual" && invite.status === "used") {
    throw new Error("Invite has already been used.");
  }

  return {
    groupId: invite.groupId,
    locale: invite.locale || fallbackLocale,
    difficulty: invite.difficulty || "standard",
    company: invite.company,
    inviteId: invite.id,
  };
}

export async function markInviteUsed(inviteId: string, userId: string) {
  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!invite) return;
  if (invite.type === "individual") {
    await prisma.invite.update({
      where: { id: inviteId },
      data: { status: "used", usedAt: new Date(), usedByUserId: userId },
    });
  } else {
    await prisma.invite.update({
      where: { id: inviteId },
      data: { usedAt: new Date(), usedByUserId: userId },
    });
  }
}

export function buildRegisterUrl(baseUrl: string, invite: { token: string; type: string; locale: string; difficulty: string; company: string | null; cohortLabel: string | null; seats: number | null }) {
  const u = new URL("/register", baseUrl.replace(/\/$/, "") + "/");
  if (invite.type === "group") {
    u.searchParams.set("group", invite.token);
    if (invite.seats != null) u.searchParams.set("seats", String(invite.seats));
    if (invite.cohortLabel) u.searchParams.set("cohort", invite.cohortLabel);
  } else {
    u.searchParams.set("invite", invite.token);
  }
  u.searchParams.set("lang", invite.locale);
  u.searchParams.set("diff", invite.difficulty);
  if (invite.company) u.searchParams.set("co", invite.company);
  return u.toString();
}
