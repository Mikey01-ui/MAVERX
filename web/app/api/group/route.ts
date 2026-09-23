import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGroupForUser, updateGroupLocale, ensureDemoGroup } from "@/lib/group";
import { isAdminRole } from "@/lib/roles";
import { ensureLocalePacksSeeded } from "@/lib/locale";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getGroupForUser(session.user.id);
  if (!membership) {
    return NextResponse.json({ group: null, canManage: false });
  }

  return NextResponse.json({
    group: membership.group,
    canManage: membership.canManage,
    groupRole: membership.groupRole,
  });
}

const patchSchema = z.object({
  locale: z.string().min(2).max(8).optional(),
  availableLocales: z.array(z.string().min(2).max(8)).min(1).optional(),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getGroupForUser(session.user.id);
  if (!membership?.group) {
    return NextResponse.json({ error: "No group assigned." }, { status: 404 });
  }
  if (!membership.canManage) {
    return NextResponse.json({ error: "Only group owners or admins can change language." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  try {
    const updated = await updateGroupLocale({
      groupId: membership.group.id,
      locale: parsed.data.locale,
      availableLocales: parsed.data.availableLocales,
    });
    return NextResponse.json({
      ok: true,
      group: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        locale: updated.locale,
        availableLocales: updated.availableLocales,
        inviteCode: updated.inviteCode,
        memberCount: updated._count.members,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

const createSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
  locale: z.string().min(2).max(8).default("en"),
});

/** Create a group and assign the caller as owner (admin bootstrap / future dashboard). */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, groupId: true },
  });
  if (!isAdminRole(user?.role)) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  await ensureLocalePacksSeeded();

  const body = await request.json().catch(() => null);
  // Empty body → ensure demo group exists (dev convenience)
  if (!body || Object.keys(body).length === 0) {
    const demo = await ensureDemoGroup();
    await prisma.user.update({
      where: { id: session.user.id },
      data: { groupId: demo.id, groupRole: "owner" },
    });
    return NextResponse.json({ ok: true, group: demo });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid name/slug/locale." }, { status: 400 });
  }

  const locale = parsed.data.locale;
  const pack = await prisma.localePack.findUnique({ where: { code: locale } });
  if (!pack?.enabled) {
    return NextResponse.json({ error: `Locale "${locale}" is not enabled.` }, { status: 400 });
  }

  try {
    const group = await prisma.group.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        locale,
        availableLocales: ["en", "nl"].includes(locale) ? ["en", "nl"] : ["en", "nl", locale],
      },
    });
    await prisma.user.update({
      where: { id: session.user.id },
      data: { groupId: group.id, groupRole: "owner" },
    });
    return NextResponse.json({ ok: true, group });
  } catch {
    return NextResponse.json({ error: "Could not create group (slug may be taken)." }, { status: 409 });
  }
}
