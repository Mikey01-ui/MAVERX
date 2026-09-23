import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import {
  resolveInviteForRegister,
  markInviteUsed,
  resolvePlayableLocale,
  isAnyLocale,
} from "@/lib/invites";
import { ensureLocalePacksSeeded } from "@/lib/locale";
import { notifyAdminOfRegistration } from "@/lib/email/notifyAdminRegistration";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  preferredLocale: z.string().min(2).max(8).optional(),
  invite: z.string().min(1),
  group: z.string().optional(),
  lang: z.string().optional(),
  diff: z.string().optional(),
  co: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "A valid invite link, email, and password (min 8) are required." },
        { status: 400 },
      );
    }

    await ensureLocalePacksSeeded();

    const email = parsed.data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An operative with this email already exists." }, { status: 409 });
    }

    let redeem;
    try {
      redeem = await resolveInviteForRegister({
        invite: parsed.data.invite,
        group: parsed.data.group,
        lang: parsed.data.lang ?? parsed.data.preferredLocale,
        requireInvite: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid invite.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const playerPick = parsed.data.preferredLocale ?? parsed.data.lang;
    const preferredLocale =
      redeem.groupId != null && !isAnyLocale(redeem.locale)
        ? resolvePlayableLocale(redeem.locale)
        : isAnyLocale(redeem.locale)
          ? resolvePlayableLocale(playerPick, "en")
          : resolvePlayableLocale(redeem.locale || playerPick, "en");

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        preferredLocale,
        groupId: redeem.groupId,
        groupRole: "member",
        difficulty: redeem.difficulty,
        company: redeem.company ?? parsed.data.co?.trim() ?? null,
      },
    });

    if (redeem.inviteId) {
      await markInviteUsed(redeem.inviteId, user.id);
    }

    await prisma.userProgress.create({
      data: { userId: user.id, missionId: "m1", status: "in_progress", checkpoint: "start" },
    });

    try {
      await notifyAdminOfRegistration({
        playerEmail: user.email,
        company: user.company,
        difficulty: user.difficulty,
        locale: user.preferredLocale,
        inviteType: redeem.groupId ? "group" : "individual",
      });
    } catch (err) {
      console.error("register notify email failed", err);
    }

    return NextResponse.json({
      ok: true,
      userId: user.id,
      preferredLocale: user.preferredLocale,
      groupId: user.groupId,
      localeSource: user.groupId ? "group" : "user",
    });
  } catch (err) {
    console.error("register error", err);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
