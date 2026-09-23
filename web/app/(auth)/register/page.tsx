import { AmbientShell } from "@/components/layout/AmbientShell";
import { StatusBar } from "@/components/layout/StatusBar";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getLoginContent } from "@/lib/content";
import { isAnyLocale, localeFromDashboardLang } from "@/lib/invites";
import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const content = await getLoginContent();
  const sp = await searchParams;
  const pick = (key: string) => {
    const v = sp[key];
    return typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
  };

  const invite = pick("invite") ?? null;
  const group = pick("group") ?? null;
  if (!invite && !group) {
    redirect("/login?needInvite=1");
  }

  const lang = pick("lang") ?? null;
  const playable =
    isAnyLocale(lang) ? "en" : localeFromDashboardLang(lang) === "nl" ? "nl" : "en";

  const inviteContext = {
    invite,
    group,
    lang,
    diff: pick("diff") ?? null,
    co: pick("co") ?? null,
    cohort: pick("cohort") ?? null,
    seats: pick("seats") ?? null,
    initialLocale: playable as "en" | "nl",
  };

  return (
    <AmbientShell theme="theme-v2">
      <StatusBar left={content.statusLeft} right={content.statusRight} />
      <main className="omni-page">
        <RegisterForm content={content} inviteContext={inviteContext} />
      </main>
    </AmbientShell>
  );
}
