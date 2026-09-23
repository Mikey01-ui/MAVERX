import { AmbientShell } from "@/components/layout/AmbientShell";
import { StatusBar } from "@/components/layout/StatusBar";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGroupForUser } from "@/lib/group";
import { ensureLocalePacksSeeded, listEnabledLocales, resolveLocaleForUser } from "@/lib/locale";
import { isAdminRole } from "@/lib/roles";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id;

  await ensureLocalePacksSeeded();

  const [user, membership, locales, resolvedLocale] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, preferredLocale: true },
    }),
    getGroupForUser(userId),
    listEnabledLocales(),
    resolveLocaleForUser(userId),
  ]);

  const isAdmin = isAdminRole(user?.role);

  return (
    <AmbientShell theme="theme-v2">
      <StatusBar left={["GROUP DASHBOARD", "LIVE"]} right={["OP-OMNI", "LOCALE"]} />
      <DashboardClient
        initialGroup={membership?.group ?? null}
        canManage={membership?.canManage ?? isAdmin}
        isAdmin={isAdmin}
        locales={locales}
        resolvedLocale={resolvedLocale}
        preferredLocale={user?.preferredLocale ?? "en"}
      />
    </AmbientShell>
  );
}
