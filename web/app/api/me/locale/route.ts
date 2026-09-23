import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveLocaleForUser, listEnabledLocales } from "@/lib/locale";
import { getGroupForUser } from "@/lib/group";
import { prisma } from "@/lib/db";

/** Current user's resolved mission locale + group language context. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [locale, locales, membership, user] = await Promise.all([
    resolveLocaleForUser(session.user.id),
    listEnabledLocales(),
    getGroupForUser(session.user.id),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { preferredLocale: true },
    }),
  ]);

  return NextResponse.json({
    locale,
    preferredLocale: user?.preferredLocale ?? "en",
    source: membership?.group ? "group" : "user",
    group: membership?.group ?? null,
    canManageGroup: membership?.canManage ?? false,
    locales,
  });
}
