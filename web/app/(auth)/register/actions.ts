"use server";

import { redirect } from "next/navigation";
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
import { signIn } from "@/lib/auth";
import { buildRegisterHref } from "@/lib/register-steps";

const formSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(2).max(80),
  password: z.string().min(8),
  confirm: z.string().min(8),
  preferredLocale: z.string().min(2).max(8).optional(),
  invite: z.string().min(1),
  group: z.string().optional(),
  lang: z.string().optional(),
  diff: z.string().optional(),
  co: z.string().optional(),
});

function backToPassword(form: FormData, error: string): never {
  const href = buildRegisterHref(
    {
      invite: String(form.get("invite") || "") || null,
      group: String(form.get("group") || "") || null,
      lang: String(form.get("lang") || form.get("preferredLocale") || "") || null,
      diff: String(form.get("diff") || "") || null,
      co: String(form.get("co") || "") || null,
      cohort: String(form.get("cohort") || "") || null,
      seats: String(form.get("seats") || "") || null,
    },
    "password",
    {
      email: String(form.get("email") || "").trim() || undefined,
      name: String(form.get("name") || "").trim() || undefined,
      lang: String(form.get("lang") || form.get("preferredLocale") || "") || null,
    },
  );
  redirect(`${href}&regError=${encodeURIComponent(error)}`);
}

/**
 * Progressive-enhancement register: works with a plain HTML form POST
 * even when the React client never hydrates.
 */
export async function completeRegistration(formData: FormData) {
  const raw = {
    email: String(formData.get("email") || ""),
    name: String(formData.get("name") || ""),
    password: String(formData.get("password") || ""),
    confirm: String(formData.get("confirm") || ""),
    preferredLocale: String(formData.get("preferredLocale") || formData.get("lang") || "") || undefined,
    invite: String(formData.get("invite") || ""),
    group: String(formData.get("group") || "") || undefined,
    lang: String(formData.get("lang") || "") || undefined,
    diff: String(formData.get("diff") || "") || undefined,
    co: String(formData.get("co") || "") || undefined,
  };

  const parsed = formSchema.safeParse(raw);
  if (!parsed.success) {
    backToPassword(formData, "A valid invite, name, email, and password (min 8) are required.");
  }

  if (parsed.data.password !== parsed.data.confirm) {
    backToPassword(formData, "Passwords do not match.");
  }

  await ensureLocalePacksSeeded();

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    backToPassword(formData, "An operative with this email already exists.");
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
    backToPassword(formData, message);
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
      name: parsed.data.name.trim(),
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

  // Auth.js signIn throws a redirect — let it send the browser to /intro with the session cookie.
  await signIn("credentials", {
    email,
    password: parsed.data.password,
    redirectTo: "/intro",
  });
}
