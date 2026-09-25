import { z } from "zod";
import {
  createInvite,
  listInvites,
  inviteDisplayLabel,
  buildRegisterUrl,
} from "@/lib/invites";
import { prisma } from "@/lib/db";
import { jsonWithCors, optionsCors, requireDashboardAdmin } from "@/lib/dashboardAuth";

export async function OPTIONS(request: Request) {
  return optionsCors(request);
}

export async function GET(request: Request) {
  const gate = await requireDashboardAdmin(request);
  if (!gate.ok) return gate.response;

  const rows = await listInvites();
  const usedIds = rows.map((r) => r.usedByUserId).filter(Boolean) as string[];
  const usedUsers =
    usedIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: usedIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
  const usedById = new Map(usedUsers.map((u) => [u.id, u]));

  const gameBase = (process.env.OMNI_PUBLIC_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );

  return jsonWithCors(request, {
    invites: rows.map((inv) => {
      const used = inv.usedByUserId ? usedById.get(inv.usedByUserId) : null;
      return {
        id: inv.id,
        token: inv.token,
        type: inv.type,
        label: inviteDisplayLabel({
          type: inv.type,
          playerName: inv.playerName,
          email: inv.email,
          cohortLabel: inv.cohortLabel,
          token: inv.token,
          group: inv.group,
          usedUserName: used?.name ?? null,
        }),
        meta:
          inv.type === "group"
            ? `${inv.seats ?? "—"} seats · ${inv.difficulty} · ${inv.locale}`
            : `${inv.difficulty} · ${inv.company ?? "—"} · ${inv.locale}`,
        url: buildRegisterUrl(gameBase, inv),
        status:
          inv.status === "revoked"
            ? "Expired"
            : inv.status === "used"
              ? "Used"
              : inv.expiresAt && inv.expiresAt < new Date()
                ? "Expired"
                : "Active",
        language: inv.locale,
        difficulty: inv.difficulty,
        company: inv.company,
        playerName: inv.playerName,
        email: inv.email,
        seats: inv.seats,
        cohort: inv.cohortLabel,
        created: inv.createdAt.toISOString(),
        expires: inv.expiresAt?.toISOString() ?? null,
        groupId: inv.groupId,
      };
    }),
  });
}

const createSchema = z.object({
  type: z.enum(["individual", "group"]),
  lang: z.string().optional(),
  locale: z.string().optional(),
  difficulty: z.string().optional(),
  company: z.string().optional(),
  cohort: z.string().optional(),
  seats: z.number().int().positive().optional(),
  email: z.string().email().optional().or(z.literal("")),
  playerName: z.string().max(80).optional().or(z.literal("")),
  name: z.string().max(80).optional().or(z.literal("")),
  expiresInDays: z.number().int().min(1).max(90).optional(),
});

export async function POST(request: Request) {
  const gate = await requireDashboardAdmin(request);
  if (!gate.ok) return gate.response;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return jsonWithCors(request, { error: "Invalid invite payload." }, { status: 400 });
  }

  try {
    const playerName = (parsed.data.playerName || parsed.data.name || "").trim() || undefined;
    const { invite, group } = await createInvite({
      type: parsed.data.type,
      lang: parsed.data.lang,
      locale: parsed.data.locale,
      difficulty: parsed.data.difficulty,
      company: parsed.data.company,
      cohort: parsed.data.cohort,
      seats: parsed.data.seats,
      email: parsed.data.email || undefined,
      playerName,
      expiresInDays: parsed.data.expiresInDays,
    });

    const gameBase = (process.env.OMNI_PUBLIC_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(
      /\/$/,
      "",
    );
    const url = buildRegisterUrl(gameBase, invite);

    return jsonWithCors(request, {
      ok: true,
      invite: {
        id: invite.id,
        token: invite.token,
        type: invite.type,
        url,
        locale: invite.locale,
        difficulty: invite.difficulty,
        company: invite.company,
        playerName: invite.playerName,
        email: invite.email,
        seats: invite.seats,
        cohort: invite.cohortLabel,
        expiresAt: invite.expiresAt,
        groupId: group?.id ?? invite.groupId,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create invite.";
    return jsonWithCors(request, { error: message }, { status: 400 });
  }
}
